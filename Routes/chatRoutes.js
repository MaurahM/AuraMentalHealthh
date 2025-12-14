// routes/chatRoutes.js

const express = require('express');
const router = express.Router();

// Import your authentication middleware
// 'protect' ensures that only logged-in users can access the chat routes
const { protect } = require('../middleware/authMiddleware'); 

// Import all chat controller functions
const chatController = require('../controllers/chatController'); 

/**
 * @route   POST /api/chat/message
 * @desc    Send a message to Aura and receive AI response
 * @access  Private (requires authentication)
 */
router.post('/message', protect, chatController.sendMessage);

/**
 * @route   GET /api/chat/history
 * @desc    Get full chat history for the logged-in user
 * @access  Private
 */
router.get('/history', protect, chatController.getHistory);

/**
 * @route   DELETE /api/chat/history
 * @desc    Clear chat history for the logged-in user
 * @access  Private
 */
router.delete('/history', protect, chatController.clearHistory);

module.exports = router;
