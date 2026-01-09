const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat'); 
const dns = require('dns');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 1. Set up the Email Transporter
// Ensure EMAIL_USER and EMAIL_PASS are set in Railway Variables
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Helps prevent connection blocks
    }
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

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
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    // ... (Keep your validation and DNS check code here) ...

    try {
        // ... (Keep your bcrypt hashing code here) ...

        const vToken = crypto.randomBytes(32).toString('hex');

        // --- PASTE THE NEW CODE STARTING HERE ---
        user = await User.create({
            username,
            email,
            password: hashedPassword,
            verificationToken: vToken,
            isVerified: false 
        });

        await Chat.create({ user: user._id, messages: [] });

        try {
            const verifyUrl = `https://auramentalhealthh-production.up.railway.app/api/user/verify/${vToken}`;
            
            await transporter.sendMail({
                from: `"Aura Support" <${process.env.EMAIL_USER}>`, 
                to: email,
                subject: "Verify your Aura Account",
                html: `<h2>Welcome to Aura, ${username}!</h2><p>Click below to verify:</p><a href="${verifyUrl}">Verify Now</a>`
            });

            return res.status(201).json({
                message: 'Sign-up successful! Please check your email to verify your account.'
            });

        } catch (emailError) {
            console.error('Email failed to send:', emailError);
            return res.status(201).json({
                message: 'Account created, but we had trouble sending the verification email. Please check your spam or contact support.'
            });
        }
        // --- PASTE ENDS HERE ---

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // CHECK VERIFICATION STATUS
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in. Check your inbox!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isPaid: user.isPaid || false,
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
exports.checkStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('isPaid');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ isPaid: user.isPaid });
    } catch (error) {
        res.status(500).json({ message: 'Server error checking status' });
    }
};