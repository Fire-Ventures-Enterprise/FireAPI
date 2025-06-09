const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: [true, 'Game reference is required']
  },
  sport: {
    type: String,
    required: [true, 'Sport is required'],
    enum: ['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey']
  },
  predictionType: {
    type: String,
    enum: ['moneyline', 'spread', 'total', 'player_props', 'team_props'],
    required: [true, 'Prediction type is required']
  },
  recommendation: {
    type: String,
    enum: ['home', 'away', 'draw', 'over', 'under'],
    required: [true, 'Recommendation is required']
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Confidence level is required']
  },
  probability: {
    home: { type: Number, min: 0, max: 100 },
    away: { type: Number, min: 0, max: 100 },
    draw: { type: Number, min: 0, max: 100 }
  },
  factorAnalysis: {
    // Ordered factor impacts
    referee: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    weather: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    venue: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    travelDistance: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    timeChange: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    injuries: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    managers: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    managersH2HRecords: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    nightOrDayMatch: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    regularSeason: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    playoffs: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    worldCup: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    // Basketball specific factors
    coaches: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    coachesH2HRecords: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    backToBackGames: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    restDays: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    },
    altitude: {
      impact: { type: Number, min: -10, max: 10 },
      reasoning: String
    }
  },
  insights: {
    keyFactors: [String],
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    valueRating: {
      type: Number,
      min: 1,
      max: 10
    },
    summary: String,
    reasoning: String
  },
  modelMetrics: {
    algorithm: String,
    version: String,
    accuracy: Number,
    backtestResults: {
      totalPredictions: Number,
      correctPredictions: Number,
      accuracy: Number,
      roi: Number
    }
  },
  odds: {
    recommended: Number,
    current: Number,
    value: Number, // Calculated value bet score
    bookmaker: String
  },
  status: {
    type: String,
    enum: ['active', 'settled', 'void', 'cancelled'],
    default: 'active'
  },
  result: {
    outcome: {
      type: String,
      enum: ['win', 'loss', 'push', 'void']
    },
    actualResult: String,
    settledAt: Date
  },
  users: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewed: { type: Boolean, default: false },
    followed: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 }
  }],
  performance: {
    views: { type: Number, default: 0 },
    follows: { type: Number, default: 0 },
    betsPlaced: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
PredictionSchema.index({ game: 1 });
PredictionSchema.index({ sport: 1, createdAt: -1 });
PredictionSchema.index({ confidence: -1 });
PredictionSchema.index({ status: 1 });
PredictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update updatedAt on save
PredictionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate overall factor impact score
PredictionSchema.methods.calculateFactorScore = function() {
  const analysis = this.factorAnalysis;
  let totalImpact = 0;
  let factorCount = 0;

  // Get sport-specific factors
  const factors = this.sport === 'soccer' 
    ? ['referee', 'weather', 'venue', 'travelDistance', 'timeChange', 'injuries', 
       'managers', 'managersH2HRecords', 'nightOrDayMatch', 'regularSeason', 'playoffs', 'worldCup']
    : ['referee', 'venue', 'travelDistance', 'timeChange', 'injuries', 'coaches', 
       'coachesH2HRecords', 'backToBackGames', 'restDays', 'regularSeason', 'playoffs', 'altitude'];

  factors.forEach(factor => {
    if (analysis[factor] && typeof analysis[factor].impact === 'number') {
      totalImpact += analysis[factor].impact;
      factorCount++;
    }
  });

  return factorCount > 0 ? totalImpact / factorCount : 0;
};

// Calculate value bet score
PredictionSchema.methods.calculateValueScore = function() {
  if (!this.odds.recommended || !this.odds.current) return 0;
  
  const impliedProbability = 1 / this.odds.current;
  const trueProbability = 1 / this.odds.recommended;
  
  return trueProbability > impliedProbability ? 
    ((trueProbability - impliedProbability) / impliedProbability) * 100 : 0;
};

// Get top contributing factors
PredictionSchema.methods.getTopFactors = function(limit = 3) {
  const analysis = this.factorAnalysis;
  const factors = [];

  Object.keys(analysis).forEach(factor => {
    if (analysis[factor] && typeof analysis[factor].impact === 'number') {
      factors.push({
        name: factor,
        impact: Math.abs(analysis[factor].impact),
        reasoning: analysis[factor].reasoning
      });
    }
  });

  return factors
    .sort((a, b) => b.impact - a.impact)
    .slice(0, limit);
};

module.exports = mongoose.model('Prediction', PredictionSchema);
