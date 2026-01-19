const User = require('../models/User');

exports.verifyUser = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.send("Email verified successfully! You can now login.");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
