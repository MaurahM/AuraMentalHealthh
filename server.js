require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./Routes/authRoutes');
const chatRoutes = require('./Routes/chatRoutes');
const journalRoutes = require('./Routes/journalRoutes');
const userRoutes = require('./Routes/userRoutes');
const mpesaRoutes = require('./Routes/mpesaRoutes');

connectDB();
const app = express();

// 🔑 Security/Proxy settings - Important for Railway/Rate Limiting
app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// M-PESA STK Push Routes
app.use('/api/mpesa', mpesaRoutes);

// Standard Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => res.send('Aura API - Mpesa Ready 🚀'));

const session = require('express-session');
const passport = require('passport');

app.use(session({
  secret: 'yourSecret',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', require('./Routes/authGoogle'));


// Listen on 0.0.0.0 for Railway compatibility
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
