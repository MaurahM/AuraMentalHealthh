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
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // DNS Validation
        const isDomainValid = await checkEmailDomain(email);
        if (!isDomainValid) {
            return res.status(400).json({ message: 'The provided email domain is invalid.' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create unique token for email verification
        const vToken = crypto.randomBytes(32).toString('hex');

        // Create new user (isVerified defaults to false)
        user = await User.create({
            username,
            email,
            password: hashedPassword,
            verificationToken: vToken,
            isVerified: false 
        });

        // Create initial chat document
        await Chat.create({ user: user._id, messages: [] });

        // Generate Verification Link 
        // Note: Using /api/user to match app.use('/api/user', userRoutes) in server.js
        const verifyUrl = `https://auramentalhealthh-production.up.railway.app/api/user/verify/${vToken}`;

        // Send Email
        await transporter.sendMail({
            from: '"Aura Support" <info.auraafrica@gmail.com>',
            to: email,
            subject: "Verify your Aura Account",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #ff2fa6; text-align: center;">Welcome to Aura, ${username}!</h2>
                    <p>Thank you for joining our community. To get started, please confirm your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verifyUrl}" style="background-color: #ff2fa6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify My Account</a>
                    </div>
                    <p style="font-size: 0.8em; color: #777;">If you did not create this account, you can safely ignore this email.</p>
                </div>
            `
        });

        res.status(201).json({
            message: 'Sign-up successful! Please check your email to verify your account.'
        });
        
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