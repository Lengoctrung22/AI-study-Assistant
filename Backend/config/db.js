const mongoose = require('mongoose');
const PricingPlan = require('../models/PricingPlan');
const User = require('../models/User');

const seedPricingPlans = async () => {
  try {
    const count = await PricingPlan.countDocuments();
    if (count === 0) {
      await PricingPlan.create([
        {
          name: 'Gói Premium Tháng',
          code: 'monthly',
          price: 99000,
          durationMonths: 1,
          description: 'Gói trải nghiệm đầy đủ tính năng Premium theo tháng',
          features: [
            'Chat với AI Gia sư 24/7',
            'Không giới hạn tạo Flashcards & Quiz',
            'Phân tích tài liệu chuyên sâu',
            'Kế hoạch học tập AI cá nhân hóa',
            'Không quảng cáo'
          ],
          isActive: true
        },
        {
          name: 'Gói Premium Năm',
          code: 'yearly',
          price: 799000,
          durationMonths: 12,
          description: 'Gói tiết kiệm nhất dành cho học sinh, sinh viên học tập lâu dài',
          features: [
            'Tiết kiệm đến 33% so với gói tháng',
            'Đầy đủ quyền lợi Premium của gói tháng',
            'Hỗ trợ kỹ thuật ưu tiên 24/7',
            'Cập nhật sớm các tính năng AI mới nhất'
          ],
          isActive: true
        }
      ]);
      console.log('✅ Default pricing plans seeded successfully.');
    }
  } catch (err) {
    console.error('❌ Failed to seed default pricing plans:', err.message);
  }
};

const crypto = require('crypto');

const seedAdminUser = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase();
    let adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      if (!adminPassword || adminPassword === '123123') {
        if (process.env.NODE_ENV === 'production') {
          adminPassword = crypto.randomBytes(16).toString('hex');
          // Write password to a secure temp file instead of logging it to console
          const fs = require('fs');
          const path = require('path');
          const credFile = path.join(__dirname, '..', '.admin_credentials_DELETEME');
          fs.writeFileSync(credFile, `Admin Email: ${adminEmail}\nAdmin Password: ${adminPassword}\n\n⚠️ DELETE THIS FILE IMMEDIATELY AFTER READING!\n`, { mode: 0o600 });
          console.warn(`🔒 Admin account created. Credentials written to ${credFile} — READ AND DELETE THIS FILE IMMEDIATELY.`);
        } else {
          adminPassword = '123123';
          console.warn(`⚠️ WARNING: Admin seeded with default development password (123123). Please set ADMIN_INITIAL_PASSWORD in .env!`);
        }
      }

      await User.create({
        name: 'Quản trị viên',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        plan: 'free'
      });
      console.log(`✅ Default admin account (${adminEmail}) seeded successfully.`);
    }
  } catch (err) {
    console.error('❌ Failed to seed admin user:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await seedPricingPlans();
    await seedAdminUser();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
