const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The main content of the user's journal entry
    content: { 
        type: String,
        required: true,
        trim: true
    },
    // Optional: A title for easier management/search
    title: {
        type: String,
        trim: true,
        default: 'Untitled Entry'
    },
    // Optional: Sentiment/Emotion tag from AI processing
    emotion: {
        type: String,
        trim: true,
        nullable: true
    }
}, { 
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);