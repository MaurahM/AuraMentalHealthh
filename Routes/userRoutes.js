const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const { protect } = require('../Middleware/authMiddleware'); 

router.get('/profile', protect, async (req, res) => {
    try {
        // Only select the 'email' field
        const user = await User.findById(req.user._id).select('email'); 
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Only return 'id' and 'email'
        res.json({
            id: user._id,
            email: user.email
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// NEW ROUTE: This is what the email link hits
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find the user who has this verification token
        const user = await User.findOne({ 
            verificationToken: token 
        });

        if (!user) {
            return res.status(400).send('<h1>Invalid Link</h1><p>This verification link is invalid or has expired.</p>');
        }

        // Update the user
        user.isVerified = true;
        user.verificationToken = undefined; // Clear the token once used
        await user.save();

        // Send a nice success message (or redirect to your login page)
        res.send('<h1>Success!</h1><p>Your Aura account is verified. You can now <a href="login.html">Login</a>.</p>');

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;