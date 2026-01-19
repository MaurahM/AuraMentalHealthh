const axios = require('axios');
const User = require('../models/User');

const generatePassword = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

exports.stkPush = async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Mpesa STK Push here (use your own credentials)
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const auth = Buffer.from(consumerKey + ':' + consumerSecret).toString('base64');

    const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    const token = tokenRes.data.access_token;

    const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount || 500,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.BASE_URL}/api/user/mpesa-callback`,
      AccountReference: "Aura Subscription",
      TransactionDesc: "Aura Monthly Subscription"
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const { CheckoutRequestID, MerchantRequestID } = stkRes.data;

    user.mpesaCheckoutRequestID = CheckoutRequestID;
    user.mpesaMerchantRequestID = MerchantRequestID;
    user.mpesaStatus = "PENDING";
    await user.save();

    res.json({ message: "STK Push sent", CheckoutRequestID });

  } catch (error) {
    console.error("STK Error:", error.response?.data || error.message);
    res.status(500).json({ message: "STK Push failed" });
  }
};

exports.mpesaCallback = async (req, res) => {
  try {
    const data = req.body.Body.stkCallback;

    const CheckoutRequestID = data.CheckoutRequestID;
    const resultCode = data.ResultCode;

    const user = await User.findOne({ mpesaCheckoutRequestID: CheckoutRequestID });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (resultCode === 0) {
      user.mpesaStatus = "SUCCESS";
      user.isPaid = true;

      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);

      user.subscriptionDate = new Date();
      user.subscriptionExpiry = expiry;
      await user.save();

      return res.status(200).json({ message: "Payment confirmed" });
    }

    user.mpesaStatus = "FAILED";
    await user.save();

    res.status(200).json({ message: "Payment failed" });

  } catch (error) {
    console.error("Callback Error:", error.message);
    res.status(500).json({ message: "Callback failed" });
  }
};

exports.checkSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      isPaid: user.isPaid,
      subscriptionExpiry: user.subscriptionExpiry
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to check subscription" });
  }
};

exports.toggleAutoRenew = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.autoRenew = !user.autoRenew;
    await user.save();

    res.json({ autoRenew: user.autoRenew });

  } catch (error) {
    res.status(500).json({ message: "Failed to update auto-renew" });
  }
};
