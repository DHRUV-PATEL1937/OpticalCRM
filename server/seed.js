require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const config = require('./config');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@opticalcrm.com',
      phone: '9999999999',
      password: 'admin123',
      role: 'admin',
      branch: 'main',
    });
    console.log('✅ Admin created: admin@opticalcrm.com / admin123');

    // Create staff user
    await User.create({
      name: 'Staff User',
      email: 'staff@opticalcrm.com',
      phone: '8888888888',
      password: 'staff123',
      role: 'staff',
      branch: 'main',
    });
    console.log('✅ Staff created: staff@opticalcrm.com / staff123');

    // Seed products
    const products = [
      { name: 'Ray-Ban Aviator Classic', category: 'frames', brand: 'Ray-Ban', model: 'RB3025', color: 'Gold', size: '58', type: 'full-rim', material: 'Metal', gender: 'unisex', costPrice: 3500, sellingPrice: 6990, mrp: 7990, stockQuantity: 25, lowStockThreshold: 5 },
      { name: 'Ray-Ban Wayfarer', category: 'sunglasses', brand: 'Ray-Ban', model: 'RB2140', color: 'Black', size: '52', type: 'full-rim', material: 'Acetate', gender: 'unisex', costPrice: 4000, sellingPrice: 7490, mrp: 8490, stockQuantity: 18, lowStockThreshold: 5 },
      { name: 'Titan Eye Plus Rectangle', category: 'frames', brand: 'Titan', model: 'T2001', color: 'Blue', size: '54', type: 'full-rim', material: 'TR90', gender: 'male', costPrice: 800, sellingPrice: 1990, mrp: 2490, stockQuantity: 40, lowStockThreshold: 10 },
      { name: 'Essilor Crizal Single Vision', category: 'lenses', brand: 'Essilor', model: 'Crizal-SV', color: 'Clear', type: 'single-vision', costPrice: 1200, sellingPrice: 2990, mrp: 3490, stockQuantity: 100, lowStockThreshold: 20 },
      { name: 'Essilor Varilux Progressive', category: 'lenses', brand: 'Essilor', model: 'Varilux-X', color: 'Clear', type: 'progressive', costPrice: 5000, sellingPrice: 11990, mrp: 13990, stockQuantity: 30, lowStockThreshold: 10 },
      { name: 'Johnson & Johnson Acuvue', category: 'contact_lenses', brand: 'Johnson & Johnson', model: 'Acuvue-Oasys', color: 'Clear', costPrice: 600, sellingPrice: 1290, mrp: 1490, stockQuantity: 50, lowStockThreshold: 15 },
      { name: 'Bausch+Lomb Solution 360ml', category: 'solutions', brand: 'Bausch+Lomb', model: 'ReNu', costPrice: 150, sellingPrice: 350, mrp: 399, stockQuantity: 60, lowStockThreshold: 15 },
      { name: 'Oakley Holbrook', category: 'sunglasses', brand: 'Oakley', model: 'OO9102', color: 'Matte Black', size: '55', type: 'full-rim', material: 'O Matter', gender: 'male', costPrice: 5000, sellingPrice: 9990, mrp: 11990, stockQuantity: 12, lowStockThreshold: 3 },
      { name: 'Vogue Cat Eye Frame', category: 'frames', brand: 'Vogue', model: 'VO5286', color: 'Tortoise', size: '51', type: 'full-rim', material: 'Acetate', gender: 'female', costPrice: 1500, sellingPrice: 3490, mrp: 3990, stockQuantity: 22, lowStockThreshold: 5 },
      { name: 'Microfiber Cleaning Cloth', category: 'accessories', brand: 'Generic', model: 'CLN-001', color: 'Blue', costPrice: 20, sellingPrice: 99, mrp: 149, stockQuantity: 200, lowStockThreshold: 50 },
      { name: 'Hard Shell Eyeglass Case', category: 'accessories', brand: 'Generic', model: 'CSE-001', color: 'Black', costPrice: 50, sellingPrice: 199, mrp: 249, stockQuantity: 150, lowStockThreshold: 30 },
      { name: 'Lenskart Air Rimless', category: 'frames', brand: 'Lenskart', model: 'LA-Air-01', color: 'Silver', size: '52', type: 'rimless', material: 'Titanium', gender: 'unisex', costPrice: 600, sellingPrice: 1499, mrp: 1999, stockQuantity: 35, lowStockThreshold: 8 },
    ];

    for (const p of products) {
      p.createdBy = admin._id;
      p.tax = 18;
      await Product.create(p);
    }
    console.log(`✅ ${products.length} products seeded`);

    // Seed customers
    const customers = [
      { name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', gender: 'male', category: 'premium', address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }, dateOfBirth: new Date('1990-06-15'), totalPurchases: 5, totalSpent: 25000 },
      { name: 'Priya Patel', phone: '9876543211', email: 'priya@example.com', gender: 'female', category: 'vip', address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400002' }, dateOfBirth: new Date('1985-11-22'), totalPurchases: 12, totalSpent: 78000 },
      { name: 'Amit Kumar', phone: '9876543212', gender: 'male', category: 'regular', address: { city: 'Delhi', state: 'Delhi', pincode: '110001' }, totalPurchases: 2, totalSpent: 5000 },
      { name: 'Sneha Reddy', phone: '9876543213', email: 'sneha@example.com', gender: 'female', category: 'regular', address: { city: 'Hyderabad', state: 'Telangana', pincode: '500001' }, dateOfBirth: new Date('1995-03-08'), totalPurchases: 1, totalSpent: 3000 },
      { name: 'Vikram Singh', phone: '9876543214', gender: 'male', category: 'premium', address: { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' }, totalPurchases: 8, totalSpent: 42000 },
    ];
    await Customer.insertMany(customers);
    console.log(`✅ ${customers.length} customers seeded`);

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
