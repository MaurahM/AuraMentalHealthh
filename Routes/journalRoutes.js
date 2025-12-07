const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { protect } = require('../Middleware/authMiddleware'); // Use your JWT middleware

// GET all journal entries for the logged-in user
router.get('/', protect, journalController.getJournalEntries); 

// POST a new journal entry
router.post('/', protect, journalController.createJournalEntry); 

// PUT/PATCH update an existing entry by ID
router.put('/:id', protect, journalController.updateJournalEntry); 

// DELETE an entry by ID
router.delete('/:id', protect, journalController.deleteJournalEntry); 

module.exports = router;