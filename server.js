// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Import route files
const authRoutes = require('./Routes/authRoutes');
const chatRoutes = require('./Routes/chatRoutes');
const journalRoutes = require('./Routes/journalRoutes');
const userRoutes = require('./Routes/userRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// ----- TRUST PROXY -----
// Needed for correct HTTPS redirection behind proxies (e.g., Heroku, Vercel)
app.set('trust proxy', 1);

// ----- HTTPS REDIRECT -----
// Only redirect if not HTTPS
app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

// ----- CORS -----
app.use(cors({
    origin: '*', // Or specify your frontend URL for security
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// ----- BODY PARSER -----
app.use(express.json());

// ----- RATE LIMITING -----
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ----- ROUTES -----
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/user', userRoutes);

// ----- HEALTH CHECK / BASE ROUTES -----
app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from API!' });
});

// ----- ERROR HANDLING -----
// Catch all unmatched routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ----- START SERVER -----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
