const mongoose = require('mongoose');

const MaintenanceComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ['fixed', 'per_flat', 'per_sqft'],
    required: true
  },

  rate: {
    type: Number,
    required: true
  },

  description: String,

  is_active: {
    type: Boolean,
    default: true
  }
});


const MaintenanceTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  components: [MaintenanceComponentSchema],

  is_default: {
    type: Boolean,
    default: false
  }
});


const ParkingRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['2wheeler', '4wheeler']
  },

  monthly_charge: {
    type: Number,
    default: 0
  },

  visitor_charge_per_hour: {
    type: Number,
    default: 0
  }
});


const PenaltyRuleSchema = new mongoose.Schema({
  days_after_due: Number,

  penalty_type: {
    type: String,
    enum: ['fixed', 'percentage']
  },

  value: Number
});


const BuildingSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  address: String,

  city: String,

  pincode: String,

  floors: Number,

  total_flats: Number,

  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  maintenance_due_day: {
    type: Number,
    default: 10
  },

  maintenance_templates: [MaintenanceTemplateSchema],

  parking_rules: [ParkingRuleSchema],

  penalty_rules: [PenaltyRuleSchema],

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});


BuildingSchema.index({ manager_id: 1 });
BuildingSchema.index({ city: 1 });

module.exports = mongoose.model('Building', BuildingSchema);