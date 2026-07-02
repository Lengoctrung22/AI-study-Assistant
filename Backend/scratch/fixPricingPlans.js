const mongoose = require('mongoose');
const PricingPlan = require('../models/PricingPlan');
require('dotenv').config({ path: '../.env' });

async function fix() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-study-assistant';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected.');

    const plans = await PricingPlan.find({});
    console.log('Current pricing plans in DB:');
    plans.forEach(p => {
      console.log(`- ID: ${p._id}, Code: ${p.code}, Name: ${p.name}, Price: ${p.price}, Duration: ${p.durationMonths}m, Active: ${p.isActive}`);
    });

    // 1. Remove duplicate 'monthly' plans if any.
    // Keep the first one, delete others.
    const seenCodes = new Set();
    for (const plan of plans) {
      if (seenCodes.has(plan.code)) {
        console.log(`Deleting duplicate plan with code: ${plan.code}, ID: ${plan._id}`);
        await PricingPlan.findByIdAndDelete(plan._id);
      } else {
        seenCodes.add(plan.code);
      }
    }

    // 2. Fix premium_3m duration if it is 1.
    const premium3m = await PricingPlan.findOne({ code: 'premium_3m' });
    if (premium3m) {
      if (premium3m.durationMonths !== 3) {
        console.log(`Fixing premium_3m duration from ${premium3m.durationMonths} to 3`);
        premium3m.durationMonths = 3;
        await premium3m.save();
      }
    }

    console.log('Fix complete.');
    
    // Print updated plans
    const updatedPlans = await PricingPlan.find({});
    console.log('Updated pricing plans in DB:');
    updatedPlans.forEach(p => {
      console.log(`- ID: ${p._id}, Code: ${p.code}, Name: ${p.name}, Price: ${p.price}, Duration: ${p.durationMonths}m, Active: ${p.isActive}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fix();
