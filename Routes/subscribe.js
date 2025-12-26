const axios = require('axios');

app.post('/api/pay/subscribe', async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await axios.post(
      'https://payment.intasend.com/api/v1/payment/',
      {
        public_key: process.env.INTASEND_PUBLIC_KEY,
        amount: amount || 500, // KES
        currency: 'KES',
        email,
        callback_url: `${process.env.BASE_URL}/api/intasend-webhook`,
        redirect_url: `${process.env.FRONTEND_URL}/payment-success`
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({
      payment_url: response.data.url
    });
  } catch (err) {
    console.error('Payment init error:', err.response?.data || err);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});
