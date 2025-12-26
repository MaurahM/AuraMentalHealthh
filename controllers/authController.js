const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat'); 
const dns = require('dns');

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// DNS Check for Email Validity
const checkEmailDomain = (email) => {
    const domain = email.split('@')[1];
    return new Promise((resolve) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err || !addresses || addresses.length === 0) {
                resolve(false); 
            } else {
                resolve(true); 
            }
        });
    });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Validate Email Domain
        const isDomainValid = await checkEmailDomain(email);
        if (!isDomainValid) {
            return res.status(400).json({ message: 'The provided email domain is invalid or cannot receive mail.' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user (isPaid defaults to false in Schema)
        user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        // Create initial chat document
        await Chat.create({ user: user._id, messages: [] });

        res.status(201).json({
            message: 'Sign-up successful!',
            _id: user._id,
            username: user.username,
            email: user.email,
            isPaid: false, // New users start unpaid
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isPaid: user.isPaid || false, // Return payment status to frontend
                token: generateToken(user._id), 
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @route   GET /api/auth/status
// @desc    Check if the logged-in user has paid (Security check for Dashboard)
exports.checkStatus = async (req, res) => {
    try {
        // req.user.id comes from your protect middleware
        const user = await User.findById(req.user.id).select('isPaid');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ isPaid: user.isPaid });
    } catch (error) {
        res.status(500).json({ message: 'Server error checking status' });
    }
};