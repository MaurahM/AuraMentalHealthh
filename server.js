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

/**
 * 🇰🇪 INTASEND WEBHOOK
 * Note: Use only the path here. 
 * Dashboard URL in IntaSend should be: https://auramentalhealthh-production.up.railway.app/api/intasend-webhook
 */
app.post('/api/intasend-webhook', async (req, res) => {
    try {
        const payload = req.body;
        const { state, email, invoice_id, challenge } = payload;

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

// Listen on 0.0.0.0 for Railway compatibility
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));