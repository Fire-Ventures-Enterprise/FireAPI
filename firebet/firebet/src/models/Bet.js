const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: [true, 'Game reference is required']
  },
  prediction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction'
  },
  betType: {
    type: String,
    enum: ['moneyline', 'spread', 'total', 'player_props', 'team_props', 'parlay'],
    required: [true, 'Bet type is required']
  },
  selection: {
    type: String,
    required: [true, 'Bet selection is required']
  },
  odds: {
    type: Number,
    required: [true, 'Odds are required'],
    min: 1.01
  },
  stake: {
    type: Number,
    required: [true, 'Stake amount is required'],
    min: 0.01
  },
  potentialPayout: {
    type: Number,
    required: true
  },
  potentialProfit: {
    type: Number,
    required: true
  },
  bookmaker: {
    name: String,
    betId: String
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'push', 'void', 'cashed_out'],
    default: 'pending'
  },
  result: {
    outcome: {
      type: String,
      enum: ['win', 'loss', 'push', 'void']
    },
    actualPayout: Number,
    profit: Number,
    settledAt: Date
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  strategy: {
    type: String,
    enum: ['value_bet', 'safe_bet', 'longshot', 'system_bet', 'manual']
  },
  notes: String,
  tags: [String],
  // Tracking performance metrics
  metrics: {
    roi: Number,
    units: Number,
    edge: Number, // Expected value
    kelly: Number, // Kelly criterion percentage
    variance: Number
  },
  // Parlay specific fields
  parlay: {
    isParlay: { type: Boolean, default: false },
    legs: [{
      game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
      },
      selection: String,
      odds: Number,
      status: {
        type: String,
        enum: ['pending', 'won', 'lost', 'push', 'void']
      }
    }],
    totalOdds: Number,
    legsWon: { type: Number, default: 0 },
    legsLost: { type: Number, default: 0 },
    legsPending: Number
  },
  // Cash out options
  cashOut: {
    available: { type: Boolean, default: false },
    value: Number,
    offered: Date,
    acceptedAt: Date
  },
  // External tracking
  external: {
    tracked: { type: Boolean, default: false },
    trackingId: String,
    bookmakerBetId: String,
    placedVia: {
      type: String,
      enum: ['manual', 'api', 'mobile_app', 'web_app']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  placedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
BetSchema.index({ user: 1, placedAt: -1 });
BetSchema.index({ game: 1 });
BetSchema.index({ status: 1 });
BetSchema.index({ betType: 1 });
BetSchema.index({ placedAt: -1 });
BetSchema.index({ 'result.settledAt': -1 });

// Calculate potential payout before saving
BetSchema.pre('save', function(next) {
  // Calculate potential payout and profit
  this.potentialPayout = this.stake * this.odds;
  this.potentialProfit = this.potentialPayout - this.stake;
  
  // Update updatedAt
  this.updatedAt = Date.now();
  
  // Calculate parlay legs pending
  if (this.parlay.isParlay) {
    this.parlay.legsPending = this.parlay.legs.filter(leg => leg.status === 'pending').length;
  }
  
  next();
});

// Calculate ROI
BetSchema.methods.calculateROI = function() {
  if (this.status === 'pending' || !this.result.profit) return 0;
  return (this.result.profit / this.stake) * 100;
};

// Calculate units (assuming 1 unit = base stake amount)
BetSchema.methods.calculateUnits = function(baseUnit = 100) {
  return this.stake / baseUnit;
};

// Calculate expected value
BetSchema.methods.calculateExpectedValue = function() {
  if (!this.confidence) return 0;
  
  const probability = this.confidence / 100;
  const impliedProbability = 1 / this.odds;
  
  return (probability * this.potentialProfit) - ((1 - probability) * this.stake);
};

// Kelly Criterion calculation
BetSchema.methods.calculateKelly = function(bankroll) {
  if (!this.confidence || !bankroll) return 0;
  
  const probability = this.confidence / 100;
  const odds = this.odds - 1; // Convert to decimal odds minus 1
  
  const kelly = (probability * odds - (1 - probability)) / odds;
  return Math.max(0, kelly * 100); // Return as percentage, minimum 0
};

// Check if bet should be settled
BetSchema.methods.shouldSettle = function() {
  return this.status === 'pending' && this.game && this.game.status === 'finished';
};

// Settle bet based on game result
BetSchema.methods.settle = function(gameResult) {
  if (this.status !== 'pending') return false;
  
  // This would contain logic to determine win/loss based on bet type and game result
  // Implementation depends on specific betting rules
  
  this.result.settledAt = Date.now();
  this.updatedAt = Date.now();
  
  // Calculate actual profit/loss
  if (this.result.outcome === 'win') {
    this.result.actualPayout = this.potentialPayout;
    this.result.profit = this.potentialProfit;
    this.status = 'won';
  } else if (this.result.outcome === 'loss') {
    this.result.actualPayout = 0;
    this.result.profit = -this.stake;
    this.status = 'lost';
  } else if (this.result.outcome === 'push') {
    this.result.actualPayout = this.stake;
    this.result.profit = 0;
    this.status = 'push';
  }
  
  // Calculate metrics
  this.metrics.roi = this.calculateROI();
  this.metrics.units = this.calculateUnits();
  
  return true;
};

// Get bet summary for display
BetSchema.methods.getSummary = function() {
  return {
    id: this._id,
    betType: this.betType,
    selection: this.selection,
    odds: this.odds,
    stake: this.stake,
    status: this.status,
    potentialProfit: this.potentialProfit,
    actualProfit: this.result.profit || 0,
    roi: this.calculateROI(),
    placedAt: this.placedAt
  };
};

module.exports = mongoose.model('Bet', BetSchema);
