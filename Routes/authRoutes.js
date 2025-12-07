const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const router = express.Router();
const authController = require('../controllers/authController');
router.post('/signup', registerUser);
router.post('/login', loginUser);



module.exports = router;