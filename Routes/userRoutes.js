const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const { protect } = require('../Middleware/authMiddleware'); 

// STK Push Controller (you will create this)
const { stkPush, mpesaCallback, checkSubscription, toggleAutoRenew } = require('../controllers/mpesaController');

// ===== PROFILE =====
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('email');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            email: user.email
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ===== EMAIL VERIFY =====
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).send('<h1>Invalid Link</h1><p>This verification link is invalid or has expired.</p>');
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.send('<h1>Success!</h1><p>Your Aura account is verified. You can now <a href="/login">Login</a>.</p>');

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ===== STK PUSH =====
router.post('/pay', protect, stkPush);

// ===== MPESA CALLBACK =====
router.post('/mpesa-callback', mpesaCallback);

// ===== CHECK SUBSCRIPTION =====
router.get('/subscription', protect, checkSubscription);

// ===== AUTO-RENEW =====
router.post('/auto-renew', protect, toggleAutoRenew);

module.exports = router;
