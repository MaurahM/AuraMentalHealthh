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
    // We store the IntaSend Invoice ID to track M-Pesa payments
    intasend_invoice_id: { 
        type: String,
        default: null
    },
    // Useful for STK Push troubleshooting
    phoneNumber: {
        type: String,
        default: null
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);