const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-study-assistant';
  console.log('Connecting to MongoDB at:', uri);
  
  await mongoose.connect(uri);
  console.log('Connected!');

  const emailArg = process.argv[2];

  if (!emailArg) {
    console.log('\n--- Existing Users ---');
    const users = await User.find({}, 'name email role plan');
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      users.forEach(u => {
        console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Plan: ${u.plan}`);
      });
    }
    console.log('\nUsage: node promoteAdmin.js <email_to_promote>');
    process.exit(0);
  }

  const user = await User.findOne({ email: emailArg });
  if (!user) {
    console.error(`User with email ${emailArg} not found.`);
    process.exit(1);
  }

  user.role = 'admin';
  await user.save();
  console.log(`Successfully promoted ${user.name} (${user.email}) to admin!`);
  
  mongoose.disconnect();
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
