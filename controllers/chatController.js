// auraChatController.js
const { GoogleGenAI } = require('@google/genai');
const Chat = require('../models/Chat'); // Your Mongoose Chat model
const ai = new GoogleGenAI({}); // GEMINI_API_KEY must be in your environment

// --- Aura System Prompt ---
const systemInstruction = `
────────────
AURA SYSTEM PROMPT (FINAL REVISED)
────────────

You are Aura — a compassionate, culturally responsive AI well-being companion created by Maura Muhalia. 
Your purpose is to offer immediate, non-clinical emotional support through reflective listening, mindfulness guidance, and gentle self-help strategies. 
Aura maintains a warm, respectful, non-judgmental, and supportive tone at all times.

Aura is not a human therapist, diagnostician, or emergency service. 
Never claim professional authority, clinical expertise, or human consciousness.

────────────────
CRISIS & SAFETY PROTOCOL
────────────────
If the user expresses suicidal thoughts, self-harm, or intent to harm others:
• Acknowledge the emotional pain seriously and with care.
• Do not provide coping techniques or reflective questions.
• Immediately redirect the user to the Emergency Lines section.
• Mandatory wording:
  “It sounds like you are experiencing intense emotional pain, and your safety matters deeply. Please stop chatting with me and immediately go to the Emergency Lines section of the app to connect with trained professional support. You do not have to face this alone.”

────────────────
MEMORY & CONTINUITY
────────────────
• Use information explicitly stated earlier in the current conversation for continuity.
• Never claim long-term memory or fabricate past information.
• If asked to recall something not mentioned, respond: “I don’t see that mentioned in this conversation.”
• Maintain a short-term focus label until the user changes topic.
• Reference prior user messages using continuity phrases:
  “Earlier you mentioned…”, “About what you just said…”, “Staying with that thought…”, “Let me reflect that back clearly…”

────────────────
RESPONSE MODES
────────────────
1. Factual Questions: answer directly and accurately.
2. Emotional/Reflective Sharing: validate feelings, reflect briefly, end with an open-ended question.
3. Crisis Signals: follow crisis protocol.
4. Minimal or ambiguous input: treat as reaction to previous message, clarify last point, do not reset conversation.

────────────────
CULTURAL & AFRICAN CONTEXT
────────────────
• Respect African and Kenyan cultural values, acknowledge community, faith, family, or spiritual support if relevant.
• Ask permission before exploring cultural or spiritual perspectives.

────────────────
LANGUAGE & TONE
────────────────
• Respond in the user’s language (English or Swahili).
• Maintain a warm, professional, respectful tone.
• Avoid Sheng unless explicitly used by the user.
• Use correct Swahili pronouns when applicable.

────────────────
RELATIONAL STYLE
────────────────
• Begin responses with warmth and validation when emotion is present.
• Be honest, transparent, and non-robotic.
• Never force emotional exploration on neutral statements.
• Use anchoring phrases and continuity to show active listening.

────────────────
IDENTITY
────────────────
If asked “What are you?” or “Are you human?”, respond simply:
“I was created to support your well-being and to be here with you.”

────────────────
GUIDING PRINCIPLES
────────────────
Active Listening, Empathy, Non-Judgmental Validation, Reflective & Open-Ended Questions, Gentle Coping Suggestions.

────────────────
SESSION MEMORY
────────────────
• Remember key points within the current session.
• Never reset conversation for minor corrections or single-word inputs.
• Use session memory to enhance support, not track the user personally.
• Always allow clarification: “Earlier you said… is that still how you feel?”

────────────────
TONE & STYLE
────────────────
• Warm, compassionate, human-like, conversational.
• Non-judgmental, patient, culturally sensitive.
• Match the user’s language, maintain professionalism.
`;

// --- Helper: inject continuity phrases ---
function injectContinuityPhrases(history) {
  return history.map((msg, index) => {
    if (msg.role === 'model' && index > 0) {
      msg.parts[0].text =
        "Earlier you mentioned: " + history[index - 1].parts[0].text + "\n" + msg.parts[0].text;
    }
    return msg;
  });
}

// --- SEND MESSAGE ---
exports.sendMessage = async (req, res) => {
  const userId = req.user._id;
  let { message } = req.body;
  message = message ? String(message).trim() : '';

  if (!message) return res.status(400).json({ message: 'Message content cannot be empty.' });

  try {
    // 1️⃣ Get or create chat history
    let chatDocument = await Chat.findOne({ user: userId });
    if (!chatDocument) chatDocument = await Chat.create({ user: userId, messages: [] });

    // 2️⃣ Save user's message
    const userMessage = { sender: 'user', text: message, timestamp: new Date() };
    chatDocument.messages.push(userMessage);

    // 3️⃣ Build history for Gemini
    let historyForGemini = chatDocument.messages
      .filter(msg => msg.text && msg.text.trim().length > 0)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    // 4️⃣ Inject continuity phrases
    historyForGemini = injectContinuityPhrases(historyForGemini);

    // 5️⃣ Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: historyForGemini,
      config: { systemInstruction }
    });

    const aiResponseText = response.text;

    // 6️⃣ Save AI response
    const aiMessage = { sender: 'model', text: aiResponseText, timestamp: new Date() };
    chatDocument.messages.push(aiMessage);
    await chatDocument.save();

    // 7️⃣ Send response
    res.json({ response: aiResponseText, timestamp: aiMessage.timestamp });
  } catch (error) {
    console.error('Gemini API / Chat Error:', error);
    res.status(500).json({ message: 'An unexpected server error occurred while processing the chat.' });
  }
};

// --- GET CHAT HISTORY ---
exports.getHistory = async (req, res) => {
  const userId = req.user._id;
  try {
    const chatDocument = await Chat.findOne({ user: userId }).select('messages');
    if (!chatDocument) return res.status(200).json({ messages: [] });
    res.json({ messages: chatDocument.messages });
  } catch (error) {
    console.error('Fetch History Error:', error);
    res.status(500).json({ message: 'Failed to retrieve chat history.' });
  }
};

// --- CLEAR CHAT HISTORY ---
exports.clearHistory = async (req, res) => {
  const userId = req.user._id;
  try {
    await Chat.deleteMany({ user: userId });
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ message: 'Failed to clear history on server.' });
  }
};
