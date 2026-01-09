const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat'); 
const dns = require('dns');
const crypto = require('crypto'); // NEW: For generating tokens
const nodemailer = require('nodemailer'); // NEW: For sending emails

// NEW: Set up the Email Transporter
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

exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const isDomainValid = await checkEmailDomain(email);
        if (!isDomainValid) {
            return res.status(400).json({ message: 'Invalid email domain.' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // NEW: Create a unique verification token
        const vToken = crypto.randomBytes(32).toString('hex');

        user = await User.create({
            username,
            email,
            password: hashedPassword,
            verificationToken: vToken, // NEW: Save to DB
            isVerified: false          // NEW: Default to false
        });

        await Chat.create({ user: user._id, messages: [] });

        // NEW: Send the Verification Email
        // Change 'your-site.com' to your actual Railway frontend URL
        const verifyUrl = `https://auramentalhealthh-production.up.railway.app/api/user/verify/${vToken}`;

        await transporter.sendMail({
            from: '"Aura Support" <info.auraafrica@gmail.com>',
            to: email,
            subject: "Verify your Aura Account",
            html: `<h2>Welcome to Aura, ${username}!</h2>
                   <p>Please click the button below to verify your account:</p>
                   <a href="${verifyUrl}" style="background:#ff2fa6; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Verify Now</a>`
        });

        res.status(201).json({
            message: 'Sign-up successful! Please check your email to verify your account.'
        });
        
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // NEW: Block login if not verified
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
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