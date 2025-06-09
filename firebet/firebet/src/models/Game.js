const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: [true, 'Sport is required'],
    enum: ['basketball', 'soccer', 'baseball', 'americanFootball', 'hockey']
  },
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  league: {
    type: String,
    required: [true, 'League is required']
  },
  season: {
    type: String,
    required: [true, 'Season is required']
  },
  gameWeek: Number,
  homeTeam: {
    id: String,
    name: { type: String, required: true },
    shortName: String,
    logo: String,
    city: String,
    country: String
  },
  awayTeam: {
    id: String,
    name: { type: String, required: true },
    shortName: String,
    logo: String,
    city: String,
    country: String
  },
  venue: {
    id: String,
    name: String,
    city: String,
    country: String,
    capacity: Number,
    surface: String, // grass, artificial, hybrid
    isNeutral: { type: Boolean, default: false }
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled'],
    default: 'scheduled'
  },
  scores: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 },
    periods: [{
      period: Number,
      home: Number,
      away: Number
    }]
  },
  odds: {
    moneyline: {
      home: Number,
      away: Number,
      draw: Number
    },
    spread: {
      home: Number,
      away: Number,
      line: Number
    },
    total: {
      over: Number,
      under: Number,
      line: Number
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  // Ordered prediction factors as specified
  predictionFactors: {
    // Soccer factors in exact order
    referee: {
      name: String,
      experience: Number,
      cardsPerGame: Number,
      homeTeamBias: Number,
      strictnessRating: Number
    },
    weather: {
      temperature: Number,
      humidity: Number,
      windSpeed: Number,
      precipitation: Number,
      condition: String
    },
    venue: {
      homeAdvantage: Number,
      averageAttendance: Number,
      surfaceCondition: String
    },
    travelDistance: {
      awayTeamDistance: Number,
      travelTime: Number,
      fatigueFactor: Number
    },
    timeChange: {
      timeDifference: Number,
      jetLagFactor: Number
    },
    injuries: {
      homeTeam: {
        totalInjured: Number,
        keyPlayersOut: [String],
        impactRating: Number
      },
      awayTeam: {
        totalInjured: Number,
        keyPlayersOut: [String],
        impactRating: Number
      }
    },
    managers: {
      home: {
        name: String,
        experience: Number,
        winPercentage: Number,
        tacticalStyle: String
      },
      away: {
        name: String,
        experience: Number,
        winPercentage: Number,
        tacticalStyle: String
      }
    },
    managersH2HRecords: {
      totalMeetings: Number,
      homeManagerWins: Number,
      awayManagerWins: Number,
      draws: Number
    },
    nightOrDayMatch: {
      kickOffTime: String,
      isDayMatch: Boolean,
      lightingConditions: String
    },
    regularSeason: {
      isRegularSeason: Boolean,
      leaguePosition: {
        home: Number,
        away: Number
      }
    },
    playoffs: {
      isPlayoff: Boolean,
      stage: String,
      eliminationMatch: Boolean
    },
    worldCup: {
      isWorldCup: Boolean,
      stage: String,
      nationalTeamPressure: Number
    },
    // Basketball specific factors
    coaches: {
      home: {
        name: String,
        experience: Number,
        winPercentage: Number
      },
      away: {
        name: String,
        experience: Number,
        winPercentage: Number
      }
    },
    coachesH2HRecords: {
      totalMeetings: Number,
      homeCoachWins: Number,
      awayCoachWins: Number
    },
    backToBackGames: {
      homeTeam: Boolean,
      awayTeam: Boolean
    },
    restDays: {
      homeTeam: Number,
      awayTeam: Number
    },
    altitude: {
      venueAltitude: Number,
      impactRating: Number
    }
  },
  predictions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction'
  }],
  bets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bet'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
GameSchema.index({ sport: 1, startTime: -1 });
GameSchema.index({ externalId: 1 });
GameSchema.index({ status: 1 });
GameSchema.index({ 'homeTeam.name': 1, 'awayTeam.name': 1 });
GameSchema.index({ league: 1, season: 1 });

// Update lastUpdated on save
GameSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Calculate prediction confidence based on available factors
GameSchema.methods.calculatePredictionConfidence = function() {
  const factors = this.predictionFactors;
  let availableFactors = 0;
  let totalFactors = 0;

  // Count available factors based on sport
  if (this.sport === 'soccer') {
    const soccerFactors = ['referee', 'weather', 'venue', 'travelDistance', 'timeChange', 
                          'injuries', 'managers', 'managersH2HRecords', 'nightOrDayMatch', 
                          'regularSeason', 'playoffs', 'worldCup'];
    totalFactors = soccerFactors.length;
    soccerFactors.forEach(factor => {
      if (factors[factor] && Object.keys(factors[factor]).length > 0) {
        availableFactors++;
      }
    });
  } else if (this.sport === 'basketball') {
    const basketballFactors = ['referee', 'venue', 'travelDistance', 'timeChange', 'injuries', 
                              'coaches', 'coachesH2HRecords', 'backToBackGames', 'restDays', 
                              'regularSeason', 'playoffs', 'altitude'];
    totalFactors = basketballFactors.length;
    basketballFactors.forEach(factor => {
      if (factors[factor] && Object.keys(factors[factor]).length > 0) {
        availableFactors++;
      }
    });
  }

  return totalFactors > 0 ? (availableFactors / totalFactors) * 100 : 0;
};

module.exports = mongoose.model('Game', GameSchema);
