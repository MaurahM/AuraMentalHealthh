// Routes/chatRoutes.js

const express = require('express');
const router = express.Router();
// Use lowercase 'middleware' for best practice, unless your folder is capitalized
const { protect } = require('../Middleware/authMiddleware'); 

// Import the entire controller object
const chatController = require('../controllers/chatController'); 

// @route POST /api/chat/message
// Access functions via the imported object
router.post('/message', protect, chatController.sendMessage);

// @route GET /api/chat/history
// Access functions via the imported object
router.get('/history', protect, chatController.getHistory);

// @route DELETE /api/chat/history
router.delete('/history', protect, chatController.clearHistory);

module.exports = router;