// 1️⃣ Import dependencies
const mongoose = require('mongoose');
require('dotenv').config();

// 2️⃣ Connect to MongoDB
const mongoURI = process.env.MONGO_URI; // Make sure this is set in your .env
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB playground connected'))
  .catch(err => console.error('Connection error:', err));

// 3️⃣ Define a test schema and model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String, // in real apps, always store hashed passwords!
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 4️⃣ Test CRUD operations
async function runPlayground() {
  try {
    // CREATE
    const newUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: '123hashed', 
      phone: '+254700000000'
    });
    await newUser.save();
    console.log('User created:', newUser);

    // READ
    const users = await User.find();
    console.log('All users:', users);

    // UPDATE
    const updated = await User.findOneAndUpdate(
      { email: 'test@example.com' },
      { name: 'Updated Test User' },
      { new: true }
    );
    console.log('Updated user:', updated);

    // DELETE
    // const deleted = await User.findOneAndDelete({ email: 'test@example.com' });
    // console.log('Deleted user:', deleted);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

runPlayground();
