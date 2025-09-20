# FireBuildAI Construction Management API

## Overview

The FireBuildAI API is a comprehensive construction project management platform that provides AI-powered project analysis, intelligent workflow generation, and accurate cost estimation with regional pricing intelligence.

**Version:** 1.0.0  
**Base URL:** `/api`  
**Content Type:** `application/json`

## Key Features

- 🤖 **AI-Powered Project Analysis** - Natural language processing of construction descriptions
- 🔧 **Intelligent Workflow Generation** - Task sequencing with dependency management
- 💰 **Regional Cost Intelligence** - Accurate pricing with local market multipliers
- 📋 **Building Code Compliance** - Automated inspection sequence generation
- ⚡ **Critical Path Optimization** - Timeline optimization and parallel task identification
- 🌍 **Multi-Regional Support** - Coverage for major US and Canadian markets

## Authentication

The demo version does not require authentication. Production versions will implement API key authentication.

## Rate Limits

- **General endpoints:** 100 requests per 15 minutes per IP
- **Intensive endpoints:** Lower limits (see individual endpoints)
- **Batch requests:** 10 concurrent requests maximum

## Core Endpoints

### Project Analysis

#### Analyze Project Description
```http
POST /api/projects/analyze
```

Analyze a construction project description using natural language processing to extract project details, complexity, and requirements.

**Request Body:**
```json
{
  "description": "Build a 500 sq ft home addition with kitchen and bathroom @$150/sqft",
  "projectDetails": {
    "location": "Toronto, ON",
    "timeline": "6 months",
    "budget": 75000
  },
  "options": {
    "includeCompliance": true,
    "includeRisks": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "fb_1634567890_abc123def",
    "analysis": {
      "projectType": "home_addition",
      "complexity": "medium",
      "estimatedTimeframe": "4-6 months",
      "keyFeatures": ["kitchen", "bathroom", "plumbing", "electrical"],
      "complianceRequirements": ["building_permit", "electrical_permit", "plumbing_permit"],
      "riskFactors": ["structural_modifications", "code_compliance"]
    },
    "recommendations": [
      {
        "type": "permits",
        "message": "Structural engineer review recommended for load-bearing modifications",
        "priority": "medium"
      }
    ],
    "nextSteps": [
      "Generate detailed workflow with dependencies",
      "Calculate regional cost estimates",
      "Review building code compliance requirements"
    ]
  }
}
```

**Rate Limit:** 50 requests per 15 minutes

---

#### Complete Project Analysis
```http
POST /api/projects/complete-analysis
```

Perform comprehensive analysis including project parsing, workflow generation, and cost estimation in a single request.

**Request Body:**
```json
{
  "description": "Kitchen renovation: new cabinets, quartz countertops, stainless appliances @$120/sqft for 180 sqft",
  "region": "toronto",
  "options": {
    "includeOptimizations": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "fb_1634567890_xyz789abc",
    "analysis": {
      "description": "Kitchen renovation...",
      "projectType": "kitchen_renovation",
      "complexity": "medium",
      "keyFeatures": ["cabinets", "countertops", "appliances"],
      "estimatedTimeframe": "4-6 weeks"
    },
    "workflow": {
      "tasks": [
        {
          "id": "demo_001",
          "name": "Demolition",
          "duration": 2,
          "dependencies": [],
          "category": "demolition"
        }
      ],
      "totalTasks": 15,
      "estimatedDuration": "4-6 weeks",
      "criticalPath": ["demo_001", "electrical_rough", "plumbing_rough"],
      "inspectionPoints": ["electrical_rough_inspection", "final_inspection"]
    },
    "costs": {
      "totalEstimate": 21600,
      "breakdown": {
        "materials": 12960,
        "labor": 6480,
        "permits": 500,
        "contingency": 1654
      },
      "region": "toronto",
      "confidence": 0.85
    },
    "insights": {
      "riskFactors": [
        {
          "category": "complexity",
          "risk": "Medium project complexity requires careful coordination",
          "mitigation": "Regular progress meetings and milestone reviews"
        }
      ],
      "opportunities": [
        {
          "type": "scheduling",
          "description": "Multiple independent tasks can be scheduled simultaneously",
          "benefit": "Reduce overall project timeline by 15-25%"
        }
      ]
    }
  }
}
```

**Rate Limit:** 10 requests per 15 minutes

---

### Workflow Generation

#### Generate Construction Workflow
```http
POST /api/workflows/generate
```

Generate detailed construction workflow with task dependencies, scheduling, and critical path analysis.

**Request Body:**
```json
{
  "projectType": "bathroom_renovation",
  "projectDetails": {
    "size": 80,
    "complexity": "high",
    "features": ["tile_work", "new_plumbing", "ventilation"]
  },
  "region": "toronto",
  "options": {
    "includeCriticalPath": true,
    "includeInspections": true,
    "optimizeParallelTasks": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow": {
      "tasks": [
        {
          "id": "bath_demo_001",
          "name": "Demolition - Remove existing fixtures",
          "duration": 1,
          "dependencies": [],
          "category": "demolition",
          "materials": ["disposal_bags", "tarps"],
          "trades": ["general_contractor"],
          "weather_dependent": false
        },
        {
          "id": "bath_plumb_001",
          "name": "Plumbing rough-in",
          "duration": 2,
          "dependencies": ["bath_demo_001"],
          "category": "plumbing",
          "inspection_required": true
        }
      ],
      "criticalPath": ["bath_demo_001", "bath_plumb_001", "bath_electric_001"],
      "estimatedDuration": "3-4 weeks",
      "inspectionPoints": [
        {
          "name": "Plumbing rough inspection",
          "requiredAfter": ["bath_plumb_001"],
          "mustCompleteBefore": ["bath_insulation_001"]
        }
      ]
    },
    "summary": {
      "totalTasks": 12,
      "estimatedDuration": "3-4 weeks",
      "criticalPath": "bath_demo_001 → bath_plumb_001 → bath_electric_001",
      "parallelOpportunities": 3
    },
    "optimizations": [
      {
        "type": "efficiency",
        "message": "3 tasks can be performed in parallel to reduce timeline",
        "impact": "time_savings"
      }
    ]
  }
}
```

**Rate Limit:** 20 requests per 15 minutes

---

#### Get Workflow Templates
```http
GET /api/workflows/templates?projectType=kitchen_renovation
```

Retrieve available workflow templates for different project types.

**Query Parameters:**
- `projectType` (optional): Filter templates by project type

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "kitchen_basic",
        "name": "Basic Kitchen Renovation",
        "projectTypes": ["kitchen_renovation"],
        "duration": "3-5 weeks",
        "complexity": "medium",
        "taskCount": 12
      }
    ]
  }
}
```

---

### Cost Estimation

#### Calculate Cost Estimates
```http
POST /api/costs/estimate
```

Calculate detailed cost estimates with regional pricing adjustments and material costs.

**Request Body:**
```json
{
  "projectType": "home_addition",
  "region": "vancouver",
  "tasks": [
    {
      "name": "Foundation",
      "duration": 5,
      "materials": ["concrete", "rebar", "forms"]
    },
    {
      "name": "Framing", 
      "duration": 10,
      "materials": ["lumber", "nails", "brackets"]
    }
  ],
  "materials": [
    {
      "name": "Concrete",
      "quantity": 15,
      "unit": "cubic_yards"
    }
  ],
  "options": {
    "includeContingency": true,
    "includeProfitMargin": true,
    "marketConditions": "normal"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimate": {
      "totalCost": 85000,
      "materialsCost": 42500,
      "laborCost": 34000,
      "permitsCost": 2500,
      "contingency": 6000,
      "confidence": 0.85,
      "region": "vancouver",
      "regionalMultiplier": 1.25
    },
    "breakdown": {
      "materials": 42500,
      "labor": 34000, 
      "permits": 2500,
      "contingency": 6000,
      "total": 85000
    },
    "regionalFactors": {
      "region": "vancouver",
      "multiplier": 1.25,
      "marketConditions": "normal"
    },
    "recommendations": [
      {
        "type": "materials",
        "message": "Consider bulk purchasing to reduce material costs by 8-12%",
        "potential_savings": "10-15%"
      }
    ]
  }
}
```

**Rate Limit:** 30 requests per 15 minutes

---

#### Get Available Regions
```http
GET /api/costs/regions?detailed=true
```

Retrieve available regions and their pricing multipliers.

**Query Parameters:**
- `detailed` (optional): Include sample costs for each region

**Response:**
```json
{
  "success": true,
  "data": {
    "regions": [
      {
        "id": "toronto",
        "name": "Toronto, ON",
        "country": "Canada",
        "multiplier": 1.15,
        "sampleCosts": {
          "lumber_2x4": 6.50,
          "concrete": 120,
          "drywall": 1.25
        }
      },
      {
        "id": "vancouver", 
        "name": "Vancouver, BC",
        "country": "Canada",
        "multiplier": 1.25,
        "sampleCosts": {
          "lumber_2x4": 7.20,
          "concrete": 135,
          "drywall": 1.40
        }
      }
    ]
  }
}
```

---

### Utility Endpoints

#### Health Check
```http
GET /api/health
```

Check API health status and component availability.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": "2d 14h 35m",
    "components": {
      "analyzer": "operational",
      "workflowEngine": "operational", 
      "costDatabase": "operational"
    },
    "timestamp": "2024-09-19T12:30:00.000Z"
  }
}
```

## Data Models

### Project Analysis Result
```typescript
interface ProjectAnalysis {
  projectType: string;           // Type of construction project
  complexity: 'low' | 'medium' | 'high';
  estimatedTimeframe: string;   // Human-readable duration
  keyFeatures: string[];        // Extracted project features
  complianceRequirements: string[]; // Required permits/inspections
  riskFactors?: string[];       // Identified risk areas
}
```

### Workflow Task
```typescript
interface WorkflowTask {
  id: string;                   // Unique task identifier
  name: string;                 // Task description
  duration: number;             // Duration in days
  dependencies: string[];       // IDs of prerequisite tasks
  category: string;             // Task category (e.g., 'plumbing', 'electrical')
  materials?: string[];         // Required materials
  trades?: string[];            // Required trades/contractors
  weather_dependent?: boolean;  // Whether task is weather sensitive
  inspection_required?: boolean; // Whether inspection is needed
}
```

### Cost Estimate
```typescript
interface CostEstimate {
  totalCost: number;           // Total project cost
  materialsCost: number;       // Materials subtotal
  laborCost: number;           // Labor subtotal  
  permitsCost: number;         // Permits and fees
  contingency: number;         // Contingency amount
  confidence: number;          // Estimate confidence (0-1)
  region: string;              // Pricing region
  regionalMultiplier: number;  // Regional cost adjustment
}
```

## Error Handling

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Project description is required",
    "details": {
      "field": "description",
      "value": null
    },
    "timestamp": "2024-09-19T12:30:00.000Z",
    "requestId": "req_1634567890_abc123"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `BUSINESS_LOGIC_ERROR` | Business rules violation | 422 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_SERVER_ERROR` | Unexpected server error | 500 |

## Regional Coverage

### Canada
- Toronto, ON (multiplier: 1.15)
- Vancouver, BC (multiplier: 1.25)  
- Montreal, QC (multiplier: 1.05)
- Calgary, AB (multiplier: 1.10)
- Edmonton, AB (multiplier: 1.08)
- Ottawa, ON (multiplier: 1.12)
- Winnipeg, MB (multiplier: 0.95)

### United States
- New York, NY (multiplier: 1.45)
- Los Angeles, CA (multiplier: 1.35)
- Chicago, IL (multiplier: 1.20)
- Houston, TX (multiplier: 1.00)
- Phoenix, AZ (multiplier: 1.05)
- San Francisco, CA (multiplier: 1.55)
- Boston, MA (multiplier: 1.30)
- Seattle, WA (multiplier: 1.25)
- Denver, CO (multiplier: 1.10)

## Project Types Supported

### Residential
- `home_addition` - Room additions and expansions
- `kitchen_renovation` - Kitchen remodels and updates
- `bathroom_renovation` - Bathroom renovations
- `basement_finish` - Basement finishing and conversions
- `deck_construction` - Deck and patio construction
- `garage_construction` - Garage building and conversions

### Specialized
- `roofing` - Roof replacement and repairs
- `siding` - Exterior siding installation
- `flooring` - Floor installation and refinishing
- `electrical_upgrade` - Electrical system upgrades
- `plumbing_renovation` - Plumbing system updates
- `hvac_installation` - HVAC system installation

## Usage Examples

### Basic Project Analysis
```bash
curl -X POST /api/projects/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Add a 300 sqft deck to back of house @$45/sqft with railings and stairs"
  }'
```

### Complete Analysis with Options
```bash
curl -X POST /api/projects/complete-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Kitchen renovation: new cabinets, quartz countertops, stainless appliances @$120/sqft for 180 sqft",
    "region": "toronto",
    "options": {
      "includeOptimizations": true
    }
  }'
```

### Generate Workflow
```bash
curl -X POST /api/workflows/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "bathroom_renovation",
    "projectDetails": {
      "size": 80,
      "complexity": "medium"
    },
    "region": "vancouver"
  }'
```

## Best Practices

1. **Always include region** for accurate cost estimates
2. **Use detailed descriptions** for better AI analysis  
3. **Include project size and features** for workflow optimization
4. **Handle rate limits gracefully** with exponential backoff
5. **Validate responses** before using in production systems
6. **Cache results** when appropriate to reduce API calls
7. **Include error handling** for all API calls

## Support and Feedback

For API support, integration questions, or feedback:
- 📧 Email: support@firebuildai.com
- 📚 Documentation: https://docs.firebuildai.com
- 🐛 Issues: https://github.com/firebuildai/api/issues

## Changelog

### Version 1.0.0 (2024-09-19)
- Initial API release
- Project analysis with natural language processing
- Workflow generation with dependency management
- Regional cost estimation
- Comprehensive error handling
- Multi-regional pricing support