const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'premium', 'admin'],
    default: 'user'
  },
  preferences: {
    sports: [{
      type: String,
      enum: ['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey']
    }],
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  },
  bettingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bet'
  }],
  statistics: {
    totalBets: { type: Number, default: 0 },
    winningBets: { type: Number, default: 0 },
    totalStaked: { type: Number, default: 0 },
    totalWinnings: { type: Number, default: 0 },
    roi: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for performance
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update updatedAt on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate ROI
UserSchema.methods.calculateROI = function() {
  if (this.statistics.totalStaked === 0) return 0;
  return ((this.statistics.totalWinnings - this.statistics.totalStaked) / this.statistics.totalStaked) * 100;
};

// Get win percentage
UserSchema.methods.getWinPercentage = function() {
  if (this.statistics.totalBets === 0) return 0;
  return (this.statistics.winningBets / this.statistics.totalBets) * 100;
};

module.exports = mongoose.model('User', UserSchema);
