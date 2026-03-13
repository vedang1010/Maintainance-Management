const Maintenance = require('../models/Maintenance');
const Building = require('../models/Building');
const emailService = require('../services/email.service');

const applyLateFees = async () => {

  try {

    const now = new Date();

    console.log("Checking overdue payments");

    const overdueRecords = await Maintenance.find({
      status: { $in: ['pending', 'overdue'] },
      due_date: { $lt: now }
    }).populate("user_id");

    let updated = 0;

    for (const record of overdueRecords) {

      const building = await Building.findById(record.user_id.building_id);

      if (!building) continue;

      const daysLate = Math.floor(
        (now - record.due_date) / (1000 * 60 * 60 * 24)
      );

      let penalty = 0;

      building.penalty_rules.forEach(rule => {

        if (daysLate >= rule.days_after_due) {

          if (rule.penalty_type === "fixed") {
            penalty = rule.value;
          }

          if (rule.penalty_type === "percentage") {
            penalty = (record.amount * rule.value) / 100;
          }

        }

      });

      if (penalty > 0) {

        record.penalty = penalty;
        record.total_amount = record.amount + penalty;
        record.status = "overdue";

        await record.save();

        updated++;

        try {

          await emailService.sendMaintenanceReminder({

            email: record.user_id.email,
            name: record.user_id.name,
            flat_no: record.flat_no,
            amount: record.total_amount,
            month: record.month,
            year: record.year,
            due_date: record.due_date,
            is_overdue: true

          });

        } catch (err) {
          console.error("Email failed", err.message);
        }

      }

    }

    console.log(`Late fees applied: ${updated}`);

    return { updated };

  } catch (error) {

    console.error("Late fee job failed", error);
    throw error;

  }

};

const checkAndApplyLateFees = async () => {
  return applyLateFees();
};

module.exports = {
  applyLateFees,
  checkAndApplyLateFees
};