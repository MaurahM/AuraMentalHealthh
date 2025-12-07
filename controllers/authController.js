const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat'); // Import Chat model
const authController = require('../controllers/authController'); 
const dns = require('dns');
// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};


    const checkEmailDomain = (email) => {
    const domain = email.split('@')[1];
    
    return new Promise((resolve) => {
        // 2. DNS/MX Record Check
        dns.resolveMx(domain, (err, addresses) => {
            // If there's an error (domain not found) OR no mail servers are configured
            if (err || !addresses || addresses.length === 0) {
                resolve(false); 
            } else {
                // MX records exist, meaning the domain can accept mail
                resolve(true); 
            }
        });
    });
};
// @route POST /api/auth/signup
// @desc Register a new user and create an initial chat document
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    console.log('Received Payload:', req.body);
    // Simple validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    

    try {

        // ----------------------------------------------------
        const isDomainValid = await checkEmailDomain(email);

        if (!isDomainValid) {
            return res.status(400).json({ message: 'The provided email domain is invalid or cannot receive mail.' });
        }
        // ----------------------------------------------------
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        // **CRITICAL: Create the initial chat document for the new user**
        await Chat.create({ user: user._id, messages: [] });

        if (user) {
            res.status(201).json({
                message: 'Sign-up successful! Log in to continue.',
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// AuthController.js
// @route POST /api/auth/login
// @desc Authenticate a user
// @route POST /api/auth/login
// @desc Authenticate a user
// @route POST /api/auth/login
// @desc Authenticate a user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('--- LOGIN START: Checking email:', email); 

        // 1. Check for user email
        const user = await User.findOne({ email });

        if (!user) {
            console.log('--- User Not Found.');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log('--- User Found. Comparing passwords...'); 

        // 2. Password comparison
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            console.log('--- Password Matched. Generating Token...'); 
            
            // 3. Token Generation and Response
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id), 
            });
        } else {
            console.log('--- Password Comparison Failed.');
            res.status(401).json({ message: 'Invalid credentials' });
        }
        
    } catch (error) {
        // !!! THIS IS THE CRITICAL CHANGE !!!
        console.error('SERVER LOGIN CRASH (ACTUAL ERROR):', error); 
        
        // Ensure you return the 500 status here
        res.status(500).json({ message: 'Server error: An unexpected issue occurred' });
    }
};

// authController.js (For JWT)

