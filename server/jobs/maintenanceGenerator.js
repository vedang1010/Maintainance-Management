const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Building = require('../models/Building');
const emailService = require('../services/email.service');

/**
 * Generate monthly maintenance records
 */
const generateMonthlyMaintenance = async () => {

  try {

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    console.log(`📅 Generating maintenance records for ${month}/${year}`);

    const users = await User.find({
      role: { $in: ['resident', 'admin', 'manager'] },
      flat_no: { $exists: true, $ne: null }
    }).populate("building_id");

    let created = 0;
    let skipped = 0;

    for (const user of users) {

      const existing = await Maintenance.findOne({
        user_id: user._id,
        month,
        year
      });

      if (existing) {
        skipped++;
        continue;
      }

      const building = user.building_id;

      if (!building) continue;

      const template = building.maintenance_templates.find(
        t => t.is_default === true
      );

      if (!template) {
        console.log(`No template configured for building`);
        continue;
      }

      const dueDate = new Date(year, month - 1, building.maintenance_due_day || 18);

      let components = [];
      let totalAmount = 0;

      // COMPONENT CALCULATION
      template.components.forEach(component => {

        let amount = 0;

        if (component.type === "fixed") {
          amount = component.rate;
        }

        if (component.type === "per_flat") {
          amount = component.rate;
        }

        if (component.type === "per_sqft") {
          amount = component.rate * user.flat_area;
        }

        components.push({
          name: component.name,
          calculation_type: component.type,
          rate: component.rate,
          amount
        });

        totalAmount += amount;

      });

      // PARKING CHARGES
      building.parking_rules.forEach(rule => {

        if (rule.type === "2wheeler") {

          const amount = user.parking?.two_wheeler * rule.monthly_charge;

          if (amount > 0) {
            components.push({
              name: "2 Wheeler Parking",
              calculation_type: "per_vehicle",
              rate: rule.monthly_charge,
              amount
            });

            totalAmount += amount;
          }

        }

        if (rule.type === "4wheeler") {

          const amount = user.parking?.four_wheeler * rule.monthly_charge;

          if (amount > 0) {
            components.push({
              name: "4 Wheeler Parking",
              calculation_type: "per_vehicle",
              rate: rule.monthly_charge,
              amount
            });

            totalAmount += amount;
          }

        }

      });

      const maintenance = await Maintenance.create({

        user_id: user._id,
        flat_no: user.flat_no,
        month,
        year,
        components,
        amount: totalAmount,
        penalty: 0,
        total_amount: totalAmount,
        due_date: dueDate,
        status: "pending"

      });

      created++;

      // SEND EMAIL
      try {

        await emailService.sendMaintenanceInvoice({
          email: user.email,
          name: user.name,
          flat_no: user.flat_no,
          amount: totalAmount,
          month,
          year,
          due_date: dueDate
        });

      } catch (emailErr) {
        console.error(`Email failed:`, emailErr.message);
      }

    }

    console.log(`Maintenance generation completed`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);

    return { created, skipped };

  } catch (error) {

    console.error("Error generating maintenance:", error);
    throw error;

  }

};


/**
 * Manual generation for specific month/year
 */
const generateMaintenanceForMonth = async (month, year) => {

  const now = new Date(year, month - 1, 1);

  return generateMonthlyMaintenance(now);

};

module.exports = {
  generateMonthlyMaintenance,
  generateMaintenanceForMonth
};