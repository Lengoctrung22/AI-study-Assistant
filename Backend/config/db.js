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

const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      await User.create({
        name: 'Quản trị viên',
        email: 'admin@gmail.com',
        password: '123123',
        role: 'admin',
        plan: 'free'
      });
      console.log('✅ Admin user admin@gmail.com seeded successfully.');
    } else {
      adminExists.password = '123123';
      adminExists.role = 'admin';
      await adminExists.save();
      console.log('✅ Admin user admin@gmail.com updated with password 123123 and role admin.');
    }
  } catch (err) {
    console.error('❌ Failed to seed admin user:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await seedPricingPlans();
    await seedAdminUser();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
