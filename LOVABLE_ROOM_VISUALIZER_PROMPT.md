# 🎯 Lovable Integration Prompt: FireAPI Room Visualizer

## 📋 **Project Overview**

We've built a **revolutionary Live Camera AR Floor Visualizer** with comprehensive LiDAR integration that transforms how customers shop for flooring. This system allows users to point their phone camera at their floor and see different flooring materials overlaid in real-time with accurate measurements and cost calculations.

---

## 🎥 **Core Technology Built**

### **Live Camera AR System**
- **Real-time WebRTC camera feed** with 15 FPS processing
- **Computer vision floor detection** using RANSAC algorithms
- **AR-style material overlay** with perspective correction
- **WebSocket communication** for instant updates (port 3011)
- **Multi-tenant API architecture** for different client sites

### **LiDAR Integration Ecosystem**
- **Specialized LiDAR APIs** for construction, flooring, roofing, landscaping
- **Native Android SDK** with ARCore integration
- **Millimeter-precision measurement** with ±5% accuracy
- **Real-time point cloud processing** and analysis
- **3D room reconstruction** and boundary detection

---

## 🏗️ **What We Need Lovable to Build**

### 🎯 **Primary Frontend Application**

**Create a modern, mobile-first React web application that integrates with our FireAPI Live Camera Room Visualizer**

#### **Core Requirements:**

1. **🎥 Live Camera Interface**
   - Integrate our JavaScript SDK: `FireAPILiveCameraSDK`
   - Real-time camera feed with AR material overlay
   - Mobile-optimized touch controls and responsive design
   - WebSocket connection to `wss://fireapi.dev:3011`

2. **🎨 Material Selection UI**
   - Interactive material picker with thumbnails
   - Categories: Hardwood, Vinyl, Ceramic, Laminate, Porcelain
   - Real-time material switching with instant visual feedback
   - Material details: price, installation complexity, availability

3. **📏 Measurement Dashboard**
   - Real-time room area calculation display
   - Corner detection and room dimension visualization
   - Perimeter measurement with precision indicators
   - Floor condition assessment display

4. **💰 Cost Calculator**
   - Instant cost estimates with material + labor pricing
   - Dynamic pricing based on detected square footage
   - Material waste calculation (10-15% depending on type)
   - Add to cart functionality with detected measurements

5. **📱 Mobile Experience**
   - Camera permission handling and error states
   - Touch gestures for material selection
   - Landscape and portrait mode support
   - Loading states and scan progress indicators

#### **Technical Integration Points:**

```javascript
// SDK Integration Example
const visualizer = new FireAPILiveCameraSDK('your-api-key', {
    baseUrl: 'https://fireapi.dev',
    wsUrl: 'wss://fireapi.dev:3011',
    frameRate: 15
});

// Event Handlers to Implement
visualizer.on('materialChange', (material) => {
    // Update UI with selected material
});

visualizer.on('costUpdate', (cost) => {
    // Update cost display and cart
});

visualizer.on('floorDetected', (floorInfo) => {
    // Update measurement dashboard
});
```

---

## 🎨 **UI/UX Design Requirements**

### **Color Scheme & Branding**
- **Primary**: Modern blues and greens (#2196F3, #4CAF50)
- **Accent**: Premium gold for cost displays (#FFD700)
- **Background**: Clean whites and light grays (#F8F9FA)
- **Text**: Dark grays for readability (#212529)

### **Layout Structure**

```
┌─────────────────────────────────┐
│          Camera Feed            │
│     (Live AR Overlay)           │
│                                 │
│  [Floor Detection Indicator]    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│     Material Selector           │
│  [🏠] [🔲] [🟫] [⬜] [🟧]      │
│ Hardwood Vinyl Ceramic Lam...   │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│    Measurement Display          │
│  📏 Area: 245 sq ft             │
│  📐 Dimensions: 15' x 16.3'     │
│  💰 Est. Cost: $2,847           │
│  [🛒 Add to Cart]               │
└─────────────────────────────────┘
```

### **Key Features to Include**

1. **📱 Camera Controls**
   - Start/stop camera button
   - Camera switching (front/back)
   - Focus indicator and guidance overlay
   - Permission request handling

2. **🎯 AR Experience**
   - Floor detection visual feedback
   - Material overlay opacity control
   - Scanning progress indicator
   - Accuracy confidence display

3. **📊 Analytics Dashboard**
   - Scan completion percentage
   - Point cloud density indicator
   - Measurement accuracy confidence
   - Session duration timer

4. **🔧 Settings Panel**
   - Units selection (metric/imperial)
   - Precision settings (millimeter/centimeter)
   - Room type selection
   - Calibration options

---

## 🚀 **Pages/Components to Build**

### **1. Home Page**
```jsx
// Main landing page with camera activation
<HomePage>
  <HeroSection>
    <Title>See Your New Floor Before You Buy</Title>
    <Subtitle>Point your camera, pick materials, get instant estimates</Subtitle>
    <StartCameraButton />
  </HeroSection>
  <FeatureGrid />
  <MaterialShowcase />
</HomePage>
```

### **2. Camera Visualizer Page**
```jsx
// Main AR experience
<CameraVisualizerPage>
  <CameraView>
    <AROverlay />
    <FloorDetectionIndicator />
    <ScanProgress />
  </CameraView>
  
  <MaterialSelector materials={availableMaterials} />
  
  <MeasurementPanel>
    <AreaDisplay />
    <DimensionsDisplay />
    <CostCalculator />
  </MeasurementPanel>
  
  <ActionButtons>
    <AddToCartButton />
    <ShareResultsButton />
    <SaveScanButton />
  </ActionButtons>
</CameraVisualizerPage>
```

### **3. Results Page**
```jsx
// Scan results and report
<ResultsPage>
  <ScanSummary>
    <FloorPlan2D />
    <MeasurementReport />
    <MaterialRecommendations />
  </ScanSummary>
  
  <CostBreakdown>
    <MaterialCosts />
    <LaborCosts />
    <TotalEstimate />
  </CostBreakdown>
  
  <ActionPanel>
    <RequestQuoteButton />
    <FindInstallerButton />
    <ShareResultsButton />
  </ActionPanel>
</ResultsPage>
```

### **4. Material Catalog**
```jsx
// Browse all available materials
<MaterialCatalogPage>
  <FilterPanel>
    <CategoryFilter />
    <PriceRangeFilter />
    <InStockFilter />
  </FilterPanel>
  
  <MaterialGrid>
    {materials.map(material => (
      <MaterialCard key={material.id}>
        <MaterialImage />
        <MaterialInfo />
        <TryARButton />
      </MaterialCard>
    ))}
  </MaterialGrid>
</MaterialCatalogPage>
```

---

## 📦 **Required Dependencies**

### **Core Libraries**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@emotion/react": "^11.10.0",
    "@emotion/styled": "^11.10.0",
    "@mui/material": "^5.11.0",
    "framer-motion": "^9.0.0",
    "three": "^0.149.0",
    "@react-three/fiber": "^8.11.0"
  }
}
```

### **FireAPI SDK Integration**
```javascript
// Include our SDK (provided)
<script src="https://fireapi.dev/sdk/live-camera-v1.min.js"></script>

// Or via npm package (when published)
import FireAPILiveCameraSDK from '@fireapi/live-camera-sdk';
```

---

## 🎯 **User Stories to Implement**

### **Story 1: First-Time User Experience**
```
As a homeowner shopping for flooring,
I want to quickly try the AR experience,
So I can see how different floors look in my room.

Acceptance Criteria:
- One-click camera activation
- Automatic floor detection within 5 seconds
- Material selection with immediate visual feedback
- Cost estimate appears within 10 seconds
```

### **Story 2: Material Comparison**
```
As a customer comparing flooring options,
I want to switch between materials easily,
So I can see which one looks best in my space.

Acceptance Criteria:
- Instant material switching without scan restart
- Side-by-side comparison mode
- Save favorite materials for later
- Share results with family/contractor
```

### **Story 3: Accurate Measurements**
```
As a contractor planning an installation,
I want precise room measurements,
So I can order the correct amount of materials.

Acceptance Criteria:
- Measurement accuracy within ±5%
- Export measurements to PDF report
- Integration with material calculator
- Waste percentage calculation included
```

---

## 📱 **Mobile-First Design Patterns**

### **Touch Interactions**
- **Tap**: Select materials from picker
- **Long press**: Access material details
- **Pinch to zoom**: Examine floor overlay closely
- **Swipe**: Navigate between materials quickly

### **Progressive Enhancement**
1. **Basic**: Static material images with manual input
2. **Enhanced**: Live camera with basic overlay
3. **Advanced**: Full AR with LiDAR integration
4. **Premium**: AI-powered room analysis and recommendations

### **Performance Considerations**
- **Lazy loading**: Materials load as needed
- **Image optimization**: WebP format with fallbacks
- **WebSocket management**: Automatic reconnection
- **Memory management**: Cleanup camera resources

---

## 🔧 **API Integration Specifications**

### **Authentication**
```javascript
// API key required for all requests
const API_KEY = 'your-client-api-key';
const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
};
```

### **Key Endpoints to Integrate**
```javascript
// Start camera session
POST /api/visualizer/camera/start
Body: { clientDomain, deviceInfo, roomType }

// Get materials catalog
GET /api/visualizer/materials/live?inStock=true&category=hardwood
Headers: { X-API-Key, Origin }

// WebSocket for real-time updates
WS wss://fireapi.dev:3011
Messages: camera_frame, select_material, get_materials
```

### **Error Handling**
```javascript
// Implement robust error handling
try {
  await visualizer.startCamera('container');
} catch (error) {
  if (error.code === 'CAMERA_PERMISSION_DENIED') {
    showPermissionDialog();
  } else if (error.code === 'DEVICE_NOT_SUPPORTED') {
    showFallbackExperience();
  } else {
    showGenericError(error.message);
  }
}
```

---

## 🎨 **Design System Components**

### **Custom Components Needed**
- `<CameraViewport>` - AR camera display
- `<MaterialPicker>` - Horizontal scrolling material selector
- `<MeasurementDisplay>` - Real-time area/cost display
- `<FloorOverlay>` - AR material overlay visualization
- `<ScanProgress>` - Circular progress with scan status
- `<CostBreakdown>` - Expandable cost details
- `<PermissionGate>` - Camera permission handling

### **Animation & Transitions**
- **Material switching**: Smooth crossfade (300ms)
- **Measurement updates**: Number counting animation
- **Scan progress**: Circular progress with easing
- **Cost changes**: Highlighting with color transition

---

## 🚀 **Success Metrics to Track**

### **User Engagement**
- Camera session duration (target: >2 minutes)
- Materials tested per session (target: 3+)
- Scan completion rate (target: >80%)
- Add-to-cart conversion (target: >15%)

### **Technical Performance**
- Camera initialization time (<3 seconds)
- Material switch responsiveness (<200ms)
- WebSocket connection stability (>99%)
- Measurement accuracy confidence (>95%)

---

## 🎯 **Final Deliverable**

**Build a complete, production-ready React web application that:**

1. ✅ **Integrates seamlessly** with our FireAPI Live Camera system
2. ✅ **Provides intuitive AR experience** for flooring visualization
3. ✅ **Handles real-time measurements** and cost calculations
4. ✅ **Works flawlessly on mobile** devices with responsive design
5. ✅ **Includes comprehensive error handling** and fallback experiences
6. ✅ **Delivers professional UI/UX** suitable for commercial deployment

**The result should be a revolutionary flooring shopping experience that allows customers to see exactly how different materials look in their real space through live camera preview with accurate measurements and instant pricing!**

---

## 🔗 **Resources & Documentation**

- **Live API Server**: https://3010-ibh4uzj8dhpijce02s4dn-6532622b.e2b.dev
- **WebSocket Server**: Port 3011 (when deployed)
- **SDK Documentation**: `fireapi-live-camera-sdk.js` 
- **Integration Examples**: `FLOORINGHAUSE_INTEGRATION_GUIDE.md`
- **LiDAR API Docs**: `lidar-api/README.md`

**Ready to revolutionize flooring e-commerce with cutting-edge AR technology! 🏠✨**