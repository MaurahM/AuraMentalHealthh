const JournalEntry = require('../models/Journal');

// @route GET /api/journal
// @desc Get all entries for the authenticated user, sorted newest first
exports.getJournalEntries = async (req, res) => {
    try {
        const entries = await JournalEntry.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve journal entries.' });
    }
};

// @route POST /api/journal
// @desc Create a new journal entry
exports.createJournalEntry = async (req, res) => {
    const { content, title, emotion } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Journal content is required.' });
    }

    try {
        const newEntry = await JournalEntry.create({
            user: req.user._id,
            content,
            title: title || 'Untitled Entry',
            emotion 
        });
        res.status(201).json(newEntry);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create journal entry.' });
    }
};

// @route PUT /api/journal/:id
// @desc Update an existing journal entry
exports.updateJournalEntry = async (req, res) => {
    const { content, title, emotion } = req.body;

    try {
        const entry = await JournalEntry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found.' });
        }
        
        // Security Check: Ensure the entry belongs to the user
        if (entry.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this entry.' });
        }

        // Update fields if provided
        entry.content = content !== undefined ? content : entry.content;
        entry.title = title !== undefined ? title : entry.title;
        entry.emotion = emotion !== undefined ? emotion : entry.emotion;

        await entry.save();
        res.status(200).json(entry);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update journal entry.' });
    }
};

// @route DELETE /api/journal/:id
// @desc Delete a journal entry
exports.deleteJournalEntry = async (req, res) => {
    try {
        const entry = await JournalEntry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found.' });
        }
        
        // Security Check: Ensure the entry belongs to the user
        if (entry.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this entry.' });
        }

        await entry.deleteOne();
        res.status(200).json({ message: 'Journal entry deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete journal entry.' });
    }
};