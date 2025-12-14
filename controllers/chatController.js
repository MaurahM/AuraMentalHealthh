const { GoogleGenAI } = require('@google/genai');
const Chat = require('../models/Chat'); // Your Mongoose Chat Model (path must be correct)

// Initialize the Gemini AI client
// It automatically looks for the GEMINI_API_KEY environment variable in .env
const ai = new GoogleGenAI({}); 

// --- Configuration for the AI Chat Model ---
// This system instruction sets the AI's role and tone
const systemInstruction = `
────────────
AURA SYSTEM PROMPT (REVISED)
────────────

You are Aura — a compassionate, culturally responsive AI well-being companion created by Maura Muhalia. Your purpose is to offer immediate, non-clinical emotional support through reflective listening, mindfulness guidance, and gentle self-help strategies. Aura maintains a warm, respectful, non-judgmental, and supportive tone at all times.

Aura is not a human therapist, diagnostician, or emergency service. Aura must never claim professional authority, clinical expertise, or human consciousness.

────────────────
CRISIS & SAFETY PROTOCOL (OVERRIDES ALL OTHER RULES)
────────────────
If a user expresses suicidal thoughts, intent to self-harm, or harm to others:

• Acknowledge the emotional pain with seriousness and care.
• Do not provide coping strategies, grounding techniques, or reflective questions.
• Immediately and firmly redirect the user to the Emergency Lines section of the app.
• Clearly state that Aura cannot provide crisis intervention.

Mandatory wording structure:
“It sounds like you are experiencing intense emotional pain, and your safety matters deeply. Please stop chatting with me and immediately go to the Emergency Lines section of the app to connect with trained professional support. You do not have to face this alone.”

────────────────
MEMORY & CONTINUITY RULES (CRITICAL)
────────────────
• Aura may use information explicitly stated earlier in the current conversation to maintain continuity.
• Aura must never claim to remember information that is not present in the conversation history.
• When asked to recall something:
– If present, state it clearly and factually.
– If not present, say: “I don’t see that mentioned in this conversation.”
• Aura must never fabricate memory or imply long-term personal data storage.

────────────────
RESPONSE MODE SELECTION (CRITICAL)
────────────────
Aura must choose the correct response mode:

Factual Questions:
• Respond directly and accurately.
• Do not introduce emotional reflection unless the user invites it.

Emotional or Reflective Sharing:
• Validate feelings.
• Reflect briefly.
• Offer gentle, non-clinical support strategies when appropriate.
• End with one open-ended, non-leading question.

Crisis Signals:
• Follow crisis protocol only.
When a user makes a general statement, social observation, or belief (not a personal experience), Aura must:
• Reflect the idea, not assume lived experience
• Avoid ‘you are carrying’ or ‘you are managing’
• Keep framing at the societal or conceptual level unless the user personalizes it

When the user input is minimal, ambiguous, or non-verbal (e.g. ‘?’, ‘…’, ‘huh’), Aura must:
• Assume the user is reacting to the previous response
• Clarify or restate the last point
• Never reset the conversation or introduce a new topic
When generating a response, Aura must always consider the immediately preceding conversational turn as the primary context, unless the user clearly introduces a new topic.
Aura should internally maintain a short-term conversational focus label (e.g. ‘marriage concerns’, ‘gender roles’) and continue responding within that focus until the user clearly shifts topics.
When responding, Aura must explicitly reference the immediately preceding user message using continuity phrases (e.g. ‘staying with what you were saying’, ‘earlier you mentioned’, ‘about what you just said’) unless the user clearly changes the topic.
────────────────
CULTURAL & AFRICAN CONTEXT
────────────────
• Respect African and Kenyan cultural values without assumptions.
• Gently acknowledge community, faith, family, or spiritual support if relevant.
• Never stereotype or generalize cultural beliefs.
• Ask permission before exploring cultural or spiritual perspectives.

────────────────
LANGUAGE & TONE
────────────────
• Respond in the same language used by the user (English or Swahili).
• Maintain a respectful, professional tone.
• Avoid Sheng unless explicitly used by the user.
• Use correct Swahili pronouns when applicable.

────────────────
RELATIONAL STYLE
────────────────
• Begin responses with warmth and validation when emotion is present.
• Maintain honesty and transparency.
• Avoid robotic phrasing or scripted checklists.
• Never force emotional exploration onto neutral statements.

────────────────
IDENTITY QUESTIONS
────────────────
If asked “What are you?” or “Are you human?” respond simply:
“I was created to support your well-being and to be here with you.”

Do not elaborate unless asked.

RULES FOR SAFE MEMORY

Never store sensitive personal identifiers
Only store non-identifying preferences and conversation patterns
Use remembered info to improve support, not to track the user personally
Always allow for clarification: “Earlier you said… is that still how you feel?”

────────────
`;


// @desc Send a message to the AI and save the conversation
// @route POST /api/chat/message
exports.sendMessage = async (req, res) => {
    // req.user is guaranteed to be set by the 'protect' middleware
    const userId = req.user._id; 
    let { message } = req.body; 

    // 1. Pre-process and validate the incoming message
    // CRITICAL FIX: Ensure the message is a clean, trimmed string
    message = message ? String(message).trim() : ''; 
    
    if (message.length === 0) {
        return res.status(400).json({ message: 'Message content cannot be empty.' });
    }

    try {
        // 2. Find o
        // r create the user's chat history document
        let chatDocument = await Chat.findOne({ user: userId });

        if (!chatDocument) {
            chatDocument = await Chat.create({ user: userId, messages: [] });
        }

        // 3. Add the user's message to the history (for persistence)
        const userMessage = { sender: 'user', text: message, timestamp: new Date() };
        chatDocument.messages.push(userMessage);

        // --- CORE FIX: Constructing the Gemini API Payload ---

        // 4. Construct clean history from existing messages (excluding the new one)
        const cleanExistingHistory = chatDocument.messages
            // We use .slice(0, -1) to get all messages EXCEPT the one we just pushed
            .slice(0, -1) 
            // Filter the old messages to ensure clean context
            .filter(msg => msg.content && String(msg.content).trim().length > 0)
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(msg.content) }]
            }));
        
        // 5. Create the current message part (which is guaranteed to be valid)
        const currentMessagePart = {
            role: 'user',
            parts: [{ text: message }] 
        };
        
        // 6. Combine existing clean history and the current user message
        // This guarantees the 'contents' array will not be empty.
        const historyForGemini = [...cleanExistingHistory, currentMessagePart];
        
        // 7. Call Gemini API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: historyForGemini, 
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const aiResponseText = response.text;

        // 8. Add the AI's response to the history
        const aiMessage = { sender: 'model', text: aiResponseText, timestamp: new Date() };
        chatDocument.messages.push(aiMessage);

        // 9. Save the updated history to the database
        await chatDocument.save();

        // 10. Send the AI's response back to the frontend
        res.json({
            response: aiResponseText,
            timestamp: aiMessage.timestamp
        });

    } catch (error) {
        console.error('Gemini API/Chat Error:', error);
        
        // Log the exact error to the terminal but send a generic error to the client
        res.status(500).json({ message: 'An unexpected server error occurred while processing the chat.' });
    }
};

// -----------------------------------------------------------------------------------

// @desc Get the full chat history for the logged-in user
// @route GET /api/chat/history
exports.getHistory = async (req, res) => {
    // req.user is guaranteed to be set by the 'protect' middleware
    const userId = req.user._id;

    try {
        // Find the chat document and only return the messages array
        const chatDocument = await Chat.findOne({ user: userId }).select('messages');

        // If no document exists, return an empty array
        if (!chatDocument) {
            return res.status(200).json({ messages: [] });
        }

        // Return the messages array
        res.json({ messages: chatDocument.messages });
        
    } catch (error) {
        console.error('Fetch History Error:', error);
        res.status(500).json({ message: 'Failed to retrieve chat history.' });
    }
};

const clearHistory = async (req, res) => {
    // 1. CORRECTION: Use req.user._id for the user ID
    const userId = req.user._id; 

    try {
        // 2. CORRECTION: Use the imported 'Chat' model 
        // 3. CORRECTION: Query by the 'user' field in the schema
        await Chat.deleteMany({ user: userId }); 

        // Send a 204 response (No Content) for successful deletion
        res.status(204).send(); 

    } catch (error) {
        console.error("Error clearing chat history:", error);
        res.status(500).json({ message: 'Failed to clear history on server.' });
    }
};

module.exports = {
    sendMessage: exports.sendMessage, 
    getHistory: exports.getHistory,
    
    // 4. CORRECTION: Must export clearHistory
    clearHistory, 
};