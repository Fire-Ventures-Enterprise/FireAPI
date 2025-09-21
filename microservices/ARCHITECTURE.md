# 🏗️ Microservices Trade Architecture

## 🎯 Overview

A distributed system where each construction trade has its own specialized API service, orchestrated by a main hub that coordinates estimates across multiple trades.

## 🏛️ Architecture Components

### 🎪 **Main Orchestrator API** (`main-orchestrator/`)
**Role**: Central hub for estimate coordination
- **URL**: `fireapi.dev` (existing)
- **Responsibilities**:
  - Parse natural language project descriptions
  - Identify required trades for each project
  - Route requests to appropriate trade APIs
  - Combine estimates from multiple trades
  - Handle project timeline coordination
  - Manage user authentication & project storage
  - Generate final consolidated estimates

### 🔨 **Trade-Specific APIs**
Each trade runs as an independent microservice:

#### **Carpentry API** (`carpentry-api/`)
- **URL**: `carpentry-api.fireapi.dev`
- **Specializations**: Cabinets, framing, trim, doors, built-ins
- **Expert Knowledge**: Wood types, joinery, structural requirements

#### **Electrical API** (`electrical-api/`)
- **URL**: `electrical-api.fireapi.dev` 
- **Specializations**: Wiring, panels, outlets, lighting, smart home
- **Expert Knowledge**: Code compliance, load calculations, safety

#### **Plumbing API** (`plumbing-api/`)
- **URL**: `plumbing-api.fireapi.dev`
- **Specializations**: Pipes, fixtures, water heaters, drainage
- **Expert Knowledge**: Pressure calculations, code requirements

#### **Additional Trade APIs** (Future)
- `flooring-api.fireapi.dev`
- `painting-api.fireapi.dev`
- `hvac-api.fireapi.dev`
- `roofing-api.fireapi.dev`

### 📚 **Shared Resources** (`shared/`)
- **Templates**: Standardized trade job templates
- **Protocols**: Inter-API communication standards
- **Utils**: Common calculation utilities

## 🔄 Request Flow

```
1. Client → Main Orchestrator
   "Remodel kitchen with new cabinets, electrical, and plumbing"

2. Main Orchestrator → Trade APIs (Parallel)
   POST /carpentry-api/estimate
   POST /electrical-api/estimate  
   POST /plumbing-api/estimate

3. Trade APIs → Specialized Estimates
   Each returns expert-level trade estimate

4. Main Orchestrator → Client
   Combined estimate with trade coordination
```

## 📡 Communication Protocols

### **Request Format** (Main → Trade)
```json
{
  "request_id": "uuid-4",
  "project": {
    "type": "kitchen_renovation",
    "size": "medium",
    "quality_tier": "mid_range",
    "description": "New cabinets, countertops, island",
    "location": {
      "region": "northeast_us",
      "climate_zone": "4a"
    }
  },
  "trade_scope": {
    "phases": ["demolition", "installation", "finishing"],
    "specific_requirements": [
      "upper_cabinets",
      "lower_cabinets", 
      "crown_molding"
    ]
  },
  "constraints": {
    "timeline": "14_days",
    "budget_range": "mid_range"
  }
}
```

### **Response Format** (Trade → Main)
```json
{
  "request_id": "uuid-4",
  "trade": "carpentry",
  "estimate": {
    "phases": [...],
    "labor": {
      "total_hours": 42,
      "cost": 2730,
      "timeline_days": 3
    },
    "materials": {
      "line_items": [...],
      "total_cost": 8500
    },
    "total_cost": 11230,
    "confidence": 0.92,
    "complications": [...]
  },
  "coordination_requirements": {
    "prerequisites": ["electrical_rough_in"],
    "provides_for": ["countertop_measurement"],
    "schedule_flexibility": "2_days"
  }
}
```

## 🎯 Key Benefits

### **Specialization**
- Each API becomes expert in its trade
- Deep knowledge of trade-specific requirements
- Industry best practices per trade

### **Scalability** 
- Scale individual trades based on demand
- Independent deployment cycles
- Technology flexibility per service

### **Accuracy**
- Trade-specific validation logic
- Expert-level calculations
- Real-world complication handling

### **Extensibility**
- Easy to add new trades
- Contractor-specific customizations
- Regional pricing variations

## 🛠️ Development Strategy

### **Phase 1**: Foundation
1. ✅ Main orchestrator framework
2. 🚧 Carpentry API (first trade service)
3. 🚧 Communication protocols
4. 🚧 Basic coordination logic

### **Phase 2**: Expansion
1. Electrical API
2. Plumbing API  
3. Advanced coordination
4. Timeline optimization

### **Phase 3**: Ecosystem
1. Additional trade APIs
2. Third-party trade integrations
3. Regional contractor networks
4. Real-time pricing feeds

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────┐
│           Load Balancer             │
│         fireapi.dev                 │
└─────────────────┬───────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌────▼────┐   ┌───▼────┐
│ Main  │    │Carpentry│   │Electric│
│  API  │    │   API   │   │  API   │
└───────┘    └─────────┘   └────────┘
```

Each service runs independently with:
- Individual databases
- Separate scaling policies  
- Independent deployment pipelines
- Service mesh communication

## 📊 Success Metrics

### **Performance**
- Response time < 2 seconds per trade
- 99.9% uptime per service
- Parallel processing efficiency

### **Accuracy** 
- Estimate variance < 15% from actuals
- Trade-specific expertise validation
- Customer satisfaction scores

### **Scalability**
- Handle 1000+ concurrent estimates
- Linear scaling per trade service
- Regional deployment flexibility