# FlooringHause.com Live Camera Integration Guide

## 🎯 Overview
This guide shows how flooringhause.com can integrate FireAPI's live camera room visualizer to let customers point their phone camera at floors and see different flooring options overlaid in real-time.

---

## 🔧 Technical Setup

### 1. **API Configuration**
```javascript
// FlooringHause API Configuration
const FIREAPI_CONFIG = {
    apiKey: 'flooringhause-live-key-2024', // Your dedicated API key
    baseUrl: 'https://fireapi.dev',
    wsUrl: 'wss://fireapi.dev:3011',
    clientDomain: 'https://flooringhause.com'
};
```

### 2. **Include FireAPI SDK**
```html
<!-- Add to your page head -->
<script src="https://fireapi.dev/sdk/live-camera-v1.min.js"></script>
```

### 3. **Initialize Live Camera Visualizer**
```javascript
// Initialize the camera visualizer
const floorVisualizer = new FireAPILiveCameraSDK(FIREAPI_CONFIG.apiKey, {
    baseUrl: FIREAPI_CONFIG.baseUrl,
    wsUrl: FIREAPI_CONFIG.wsUrl,
    frameRate: 15, // Frames per second
    facingMode: 'environment' // Use back camera
});
```

---

## 🏠 Product Page Integration

### **Example: Hardwood Flooring Product Page**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Premium Oak Hardwood - FlooringHause</title>
    <script src="https://fireapi.dev/sdk/live-camera-v1.min.js"></script>
    <style>
        .live-preview-container {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .try-live-button {
            background: linear-gradient(45deg, #2196F3, #4CAF50);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        
        .try-live-button:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <!-- Product Information -->
    <div class="product-info">
        <h1>Premium Oak Hardwood Flooring</h1>
        <p class="price">$8.50 per sq ft</p>
        <p>Beautiful natural oak with rich grain patterns...</p>
    </div>
    
    <!-- Live Preview Section -->
    <div class="live-preview-container">
        <h3>📱 Try Live Preview</h3>
        <p>Point your camera at your floor to see how this flooring looks in your space!</p>
        
        <button class="try-live-button" onclick="startLivePreview()">
            🎥 Start Live Preview
        </button>
        
        <!-- Camera container (hidden initially) -->
        <div id="camera-container" style="display: none; margin-top: 20px;"></div>
        
        <!-- Cost estimate display -->
        <div id="cost-estimate" style="margin-top: 15px; display: none;">
            <h4>💰 Instant Estimate</h4>
            <div id="cost-breakdown"></div>
        </div>
    </div>

    <script>
        let visualizer = null;
        
        async function startLivePreview() {
            try {
                // Initialize visualizer
                visualizer = new FireAPILiveCameraSDK('flooringhause-live-key-2024');
                
                // Show camera container
                document.getElementById('camera-container').style.display = 'block';
                
                // Start camera
                await visualizer.startCamera('camera-container');
                
                // Auto-select this product's flooring
                setTimeout(() => {
                    visualizer.selectMaterial('hardwood-oak');
                }, 1000);
                
                // Handle cost updates
                visualizer.on('costUpdate', (cost) => {
                    displayCostEstimate(cost);
                });
                
                // Handle material changes
                visualizer.on('materialChange', (material) => {
                    console.log('Previewing:', material.name);
                });
                
            } catch (error) {
                alert('Camera access required for live preview. Please allow camera permission.');
            }
        }
        
        function displayCostEstimate(cost) {
            const costDiv = document.getElementById('cost-estimate');
            const breakdownDiv = document.getElementById('cost-breakdown');
            
            costDiv.style.display = 'block';
            breakdownDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Area detected:</span>
                    <strong>${cost.sqFt} sq ft</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Material cost:</span>
                    <span>$${cost.materialCost}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Installation:</span>
                    <span>$${cost.laborCost}</span>
                </div>
                <hr>
                <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold;">
                    <span>Total Estimate:</span>
                    <span style="color: #4CAF50;">$${cost.totalCost}</span>
                </div>
                <button onclick="addToCart()" style="
                    background: #4CAF50; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    margin-top: 10px;
                    width: 100%;
                ">
                    🛒 Add ${cost.sqFt} sq ft to Cart
                </button>
            `;
        }
        
        function addToCart() {
            // Integration with FlooringHause cart system
            alert('Added to cart! (Integration with your cart system here)');
        }
    </script>
</body>
</html>
```

---

## 🛒 Shopping Cart Integration

### **Real-Time Room Measurement**
```javascript
// Advanced integration for accurate measurements
visualizer.on('floorDetected', (floorInfo) => {
    const detectedArea = floorInfo.estimatedSqFt;
    const confidence = floorInfo.confidence;
    
    if (confidence > 0.8) {
        // High confidence - update cart with detected measurements
        updateCartQuantity(detectedArea);
        
        // Show measurement accuracy
        showMeasurementInfo({
            area: detectedArea,
            confidence: confidence,
            accuracy: '±5% typical accuracy'
        });
    }
});

function updateCartQuantity(sqFt) {
    // Round up to nearest box/case
    const boxSize = 24; // sq ft per box
    const boxesNeeded = Math.ceil(sqFt / boxSize);
    
    // Update cart UI
    document.getElementById('quantity').value = boxesNeeded;
    document.getElementById('total-sqft').textContent = `${sqFt} sq ft`;
}
```

---

## 📱 Mobile App Integration

### **React Native Example**
```javascript
// FlooringHause Mobile App Integration
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

export default function LiveFloorPreview({ productId }) {
    const [cameraUrl, setCameraUrl] = useState(null);
    
    const startLivePreview = async () => {
        const response = await fetch('https://fireapi.dev/api/visualizer/camera/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'flooringhause-live-key-2024'
            },
            body: JSON.stringify({
                clientDomain: 'com.flooringhause.app',
                productId: productId,
                deviceInfo: {
                    platform: 'mobile',
                    os: 'ios' // or 'android'
                }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Load camera interface in WebView
            setCameraUrl(`https://fireapi.dev/mobile-camera?session=${data.sessionToken}`);
        }
    };
    
    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={startLivePreview}>
                <Text>🎥 Try Live Preview</Text>
            </TouchableOpacity>
            
            {cameraUrl && (
                <WebView 
                    source={{ uri: cameraUrl }}
                    style={{ flex: 1 }}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                />
            )}
        </View>
    );
}
```

---

## 💼 Business Logic Integration

### **Inventory Management**
```javascript
// Check real-time inventory before showing materials
async function getAvailableMaterials() {
    const response = await fetch('https://fireapi.dev/api/visualizer/materials/live?inStock=true', {
        headers: {
            'X-API-Key': 'flooringhause-live-key-2024',
            'Origin': 'https://flooringhause.com'
        }
    });
    
    const data = await response.json();
    
    // Filter by FlooringHause inventory
    const availableMaterials = data.materials.filter(material => {
        return checkInventoryAvailability(material.id);
    });
    
    return availableMaterials;
}

function checkInventoryAvailability(materialId) {
    // Integration with FlooringHause inventory system
    return true; // Implement actual inventory check
}
```

### **Pricing Integration**
```javascript
// Dynamic pricing based on location and current promotions
visualizer.on('costUpdate', async (baseCost) => {
    const userLocation = await getUserLocation();
    const currentPromotions = await getActivePromotions();
    
    const adjustedPricing = await fetch('https://api.flooringhause.com/pricing/calculate', {
        method: 'POST',
        body: JSON.stringify({
            baseCost,
            location: userLocation,
            promotions: currentPromotions,
            sqFt: baseCost.sqFt
        })
    });
    
    const finalPricing = await adjustedPricing.json();
    displayCustomPricing(finalPricing);
});
```

---

## 📊 Analytics Integration

### **Track User Engagement**
```javascript
// Track how users interact with live camera feature
class FlooringHouseCameraAnalytics {
    constructor() {
        this.sessionStart = Date.now();
        this.materialsViewed = [];
        this.measurements = [];
    }
    
    trackMaterialView(material) {
        this.materialsViewed.push({
            materialId: material.id,
            timestamp: Date.now(),
            duration: Date.now() - this.lastMaterialTime
        });
        
        // Send to FlooringHause analytics
        gtag('event', 'material_preview', {
            'material_type': material.category,
            'material_name': material.name,
            'price_range': this.getPriceRange(material.price)
        });
    }
    
    trackMeasurement(measurement) {
        this.measurements.push({
            sqFt: measurement.sqFt,
            confidence: measurement.confidence,
            timestamp: Date.now()
        });
        
        // Track conversion potential
        if (measurement.sqFt > 100) {
            gtag('event', 'high_value_measurement', {
                'estimated_value': measurement.estimatedValue,
                'room_size': this.categorizeRoomSize(measurement.sqFt)
            });
        }
    }
}

const analytics = new FlooringHouseCameraAnalytics();
visualizer.on('materialChange', material => analytics.trackMaterialView(material));
visualizer.on('costUpdate', cost => analytics.trackMeasurement(cost));
```

---

## 🔐 API Key Configuration

### **Request Your API Key**
1. **Contact FireAPI**: sales@fireapi.dev
2. **Provide Domain**: flooringhause.com 
3. **Specify Materials**: Hardwood, vinyl, laminate, etc.
4. **Set Rate Limits**: 1000 sessions/hour recommended

### **Security Setup**
```javascript
// Secure API key handling
const API_CONFIG = {
    // Never expose full API key in frontend
    sessionEndpoint: 'https://api.flooringhause.com/camera/session',
    
    // Your backend handles the real API key
    getSessionToken: async () => {
        const response = await fetch('/api/camera/session', {
            headers: { 'Authorization': 'Bearer ' + userToken }
        });
        return response.json();
    }
};
```

---

## 🚀 Go-Live Checklist

### **Pre-Launch**
- [ ] API key configured and tested
- [ ] Camera permissions handling implemented
- [ ] Mobile responsiveness verified
- [ ] Inventory integration connected
- [ ] Pricing calculations accurate
- [ ] Analytics tracking setup

### **Launch Day**
- [ ] Monitor API usage and response times
- [ ] Track user engagement metrics
- [ ] Collect user feedback
- [ ] Monitor error rates and connectivity

### **Post-Launch**
- [ ] A/B test different UI layouts
- [ ] Optimize material loading times  
- [ ] Add new flooring materials
- [ ] Expand to other product categories

---

## 📞 **Support & Custom Features**

**Need custom features for FlooringHause?**
- Custom material textures
- Advanced room measurement
- AR furniture placement
- Multi-room visualization

**Contact**: 
- Email: support@fireapi.dev
- Phone: 1-800-FIREAPI
- Slack: #flooringhause-integration

---

## 💡 **Success Metrics to Track**

1. **Engagement**: Camera session duration and completion rates
2. **Conversion**: From live preview to add-to-cart
3. **Accuracy**: User satisfaction with measurements
4. **Performance**: Load times and frame rates
5. **Revenue**: Additional sales from live preview feature

**🎯 Expected Results**: 15-25% increase in conversion rates, 40% longer time on product pages, 60% reduction in returns due to better expectation setting.

---

*Ready to revolutionize flooring shopping with live camera previews! 🏠✨*