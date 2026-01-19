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
        type: Date,
        default: null
    },
    subscriptionExpiry: {
        type: Date,
        default: null
    },

    // --- M-PESA STK PUSH FIELDS ---
    mpesaCheckoutRequestID: {
        type: String,
        default: null
    },
    mpesaMerchantRequestID: {
        type: String,
        default: null
    },
    mpesaStatus: {
        type: String,
        default: null
    },

    phoneNumber: {
        type: String,
        default: null
    },

    // --- RENEWAL REMINDER / AUTO-RENEW ---
    autoRenew: {
        type: Boolean,
        default: false
    },
    renewalReminderSent: {
        type: Boolean,
        default: false
    },

    // --- EMAIL VERIFICATION FIELDS ---
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: null
    },

    // OPTIONAL (for future upgrades)
    subscriptionPrice: {
        type: Number,
        default: 300
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
