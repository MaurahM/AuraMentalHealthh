require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');
// Import Route files
const authRoutes = require('./Routes/authRoutes');
const chatRoutes = require('./Routes/chatRoutes');
const journalRoutes = require('./Routes/journalRoutes');
const userRoutes = require('./Routes/userRoutes');

// Connect to Database
connectDB();

const app = express();

// 🔑 CORRECTION: Place 'trust proxy' here, immediately after app initialization.
// This tells Express to recognize proxy headers before any middleware runs.
app.set('trust proxy', 1);

// Custom Middleware for HTTPS Redirect (Now correctly uses trusted headers)
app.use((req, res, next) => {
  // Render's proxy sets 'x-forwarded-proto' to 'http' or 'https'
  // When 'trust proxy' is set, this check is reliable.
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});


// Middleware
app.use(cors({
    origin: 'https://auramentalhealthh-1.onrender.com', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, 
})); 
app.use(express.json()); 

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;

// Example API route
app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from API!' });
});

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));