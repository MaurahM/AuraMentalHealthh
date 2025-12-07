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

module.exports = router;