require('dotenv').config(); // Load .env file at the start
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

// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500', // ⚠️ Replace this with the actual URL/Port of the HTML file, e.g., 'http://127.0.0.1:5500'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Needed if you use cookies or headers across origins
})); // Allows frontend to make requests
app.use(express.json()); // Allows parsing of JSON request body

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