# 🏠 Room Visualizer API - FireAPI.dev

## Overview

The **Room Visualizer API** enables any application to integrate powerful room visualization capabilities with image upload, material selection, and cost estimation features. Perfect for construction, interior design, and home improvement applications.

**Base URL**: `https://fireapi.dev`  
**Authentication**: API Key required (`X-API-Key` header)  
**Rate Limits**: 100 requests per 15 minutes (general), 15 requests per 15 minutes (image processing)

---

## 🚀 Quick Start

### 1. Get Your API Key
Contact **FireAPI.dev** to obtain your API key for production access.

### 2. Basic Usage
```javascript
const apiKey = 'your-api-key-here';
const baseUrl = 'https://fireapi.dev';

// Upload and analyze room image
const uploadResponse = await fetch(`${baseUrl}/api/visualizer/upload-image`, {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey
  },
  body: formData // FormData with image file
});
```

---

## 📋 API Endpoints

### 🖼️ Image Upload & Processing

#### `POST /api/visualizer/upload-image`
Upload room images for visualization processing.

**Headers**:
```
X-API-Key: your-api-key
Content-Type: multipart/form-data
```

**Body**: FormData with image file
```javascript
const formData = new FormData();
formData.append('image', imageFile); // File object
formData.append('roomType', 'living-room'); // Optional
formData.append('analysisLevel', 'detailed'); // Optional: basic, detailed
```

**Response**:
```json
{
  "success": true,
  "data": {
    "imageId": "img_1234567890",
    "processedImageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
    "originalImageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
    "analysis": {
      "dimensions": { "width": 1200, "height": 800 },
      "detectedSurfaces": {
        "floor": { "area": 150.5, "bounds": {...} },
        "walls": [{ "area": 85.2, "bounds": {...} }],
        "backsplash": { "area": 12.8, "bounds": {...} }
      },
      "roomType": "living-room",
      "confidence": 0.92
    },
    "processingTime": "2.3s"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_FORMAT",
    "message": "Supported formats: JPEG, PNG, WebP. Max size: 10MB",
    "details": {...}
  }
}
```

---

### 🏢 Flooring Visualization

#### `POST /api/visualizer/flooring`
Apply flooring materials to uploaded room images.

**Headers**:
```
X-API-Key: your-api-key
Content-Type: application/json
```

**Body**:
```json
{
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQ...", // From upload response
  "material": "hardwood-oak", // Material ID
  "roomType": "living-room",
  "intensity": 0.8, // Optional: 0.1-1.0
  "blend": "realistic" // Optional: realistic, enhanced, subtle
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "visualizedImageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
    "material": {
      "id": "hardwood-oak",
      "name": "Premium Oak Hardwood",
      "description": "Beautiful solid oak flooring with natural grain patterns",
      "pricePerSqFt": 8.50,
      "category": "hardwood",
      "texture": "wood-grain",
      "colors": ["natural", "honey", "dark-walnut"]
    },
    "costEstimate": {
      "surfaceArea": 150.5, // sq ft
      "materialCost": 1279.25,
      "laborCost": 451.50,
      "totalCost": 1730.75,
      "currency": "USD"
    },
    "confidence": 0.94
  }
}
```

---

### 🎨 Paint Color Visualization

#### `POST /api/visualizer/paint`
Apply paint colors to walls in uploaded room images.

**Headers**:
```
X-API-Key: your-api-key
Content-Type: application/json
```

**Body**:
```json
{
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
  "color": {
    "hex": "#3498db",
    "name": "Ocean Blue"
  },
  "surfaces": ["main-wall", "accent-wall"], // Optional: specific walls
  "finish": "satin" // Optional: matte, satin, semi-gloss, gloss
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "visualizedImageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
    "color": {
      "hex": "#3498db",
      "name": "Ocean Blue",
      "brand": "Sherwin Williams",
      "code": "SW-6494"
    },
    "coverage": {
      "wallArea": 280.5, // sq ft
      "gallonsNeeded": 1.2,
      "coats": 2
    },
    "costEstimate": {
      "paintCost": 89.95,
      "laborCost": 168.30,
      "totalCost": 258.25,
      "currency": "USD"
    }
  }
}
```

---

### 🔧 Backsplash Visualization

#### `POST /api/visualizer/backsplash`
Apply backsplash materials to kitchen/bathroom images.

**Headers**:
```
X-API-Key: your-api-key
Content-Type: application/json
```

**Body**:
```json
{
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
  "material": "subway-tile-white",
  "pattern": "herringbone", // Optional: subway, herringbone, brick, stack
  "grout": {
    "color": "#f0f0f0",
    "width": "1/8"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "visualizedImageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
    "material": {
      "id": "subway-tile-white",
      "name": "Classic White Subway Tile",
      "size": "3x6 inches",
      "pricePerSqFt": 12.00
    },
    "installation": {
      "pattern": "herringbone",
      "complexity": "medium",
      "laborMultiplier": 1.3
    },
    "costEstimate": {
      "surfaceArea": 28.5,
      "materialCost": 342.00,
      "laborCost": 427.50,
      "totalCost": 769.50,
      "currency": "USD"
    }
  }
}
```

---

### 📚 Material Catalog

#### `GET /api/visualizer/materials`
Get available materials for visualization.

**Headers**:
```
X-API-Key: your-api-key
```

**Query Parameters**:
```
?category=flooring          // Filter by category
?priceRange=low            // low, medium, high, premium
?style=modern              // traditional, modern, rustic, luxury
?limit=20                  // Results per page
?offset=0                  // Pagination offset
```

**Response**:
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "hardwood-oak",
        "name": "Premium Oak Hardwood",
        "category": "flooring",
        "subcategory": "hardwood",
        "pricePerSqFt": 8.50,
        "priceRange": "medium",
        "style": ["traditional", "rustic"],
        "colors": ["natural", "honey", "dark-walnut"],
        "thumbnail": "https://fireapi.dev/materials/hardwood-oak-thumb.jpg",
        "description": "Beautiful solid oak flooring with natural grain patterns",
        "specifications": {
          "thickness": "3/4 inch",
          "width": "3.25 inch",
          "finish": "pre-finished",
          "warranty": "25 years"
        }
      }
    ],
    "pagination": {
      "total": 47,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "categories": ["flooring", "backsplash", "paint", "countertops"]
  }
}
```

---

## 🎨 Available Materials

### 🏢 Flooring Options
- **Hardwood Oak** - Classic oak flooring ($8.50/sq ft)
- **Maple Engineered** - Durable engineered maple ($6.75/sq ft)
- **Marble Carrara** - Luxury marble tiles ($15.00/sq ft)
- **Ceramic Tile** - Versatile ceramic options ($4.25/sq ft)
- **Laminate Wood** - Cost-effective wood-look ($3.75/sq ft)
- **Luxury Vinyl Plank** - Waterproof LVP ($5.50/sq ft)

### 🔧 Backsplash Options
- **Subway Tile White** - Classic 3x6 subway ($12.00/sq ft)
- **Trusa Mosaics Glass** - Premium glass mosaic ($28.00/sq ft)
- **Natural Stone** - Elegant travertine ($18.50/sq ft)
- **Stainless Steel** - Modern steel backsplash ($22.00/sq ft)
- **Ceramic Moroccan** - Decorative patterns ($16.75/sq ft)

### 🎨 Paint Collections
- **Sherwin Williams** - 500+ colors with color matching
- **Benjamin Moore** - Premium paint with advanced formulas
- **Behr Premium** - High-quality interior/exterior paints

---

## 💻 Frontend Integration Examples

### React Component Integration
```jsx
import React, { useState } from 'react';
import axios from 'axios';

const RoomVisualizer = ({ apiKey }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [visualizedImage, setVisualizedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadImage = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post(
        'https://fireapi.dev/api/visualizer/upload-image',
        formData,
        {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setSelectedImage(response.data.data.processedImageUrl);
      return response.data.data;
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyMaterial = async (imageUrl, material) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://fireapi.dev/api/visualizer/flooring',
        {
          imageUrl,
          material: material.id,
          roomType: 'living-room'
        },
        {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setVisualizedImage(response.data.data.visualizedImageUrl);
      return response.data.data;
    } catch (error) {
      console.error('Visualization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="room-visualizer">
      {/* Upload interface */}
      {/* Material selector */}
      {/* Visualization display */}
    </div>
  );
};
```

### JavaScript/Vanilla Integration
```javascript
class RoomVisualizerAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://fireapi.dev';
  }

  async uploadImage(imageFile, options = {}) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    if (options.roomType) formData.append('roomType', options.roomType);
    if (options.analysisLevel) formData.append('analysisLevel', options.analysisLevel);

    const response = await fetch(`${this.baseUrl}/api/visualizer/upload-image`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey
      },
      body: formData
    });

    return await response.json();
  }

  async visualizeFlooring(imageUrl, materialId, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/visualizer/flooring`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl,
        material: materialId,
        ...options
      })
    });

    return await response.json();
  }

  async getMaterials(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${this.baseUrl}/api/visualizer/materials?${params}`,
      {
        headers: {
          'X-API-Key': this.apiKey
        }
      }
    );

    return await response.json();
  }
}

// Usage
const visualizer = new RoomVisualizerAPI('your-api-key');

// Upload and visualize
const uploadResult = await visualizer.uploadImage(fileInput.files[0], {
  roomType: 'living-room',
  analysisLevel: 'detailed'
});

const visualizationResult = await visualizer.visualizeFlooring(
  uploadResult.data.processedImageUrl,
  'hardwood-oak'
);
```

---

## 🔒 Authentication & Security

### API Key Management
```javascript
// Always include API key in headers
const headers = {
  'X-API-Key': 'your-production-api-key',
  'Content-Type': 'application/json'
};

// Never expose API keys in client-side code
// Use environment variables or server-side proxy
const apiKey = process.env.FIREAPI_KEY;
```

### CORS Configuration
The API supports CORS for the following origins:
- `https://fireapi.dev`
- `https://www.fireapi.dev`  
- `https://firebuild.ai`
- Any subdomain of `fireapi.dev` or `firebuild.ai`
- `localhost` for development

### Rate Limits
- **General API**: 100 requests per 15 minutes per IP
- **Image Processing**: 15 requests per 15 minutes per IP
- **Material Catalog**: 200 requests per 15 minutes per IP

---

## 📊 Response Codes & Error Handling

### Success Codes
- `200` - Success with data
- `201` - Resource created successfully

### Error Codes
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (insufficient permissions)
- `413` - Payload Too Large (file size exceeded)
- `415` - Unsupported Media Type (invalid file format)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "validation details",
      "allowedFormats": ["JPEG", "PNG", "WebP"],
      "maxSize": "10MB"
    },
    "documentation": "https://fireapi.dev/docs/room-visualizer"
  }
}
```

---

## 🎯 Use Cases

### Interior Design Apps
```javascript
// Perfect for interior design applications
const designApp = {
  async createRoomDesign(roomImage, materials) {
    // Upload room image
    const upload = await visualizer.uploadImage(roomImage);
    
    // Apply selected materials
    const flooringResult = await visualizer.visualizeFlooring(
      upload.data.processedImageUrl,
      materials.flooring
    );
    
    const paintResult = await visualizer.visualizePaint(
      flooringResult.data.visualizedImageUrl,
      materials.paint
    );
    
    return {
      finalImage: paintResult.data.visualizedImageUrl,
      totalCost: flooringResult.data.costEstimate.totalCost + 
                 paintResult.data.costEstimate.totalCost
    };
  }
};
```

### E-commerce Integration
```javascript
// For home improvement e-commerce sites
const ecommerceIntegration = {
  async previewProduct(productId, roomImage) {
    const material = await this.getProductMaterial(productId);
    const visualization = await visualizer.visualizeFlooring(
      roomImage,
      material.apiId
    );
    
    return {
      previewImage: visualization.data.visualizedImageUrl,
      pricing: visualization.data.costEstimate,
      productInfo: material
    };
  }
};
```

### Construction Estimating
```javascript
// For construction and contractor applications  
const contractorTool = {
  async generateEstimate(roomImages, selectedMaterials) {
    let totalCost = 0;
    const estimates = [];
    
    for (const [roomImage, materials] of zip(roomImages, selectedMaterials)) {
      const upload = await visualizer.uploadImage(roomImage);
      
      for (const material of materials) {
        const result = await visualizer.visualizeFlooring(
          upload.data.processedImageUrl,
          material
        );
        
        estimates.push(result.data.costEstimate);
        totalCost += result.data.costEstimate.totalCost;
      }
    }
    
    return { estimates, totalCost };
  }
};
```

---

## 📞 Support & Resources

### Documentation
- **Full API Docs**: https://fireapi.dev/docs
- **Material Catalog**: https://fireapi.dev/materials  
- **Pricing**: https://fireapi.dev/pricing
- **Status Page**: https://status.fireapi.dev

### Getting Help
- **Email**: support@fireapi.dev
- **Documentation**: https://fireapi.dev/docs/room-visualizer
- **Status Updates**: https://status.fireapi.dev
- **Community**: https://community.fireapi.dev

### API Key Registration
Contact **FireAPI.dev** to get your production API key:
- Email: api-keys@fireapi.dev
- Include: Company name, use case, expected volume
- Response time: 24-48 hours for standard keys

---

## 🚀 Ready to Build?

The Room Visualizer API is production-ready and perfect for:
- 🏠 Interior design applications
- 🛒 E-commerce product visualization  
- 🔨 Construction estimation tools
- 📱 Home improvement mobile apps
- 💼 Real estate staging tools

**Start building amazing room visualization features today!** 🎨