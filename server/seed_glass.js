require('dotenv').config();
const mongoose = require('mongoose');
const Setting = require('./models/Setting');

const glassTypes = [
  { id: "1", name: 'Single Vision (CR-39)', price: 500 },
  { id: "2", name: 'Single Vision (ARC)', price: 800 },
  { id: "3", name: 'Blue Cut (Zero Power)', price: 1000 },
  { id: "4", name: 'Blue Cut (Powered)', price: 1200 },
  { id: "5", name: 'Bifocal (Kryptok)', price: 600 },
  { id: "6", name: 'Bifocal (D-Top)', price: 900 },
  { id: "7", name: 'Progressive (Basic)', price: 1500 },
  { id: "8", name: 'Progressive (Premium)', price: 3500 },
  { id: "9", name: 'Photochromic (Basic)', price: 1200 },
  { id: "10", name: 'Photochromic ARC', price: 1800 },
  { id: "11", name: 'Polycarbonate (Unbreakable)', price: 2000 },
  { id: "12", name: 'High Index 1.61', price: 2500 },
  { id: "13", name: 'High Index 1.67', price: 3500 },
  { id: "14", name: 'High Index 1.74', price: 5000 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/opticalcrm');
    
    // Check if sales category exists
    let salesSettings = await Setting.find({ category: 'sales' });
    
    // Find if glassTypes already exists
    let glassSetting = await Setting.findOne({ category: 'sales', key: 'glassTypes' });
    
    if (glassSetting) {
      glassSetting.value = glassTypes;
      await glassSetting.save();
    } else {
      await Setting.create({
        category: 'sales',
        key: 'glassTypes',
        value: glassTypes
      });
    }
    
    console.log('Successfully seeded glass types!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
