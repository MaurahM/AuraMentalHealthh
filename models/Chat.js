const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schema for individual messages
const MessageSchema = new Schema({
    sender: {
        type: String, // 'user' or 'ai'
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ChatSchema = new Schema({
    // Links the chat session to a specific user
    user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true // Add this for faster lookups
},
    messages: [MessageSchema] // Array of messages
});

module.exports = mongoose.model('Chat', ChatSchema);