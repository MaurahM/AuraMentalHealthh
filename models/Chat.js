const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schema for individual messages
const MessageSchema = new Schema({
    sender: {
        type: String, // 'user' or 'model'
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
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    messages: [MessageSchema]
});

module.exports = mongoose.model('Chat', ChatSchema);
