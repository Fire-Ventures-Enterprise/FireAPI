const mongoose = require('mongoose');

const SportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sport name is required'],
    unique: true,
    enum: ['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required']
  },
  leagues: [{
    id: String,
    name: { type: String, required: true },
    displayName: String,
    country: String,
    season: String,
    isActive: { type: Boolean, default: true },
    tier: { type: Number, default: 1 }, // 1 = top tier, 2 = second tier, etc.
    format: {
      type: String,
      enum: ['tournament', 'league', 'cup', 'playoff']
    }
  }],
  seasons: [{
    year: { type: String, required: true },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false },
    isCurrent: { type: Boolean, default: false }
  }],
  // Ordered prediction factors specific to each sport
  predictionFactors: {
    order: [String], // Exact order for factor collection
    factors: {
      referee: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String
      },
      weather: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: [String] // ['outdoor', 'indoor']
      },
      venue: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String
      },
      travelDistance: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String
      },
      timeChange: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String
      },
      injuries: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String
      },
      managers: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['soccer'] // Sport-specific
      },
      managersH2HRecords: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['soccer']
      },
      coaches: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['basketball', 'americanFootball', 'hockey']
      },
      coachesH2HRecords: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['basketball', 'americanFootball', 'hockey']
      },
      nightOrDayMatch: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['soccer', 'baseball']
      },
      backToBackGames: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['basketball', 'hockey']
      },
      restDays: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['basketball', 'americanFootball', 'hockey']
      },
      altitude: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['basketball', 'americanFootball', 'baseball']
      },
      regularSeason: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String
      },
      playoffs: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String
      },
      worldCup: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 1.0 },
        description: String,
        applicableTo: ['soccer']
      }
    }
  },
  bettingMarkets: [{
    name: { type: String, required: true },
    displayName: String,
    description: String,
    isActive: { type: Boolean, default: true },
    category: {
      type: String,
      enum: ['main', 'player', 'team', 'game', 'special']
    }
  }],
  statistics: {
    totalGames: { type: Number, default: 0 },
    activePredictions: { type: Number, default: 0 },
    totalBets: { type: Number, default: 0 },
    predictionAccuracy: { type: Number, default: 0 },
    lastUpdated: Date
  },
  dataSource: {
    primary: String, // Main API source
    backup: String,  // Fallback API source
    updateFrequency: { type: Number, default: 300 }, // seconds
    lastSync: Date,
    isActive: { type: Boolean, default: true }
  },
  configuration: {
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    oddsFormat: {
      type: String,
      enum: ['decimal', 'american', 'fractional'],
      default: 'decimal'
    },
    minBetAmount: { type: Number, default: 1 },
    maxBetAmount: { type: Number, default: 10000 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
SportSchema.index({ name: 1 });
SportSchema.index({ isActive: 1 });

// Update updatedAt on save
SportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Get ordered prediction factors for this sport
SportSchema.methods.getPredictionFactorsInOrder = function() {
  const orderedFactors = [];
  const factorOrder = this.predictionFactors.order;
  
  factorOrder.forEach(factorName => {
    const factor = this.predictionFactors.factors[factorName];
    if (factor && factor.enabled) {
      // Check if factor applies to this sport
      if (!factor.applicableTo || factor.applicableTo.includes(this.name)) {
        orderedFactors.push({
          name: factorName,
          weight: factor.weight,
          description: factor.description
        });
      }
    }
  });
  
  return orderedFactors;
};

// Get active leagues for this sport
SportSchema.methods.getActiveLeagues = function() {
  return this.leagues.filter(league => league.isActive);
};

// Get current season
SportSchema.methods.getCurrentSeason = function() {
  return this.seasons.find(season => season.isCurrent);
};

// Get betting markets by category
SportSchema.methods.getBettingMarketsByCategory = function(category) {
  return this.bettingMarkets.filter(market => 
    market.isActive && market.category === category
  );
};

// Update statistics
SportSchema.methods.updateStatistics = function(stats) {
  this.statistics = { ...this.statistics, ...stats };
  this.statistics.lastUpdated = new Date();
  this.updatedAt = new Date();
};

// Validate prediction factor order
SportSchema.methods.validateFactorOrder = function() {
  const requiredFactors = this.name === 'soccer' 
    ? ['referee', 'weather', 'venue', 'travelDistance', 'timeChange', 
       'injuries', 'managers', 'managersH2HRecords', 'nightOrDayMatch', 
       'regularSeason', 'playoffs', 'worldCup']
    : ['referee', 'venue', 'travelDistance', 'timeChange', 'injuries', 
       'coaches', 'coachesH2HRecords', 'backToBackGames', 'restDays', 
       'regularSeason', 'playoffs', 'altitude'];

  const currentOrder = this.predictionFactors.order;
  const applicableFactors = requiredFactors.filter(factor => {
    const factorConfig = this.predictionFactors.factors[factor];
    return !factorConfig?.applicableTo || factorConfig.applicableTo.includes(this.name);
  });

  return JSON.stringify(currentOrder.sort()) === JSON.stringify(applicableFactors.sort());
};

module.exports = mongoose.model('Sport', SportSchema);
