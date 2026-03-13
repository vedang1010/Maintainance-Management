/**
 * Seed Data Script for Society Management System
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Maintenance = require('../models/Maintenance');
const PaymentLog = require('../models/PaymentLog');
const LiftEmergency = require('../models/LiftEmergency');
const Complaint = require('../models/Complaint');
const GateLog = require('../models/GateLog');
const Asset = require('../models/Asset');
const Building = require('../models/Building');

const connectDB = require('../config/db');


// ============================================
// BUILDING
// ============================================

async function seedBuilding() {

  const building = await Building.create({

    name: "Ambica Apartment",
    address: "Ghatkopar East",
    city: "Mumbai",

    floors: 7,
    total_flats: 28,

    maintenance_due_day: 10,

    flats: [
      { flat_no: "101", area: 900 },
      { flat_no: "102", area: 950 },
      { flat_no: "103", area: 900 },
      { flat_no: "104", area: 800 },
      { flat_no: "105", area: 870 }
    ],

    maintenance_templates: [
      {
        name: "Default Template",
        is_default: true,

        components: [

          {
            name: "Water",
            type: "fixed",
            rate: 300
          },

          {
            name: "Security",
            type: "per_flat",
            rate: 200
          },

          {
            name: "Common Electricity",
            type: "per_sqft",
            rate: 2
          }

        ]
      }
    ],

    parking_rules: [
      { type: "2wheeler", monthly_charge: 50 },
      { type: "4wheeler", monthly_charge: 200 }
    ],

    penalty_rules: [
      {
        days_after_due: 5,
        penalty_type: "fixed",
        value: 100
      }
    ]

  });

  console.log("🏢 Building created:", building._id);

  return building;

}


// ============================================
// USERS
// ============================================

async function seedUsers(buildingId) {

  const password = "password123";

  const users = [

    {
      name: "Society Manager",
      email: "v@gmail.com",
      phone: "9876543200",
      flat_no: "101",
      role: "manager",
      password_hash: password,
      building_id: buildingId,
      parking: { two_wheeler: 1, four_wheeler: 1 }
    },

    {
      name: "Rajesh Sharma",
      email: "rajesh.sharma@example.com",
      phone: "9876543210",
      flat_no: "102",
      role: "admin",
      password_hash: password,
      building_id: buildingId,
      parking: { two_wheeler: 1, four_wheeler: 1 }
    },

    {
      name: "Priya Patel",
      email: "priya.patel@example.com",
      phone: "9876543211",
      flat_no: "103",
      role: "resident",
      password_hash: password,
      building_id: buildingId,
      parking: { two_wheeler: 1, four_wheeler: 0 }
    },

    {
      name: "Amit Kumar",
      email: "amit.kumar@example.com",
      phone: "9876543212",
      flat_no: "104",
      role: "resident",
      password_hash: password,
      building_id: buildingId,
      parking: { two_wheeler: 2, four_wheeler: 1 }
    },

    {
      name: "Sunita Verma",
      email: "sunita.verma@example.com",
      phone: "9876543213",
      flat_no: "105",
      role: "resident",
      password_hash: password,
      building_id: buildingId,
      parking: { two_wheeler: 0, four_wheeler: 1 }
    },

    {
      name: "Ramesh Yadav",
      email: "watchman@example.com",
      phone: "9876543223",
      role: "watchman",
      password_hash: password
    }

  ];

  const createdUsers = [];

  for (const userData of users) {

    const existing = await User.findOne({ email: userData.email });

    if (existing) {
      createdUsers.push(existing);
      continue;
    }

    const user = new User(userData);
    await user.save();

    createdUsers.push(user);

    console.log("👤 User created:", user.email);
  }

  return createdUsers;
}


// ============================================
// ASSETS
// ============================================

async function seedAssets() {

  const assets = [

    {
      name: "Main Lift",
      type: "lift",
      status: "working",
      location: "Building Entrance"
    },

    {
      name: "Water Pump",
      type: "water_pump",
      status: "working",
      location: "Basement"
    },

    {
      name: "Backup Generator",
      type: "generator",
      status: "working",
      location: "Basement"
    }

  ];

  for (const assetData of assets) {

    const existing = await Asset.findOne({ name: assetData.name });

    if (!existing) {
      await Asset.create(assetData);
      console.log("⚙️ Asset created:", assetData.name);
    }

  }

}


// ============================================
// MAINTENANCE (sample history)
// ============================================

function generateMaintenanceRecords(user, building) {

  const template = building.maintenance_templates.find(t => t.is_default);

  const records = [];

  const months = [
    { month: 10, year: 2025, status: "paid" },
    { month: 11, year: 2025, status: "paid" },
    { month: 12, year: 2025, status: "paid" },
    { month: 1, year: 2026, status: "pending" }
  ];

  months.forEach(m => {

    let total = 0;

    template.components.forEach(component => {

      if (component.type === "fixed") total += component.rate;
      if (component.type === "per_flat") total += component.rate;
      if (component.type === "per_sqft") total += component.rate * (user.flat_area || 900);

    });

    records.push({

      user_id: user._id,
      flat_no: user.flat_no,

      month: m.month,
      year: m.year,

      components: [],
      amount: total,
      penalty: 0,
      total_amount: total,

      due_date: new Date(m.year, m.month - 1, 18),

      status: m.status

    });

  });

  return records;

}


// ============================================
// MAIN SEED
// ============================================

async function seedDatabase() {

  try {

    await connectDB();

    console.log("📦 Connected to DB");

    await Maintenance.deleteMany({});
    await PaymentLog.deleteMany({});
    await LiftEmergency.deleteMany({});
    await Complaint.deleteMany({});
    await GateLog.deleteMany({});
    await Asset.deleteMany({});
    await User.deleteMany({});
    await Building.deleteMany({});

    console.log("🗑️ Old data cleared");

    const building = await seedBuilding();

    const users = await seedUsers(building._id);

    await seedAssets();

    const residents = users.filter(
      u => u.role === "resident" || u.role === "admin"
    );

    for (const user of residents) {

      const records = generateMaintenanceRecords(user, building);

      for (const record of records) {
        await Maintenance.create(record);
      }

      console.log("💰 Maintenance seeded for flat", user.flat_no);

    }

    console.log("══════════════════════════════════════");
    console.log("✅ SEED COMPLETE");
    console.log("══════════════════════════════════════");

    process.exit();

  } catch (error) {

    console.error(error);
    process.exit(1);

  }

}

seedDatabase();