require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');
const User = require('./models/User');

const authRoutes = require('./Routes/authRoutes');
const chatRoutes = require('./Routes/chatRoutes');
const journalRoutes = require('./Routes/journalRoutes');
const userRoutes = require('./Routes/userRoutes');

connectDB();
const app = express();

// 🔑 Security/Proxy settings
app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: '*', credentials: true })); 
app.use(express.json()); 

// Rate Limiter to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100 
});
app.use(limiter);

/**
 * 🇰🇪 INTASEND WEBHOOK
 * Dashbord URL: https://your-app.com/api/intasend-webhook
 */
app.post('https://auramentalhealthh-production.up.railway.app/api/intasend-webhook/api/intasend-webhook', async (req, res) => {
    try {
        const payload = req.body;
        const { state, email, invoice_id, challenge } = payload;
        // Add this inside your server.js webhook route
        const secret = process.env.INTASEND_SECRET_KEY;
// Intasend sends a signature you can check to be 100% sure the money is real.
        // 1. IntaSend periodic security check (Challenge)
        if (challenge) {
            console.log("IntaSend Challenge Received");
            return res.status(200).json({ challenge: challenge });
        }

        console.log(`📡 Webhook Update: ${state} for ${email}`);

        // 2. If payment is COMPLETE, unlock the user
        if (state === 'COMPLETE') {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); // 30 Day Subscription

            await User.findOneAndUpdate(
                { email: email },
                { 
                    isPaid: true, 
                    subscriptionDate: new Date(),
                    subscriptionExpiry: expiryDate,
                    intasend_invoice_id: invoice_id 
                }
            );
            
            console.log(`✅ ${email} is now Premium until ${expiryDate.toDateString()}`);
        }

        res.status(200).send('Webhook Received');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send('Internal Error');
    }
});

// Standard Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => res.send('Aura API - IntaSend Ready 🚀'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));