const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    // --- SUBSCRIPTION FIELDS ---
    isPaid: { 
        type: Boolean, 
        default: false 
    },
    subscriptionDate: { 
        type: Date 
    },
    subscriptionExpiry: { 
        type: Date 
    },
    intasend_invoice_id: { 
        type: String,
        default: null
    },
    phoneNumber: {
        type: String,
        default: null
    },
    // --- EMAIL VERIFICATION FIELDS ---
    isVerified: { 
        type: Boolean, 
        default: false // New users must verify before this becomes true
    },
    verificationToken: { 
        type: String,
        default: null
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);