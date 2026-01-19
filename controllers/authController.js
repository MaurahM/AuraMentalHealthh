const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const dns = require('dns');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const checkEmailDomain = (email) => {
    const domain = email.split('@')[1];
    return new Promise((resolve) => {
        dns.resolve(domain, (err, addresses) => {
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
            return res.status(400).json({ message: 'The provided email domain is invalid.' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const vToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            verificationToken: vToken,
            isVerified: false
        });

        await Chat.create({ user: user._id, messages: [] });

        const verifyUrl = `${process.env.BASE_URL}/api/user/verify/${vToken}`;

        await transporter.sendMail({
            from: `"Aura Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verify your Aura Account",
            html: `
                <h2>Welcome to Aura, ${username}!</h2>
                <p>Click below to verify:</p>
                <a href="${verifyUrl}" style="background:#ff2fa6; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
                    Verify Now
                </a>`
        });

        transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.log("Email Error:", err);
  } else {
    console.log("Email Sent:", info.response);
  }
});

        return res.status(201).json({
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
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isPaid: user.isPaid || false,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

exports.checkStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('isPaid');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ isPaid: user.isPaid });
    } catch (error) {
        res.status(500).json({ message: 'Server error checking status' });
    }
};
