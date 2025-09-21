# 🏗️ FireBuildAI - Complete Construction Estimation API Platform

## 🎯 **Overview**

A production-ready **microservices architecture** for construction estimate generation with specialized trade APIs, orchestrated estimation, and user-editable pricing. Each construction trade has its own expert API service coordinated by a main orchestrator.

## 🚀 **Live Services**

### **Main API (Production)**
- **URL**: `https://fireapi.dev`
- **Status**: ✅ Live on Railway
- **Functions**: Project management, user auth, API orchestration

### **Carpentry API (Live in Development)**
- **URL**: `https://3001-sandbox.e2b.dev` (development)
- **Status**: ✅ Running with PM2
- **Specialization**: Kitchen cabinets, trim, framing, doors

---

## 🏛️ **Architecture**

```
┌─────────────────────────────────────┐
│         Main Orchestrator           │
│         (fireapi.dev)               │
└─────────────┬───────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Carpentry│Electrical│Plumbing│
│  API   │   API   │  API   │
│ ✅Live │ 🏗️Ready │ 🏗️Ready │
└───────┘ └───────┘ └───────┘
```

---

## 📁 **Project Structure**

```
FireBuildAI/
├── 🎪 Main API (fireapi.dev)
│   ├── app.js                    # Main server
│   ├── routes.js                 # API endpoints  
│   ├── cost-database.js          # Data management
│   └── workflow-engine.js        # Business logic
│
├── 🔨 Microservices Architecture
│   ├── ARCHITECTURE.md           # Complete architecture docs
│   ├── PRICING_INTEGRATION.md    # Pricing strategy
│   ├── ecosystem.config.js       # PM2 multi-service config
│   │
│   ├── 🔨 carpentry-api/         # ✅ COMPLETE & RUNNING
│   │   ├── server.js             # Carpentry service
│   │   ├── src/carpentry-estimator.js # Estimation engine
│   │   └── templates/            # Job templates
│   │       ├── kitchen-cabinets.json
│   │       └── trim-installation.json
│   │
│   ├── ⚡ electrical-api/        # 🏗️ Ready for development
│   ├── 🚿 plumbing-api/          # 🏗️ Ready for development  
│   ├── 🎨 painting-api/          # 🏗️ Ready for development
│   │
│   ├── 📡 main-orchestrator/
│   │   └── orchestrator.js       # Multi-trade coordination
│   │
│   └── 📚 shared/
│       └── templates/
│           └── trade-api-template.js # Base for all APIs
│
├── 📊 Trade Library
│   └── trade_library/
│       └── multi_trade/
│           └── kitchen_renovation_complete.json # Comprehensive template
│
└── 📋 Documentation
    ├── README_TRADE_LIBRARY.md      # Trade library docs
    ├── MICROSERVICES_IMPLEMENTATION.md # Implementation guide
    └── documentation.md              # API documentation
```

---

## 🛠️ **Key Features**

### ✅ **Production-Ready Architecture**
- **Microservices design** with specialized trade APIs
- **User-editable pricing** with national average references
- **No hardcoded costs** - all pricing user-controlled
- **Professional estimate generation** from natural language

### ✅ **Carpentry API (Complete)**
- **Kitchen cabinet expertise** with 4 quality tiers
- **Material specifications** without pricing simulation
- **Labor calculations** with hour requirements
- **Comprehensive templates** for accurate estimates

### ✅ **Orchestration Intelligence**
- **Natural language parsing** to identify required trades
- **Multi-trade coordination** with parallel API calls
- **Schedule optimization** across trade dependencies
- **Fallback handling** for service availability

### ✅ **User-Editable Pricing Strategy**
- **National average references** as starting points
- **Full contractor control** over all pricing
- **Real-time recalculation** as prices change
- **No pricing liability** for platform

---

## 🚀 **API Endpoints**

### **Main API (fireapi.dev)**
```
Authentication:
POST /auth/login
POST /auth/register

Projects:  
GET /projects
POST /projects
GET /projects/:id

Companies:
GET /companies  
POST /companies

Materials & Labor:
GET /materials
GET /labor
```

### **Carpentry API**
```
Health & Info:
GET /health
GET /info
GET /templates

Estimates:
POST /estimate              # Main estimation
POST /estimate/cabinets     # Kitchen cabinets  
POST /estimate/trim         # Trim installation
POST /estimate/framing      # Framing work
POST /estimate/doors        # Door installation

Materials:
POST /calculate/materials   # Material calculations
```

---

## 📊 **Sample API Response**

### **Kitchen Cabinet Estimate (No Pricing)**
```json
{
  "request_id": "kb_001",
  "trade": "carpentry", 
  "estimate": {
    "phases": [
      {
        "phase": "Cabinet Installation",
        "tasks": [
          {
            "task": "Install upper cabinets",
            "hours": 27,
            "materials": [
              {
                "item": "Upper Cabinet Boxes",
                "quantity": 14,
                "unit": "each",
                "category": "cabinetry",
                "specification": "Standard upper cabinet boxes",
                "national_avg_price": 180,
                "user_price": null,
                "editable": true
              }
            ]
          }
        ]
      }
    ],
    "labor": {
      "total_hours": 94,
      "timeline_days": 12,
      "national_avg_rate": 65,
      "user_rate": null,
      "editable": true
    },
    "pricing_incomplete": true
  },
  "note": "Reference pricing provided - user adjustment required"
}
```

---

## 🔧 **Development Setup**

### **Prerequisites**
- Node.js 18+
- PM2 (for microservices)
- Git

### **Installation**
```bash
# Clone repository
git clone https://github.com/nasman1965/FireAPI.git
cd FireAPI

# Install main API dependencies  
npm install

# Install carpentry API dependencies
cd microservices/carpentry-api
npm install

# Start services with PM2
pm2 start microservices/ecosystem.config.js
```

### **Service Management**
```bash
# Check service status
pm2 status

# View logs
pm2 logs carpentry-api --nostream

# Restart services
pm2 restart all
```

---

## 🎯 **Trade API Development**

### **Ready for Development**
Each trade API follows the standardized template:

1. **⚡ Electrical API** - Wiring, panels, outlets, lighting
2. **🚿 Plumbing API** - Pipes, fixtures, water systems  
3. **🎨 Painting API** - Interior/exterior surface preparation
4. **🏠 Flooring API** - Hardwood, tile, carpet installation
5. **🌡️ HVAC API** - Heating, cooling, ventilation systems

### **Template Structure**
```javascript
class TradeAPI extends TradeAPITemplate {
  async generateEstimate(request) {
    // Trade-specific estimation logic
    return {
      phases: [...],
      materials: [...], // No pricing
      labor: {...},    // Hours only
      reference_pricing: {...} // National averages
    };
  }
}
```

---

## 📋 **User Pricing Workflow**

### **1. API Provides Structure + References**
- Material specifications and quantities
- Labor hour requirements  
- National average pricing references
- Quality tier indicators

### **2. User Edits Pricing**
- Adjust material costs for local market
- Set labor rates for regional wages
- Modify for supplier relationships
- Add profit margins

### **3. Real-Time Calculations**
- Totals update as pricing changes
- Save pricing profiles for reuse
- Generate professional estimates

---

## 🎉 **Business Benefits**

### **For Platform Owner**
- ✅ **No pricing liability** - users control all costs
- ✅ **Rapid development** - focus on specifications, not pricing
- ✅ **Wide adoption** - works for any contractor, any region
- ✅ **Professional credibility** - comprehensive trade expertise

### **For Contractors** 
- ✅ **Full pricing control** - competitive advantage maintained
- ✅ **Speed** - reference prices as starting point
- ✅ **Accuracy** - detailed specifications and quantities
- ✅ **Flexibility** - adjust for quality, market, relationships

### **For Clients**
- ✅ **Transparency** - detailed line-item breakdowns
- ✅ **Education** - understand what work involves
- ✅ **Confidence** - professional, comprehensive estimates

---

## 🚀 **Deployment Status**

### **✅ Production Ready**
- **Main API**: Live at fireapi.dev
- **Database**: SQLite with comprehensive schema
- **Authentication**: JWT-based user management
- **Error handling**: Comprehensive validation and logging

### **✅ Development Ready** 
- **Carpentry API**: Running and tested
- **Microservices framework**: Complete and documented
- **Trade templates**: Standardized structure established
- **PM2 configuration**: Multi-service management ready

### **🏗️ Ready for Expansion**
- **Additional trade APIs**: Template and architecture ready
- **Pricing integration**: Framework established for external services
- **Regional deployment**: Service mesh architecture prepared

---

## 📖 **Documentation**

- **[Architecture Overview](microservices/ARCHITECTURE.md)** - Complete system design
- **[Trade Library](README_TRADE_LIBRARY.md)** - Job templates and calculations  
- **[Pricing Integration](microservices/PRICING_INTEGRATION.md)** - User-editable pricing strategy
- **[Implementation Guide](MICROSERVICES_IMPLEMENTATION.md)** - Development details

---

## 🎯 **Next Steps**

1. **Develop Additional Trade APIs** - Electrical, Plumbing, Painting
2. **Enhance Orchestration** - Multi-trade project coordination
3. **Build Frontend** - User interface for estimate editing
4. **Add Regional Features** - Location-specific considerations
5. **Contractor Network** - Platform for trade service providers

**Perfect foundation for the next generation of construction estimation!** 🏗️⚡