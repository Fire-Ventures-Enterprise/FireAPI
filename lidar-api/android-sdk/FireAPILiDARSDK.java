/**
 * FireAPI LiDAR SDK for Android
 * Native Android integration for LiDAR scanning and room measurement
 * Supports ARCore and device LiDAR sensors
 */

package com.fireapi.lidar;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Camera2;
import android.util.Log;
import androidx.core.app.ActivityCompat;

import com.google.ar.core.*;
import com.google.ar.core.exceptions.*;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import okhttp3.*;
import okio.ByteString;

public class FireAPILiDARSDK {
    
    private static final String TAG = "FireAPILiDAR";
    private static final String API_BASE_URL = "https://fireapi.dev";
    private static final String WS_BASE_URL = "wss://fireapi.dev:3012";
    
    private Context context;
    private String apiKey;
    private Session arSession;
    private WebSocket webSocket;
    private OkHttpClient httpClient;
    
    // Scanning state
    private boolean isScanning = false;
    private String currentScanId;
    private List<PointCloud> pointClouds = new ArrayList<>();
    private ScanListener scanListener;
    
    // Configuration
    private ScanConfig scanConfig;
    
    /**
     * Interface for scan event callbacks
     */
    public interface ScanListener {
        void onScanStarted(String scanId);
        void onScanProgress(ScanProgress progress);
        void onScanCompleted(ScanResult result);
        void onScanError(String error);
        void onMeasurementUpdate(FloorMeasurements measurements);
    }
    
    /**
     * Configuration class for LiDAR scanning
     */
    public static class ScanConfig {
        public String roomType = "unknown";
        public String units = "imperial"; // metric, imperial
        public String precision = "millimeter";
        public float targetAccuracy = 0.95f;
        public boolean enableVisualOdometry = true;
        public boolean enableDepthOcclusion = true;
        
        public ScanConfig() {}
        
        public ScanConfig setRoomType(String roomType) {
            this.roomType = roomType;
            return this;
        }
        
        public ScanConfig setUnits(String units) {
            this.units = units;
            return this;
        }
        
        public ScanConfig setPrecision(String precision) {
            this.precision = precision;
            return this;
        }
        
        public ScanConfig setTargetAccuracy(float accuracy) {
            this.targetAccuracy = accuracy;
            return this;
        }
    }
    
    /**
     * Scan progress information
     */
    public static class ScanProgress {
        public float completionPercent;
        public float currentArea;
        public float confidence;
        public int pointCount;
        public long scanDuration;
        
        public ScanProgress(float completion, float area, float confidence, int points, long duration) {
            this.completionPercent = completion;
            this.currentArea = area;
            this.confidence = confidence;
            this.pointCount = points;
            this.scanDuration = duration;
        }
    }
    
    /**
     * Floor measurement results
     */
    public static class FloorMeasurements {
        public float totalArea;
        public float perimeter;
        public RoomDimensions dimensions;
        public List<CornerPoint> corners;
        public FloorCondition condition;
        public Map<String, MaterialRequirement> materialNeeds;
        
        public static class RoomDimensions {
            public float length;
            public float width;
            public float aspectRatio;
        }
        
        public static class CornerPoint {
            public float x, y, z;
            public float angle;
            public String type; // "interior", "exterior"
        }
        
        public static class FloorCondition {
            public String condition; // "excellent", "good", "fair", "poor"
            public float levelness;
            public List<String> issues;
        }
        
        public static class MaterialRequirement {
            public String name;
            public int unitsNeeded;
            public float grossArea;
            public float cost;
            public String installationComplexity;
        }
    }
    
    /**
     * Complete scan result
     */
    public static class ScanResult {
        public String scanId;
        public long timestamp;
        public FloorMeasurements measurements;
        public ScanQuality quality;
        public String reportUrl;
        public String visualizationUrl;
        
        public static class ScanQuality {
            public float confidence;
            public float pointDensity;
            public float scanCoverage;
            public String accuracy;
        }
    }
    
    /**
     * Constructor
     */
    public FireAPILiDARSDK(Context context, String apiKey) {
        this.context = context;
        this.apiKey = apiKey;
        this.httpClient = new OkHttpClient();
        this.scanConfig = new ScanConfig();
        
        Log.d(TAG, "FireAPI LiDAR SDK initialized");
    }
    
    /**
     * Check if device supports LiDAR scanning
     */
    public boolean isLiDARSupported() {
        try {
            // Check for ARCore support
            ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(context);
            if (availability != ArCoreApk.Availability.SUPPORTED_INSTALLED) {
                return false;
            }
            
            // Check for camera permission
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.CAMERA) 
                != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
            
            return true;
            
        } catch (Exception e) {
            Log.e(TAG, "Error checking LiDAR support: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Initialize ARCore session
     */
    public CompletableFuture<Boolean> initializeARCore() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Create AR session
                arSession = new Session(context);
                
                // Configure session for LiDAR
                Config config = new Config(arSession);
                config.setDepthMode(Config.DepthMode.AUTOMATIC);
                config.setInstantPlacementMode(Config.InstantPlacementMode.LOCAL_Y_UP);
                config.setLightEstimationMode(Config.LightEstimationMode.ENVIRONMENTAL_HDR);
                
                arSession.configure(config);
                
                Log.d(TAG, "ARCore session initialized successfully");
                return true;
                
            } catch (UnavailableArcoreNotInstalledException e) {
                Log.e(TAG, "ARCore not installed: " + e.getMessage());
                return false;
            } catch (UnavailableApkTooOldException e) {
                Log.e(TAG, "ARCore APK too old: " + e.getMessage());
                return false;
            } catch (UnavailableSdkTooOldException e) {
                Log.e(TAG, "SDK too old: " + e.getMessage());
                return false;
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize ARCore: " + e.getMessage());
                return false;
            }
        });
    }
    
    /**
     * Start LiDAR room scanning
     */
    public CompletableFuture<String> startRoomScan(ScanConfig config, ScanListener listener) {
        this.scanConfig = config;
        this.scanListener = listener;
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Start scan session with API
                JSONObject requestBody = new JSONObject();
                requestBody.put("roomType", config.roomType);
                requestBody.put("units", config.units);
                requestBody.put("precision", config.precision);
                requestBody.put("targetAccuracy", config.targetAccuracy);
                requestBody.put("deviceInfo", getDeviceInfo());
                
                Request request = new Request.Builder()
                    .url(API_BASE_URL + "/api/lidar/flooring/start-scan")
                    .post(RequestBody.create(requestBody.toString(), MediaType.parse("application/json")))
                    .addHeader("X-API-Key", apiKey)
                    .addHeader("Content-Type", "application/json")
                    .build();
                
                Response response = httpClient.newCall(request).execute();
                if (!response.isSuccessful()) {
                    throw new IOException("Failed to start scan: " + response.message());
                }
                
                JSONObject result = new JSONObject(response.body().string());
                currentScanId = result.getString("scanId");
                
                // Connect to WebSocket for real-time updates
                connectWebSocket(currentScanId);
                
                // Start ARCore scanning
                isScanning = true;
                startARCoreScan();
                
                if (listener != null) {
                    listener.onScanStarted(currentScanId);
                }
                
                Log.d(TAG, "Room scan started with ID: " + currentScanId);
                return currentScanId;
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to start room scan: " + e.getMessage());
                if (listener != null) {
                    listener.onScanError("Failed to start scan: " + e.getMessage());
                }
                throw new RuntimeException(e);
            }
        });
    }
    
    /**
     * Connect to WebSocket for real-time communication
     */
    private void connectWebSocket(String scanId) {
        Request request = new Request.Builder()
            .url(WS_BASE_URL + "/lidar/" + scanId)
            .addHeader("X-API-Key", apiKey)
            .build();
        
        webSocket = httpClient.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                Log.d(TAG, "WebSocket connected");
            }
            
            @Override
            public void onMessage(WebSocket webSocket, String text) {
                handleWebSocketMessage(text);
            }
            
            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                Log.e(TAG, "WebSocket error: " + t.getMessage());
                if (scanListener != null) {
                    scanListener.onScanError("Connection error: " + t.getMessage());
                }
            }
            
            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                Log.d(TAG, "WebSocket closed: " + reason);
            }
        });
    }
    
    /**
     * Handle WebSocket messages
     */
    private void handleWebSocketMessage(String message) {
        try {
            JSONObject data = new JSONObject(message);
            String type = data.getString("type");
            
            switch (type) {
                case "scanProgress":
                    handleScanProgress(data);
                    break;
                case "measurementUpdate":
                    handleMeasurementUpdate(data);
                    break;
                case "scanCompleted":
                    handleScanCompleted(data);
                    break;
                case "error":
                    handleScanError(data.getString("message"));
                    break;
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error parsing WebSocket message: " + e.getMessage());
        }
    }
    
    /**
     * Start ARCore scanning loop
     */
    private void startARCoreScan() {
        new Thread(() -> {
            while (isScanning && arSession != null) {
                try {
                    // Update AR session
                    Frame frame = arSession.update();
                    
                    // Get point cloud data
                    PointCloud pointCloud = frame.acquirePointCloud();
                    
                    if (pointCloud.getPoints().hasRemaining()) {
                        // Process point cloud
                        processPointCloud(pointCloud);
                        
                        // Send data to server via WebSocket
                        sendPointCloudData(pointCloud);
                    }
                    
                    pointCloud.close();
                    
                    // Control frame rate (30 FPS)
                    Thread.sleep(33);
                    
                } catch (Exception e) {
                    Log.e(TAG, "ARCore scan error: " + e.getMessage());
                    if (scanListener != null) {
                        scanListener.onScanError("Scanning error: " + e.getMessage());
                    }
                    break;
                }
            }
        }).start();
    }
    
    /**
     * Process point cloud data locally
     */
    private void processPointCloud(PointCloud pointCloud) {
        // Store point cloud for local processing
        pointClouds.add(pointCloud);
        
        // Perform local analysis (floor detection, etc.)
        // This provides immediate feedback while cloud processing happens
        if (pointClouds.size() % 10 == 0) { // Every 10 frames
            analyzeLocalPointClouds();
        }
    }
    
    /**
     * Send point cloud data to server
     */
    private void sendPointCloudData(PointCloud pointCloud) {
        try {
            JSONObject message = new JSONObject();
            message.put("type", "pointCloudData");
            message.put("scanId", currentScanId);
            message.put("timestamp", System.currentTimeMillis());
            
            // Convert point cloud to JSON array
            JSONArray points = new JSONArray();
            pointCloud.getPoints().rewind();
            
            while (pointCloud.getPoints().hasRemaining()) {
                JSONArray point = new JSONArray();
                point.put(pointCloud.getPoints().get()); // x
                point.put(pointCloud.getPoints().get()); // y
                point.put(pointCloud.getPoints().get()); // z
                point.put(pointCloud.getPoints().get()); // confidence
                points.put(point);
            }
            
            message.put("points", points);
            
            if (webSocket != null) {
                webSocket.send(message.toString());
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error sending point cloud data: " + e.getMessage());
        }
    }
    
    /**
     * Stop scanning
     */
    public void stopScan() {
        isScanning = false;
        
        if (webSocket != null) {
            webSocket.close(1000, "Scan stopped");
            webSocket = null;
        }
        
        if (arSession != null) {
            arSession.close();
            arSession = null;
        }
        
        Log.d(TAG, "Scan stopped");
    }
    
    /**
     * Get device information
     */
    private JSONObject getDeviceInfo() throws JSONException {
        JSONObject deviceInfo = new JSONObject();
        deviceInfo.put("platform", "android");
        deviceInfo.put("model", android.os.Build.MODEL);
        deviceInfo.put("manufacturer", android.os.Build.MANUFACTURER);
        deviceInfo.put("osVersion", android.os.Build.VERSION.RELEASE);
        deviceInfo.put("hasLiDAR", hasLiDARSensor());
        deviceInfo.put("hasARCore", true);
        return deviceInfo;
    }
    
    /**
     * Check if device has LiDAR sensor
     */
    private boolean hasLiDARSensor() {
        // Check for specific devices known to have LiDAR
        String model = android.os.Build.MODEL.toLowerCase();
        return model.contains("ipad pro") || model.contains("iphone 12") || 
               model.contains("iphone 13") || model.contains("galaxy s21") ||
               model.contains("pixel 6") || model.contains("oneplus 9");
    }
    
    /**
     * Handle scan progress updates
     */
    private void handleScanProgress(JSONObject data) throws JSONException {
        ScanProgress progress = new ScanProgress(
            (float) data.getDouble("progress"),
            (float) data.getDouble("currentArea"),
            (float) data.getDouble("confidence"),
            data.getInt("pointCount"),
            data.getLong("scanDuration")
        );
        
        if (scanListener != null) {
            scanListener.onScanProgress(progress);
        }
    }
    
    /**
     * Handle measurement updates
     */
    private void handleMeasurementUpdate(JSONObject data) throws JSONException {
        FloorMeasurements measurements = parseMeasurements(data.getJSONObject("measurements"));
        
        if (scanListener != null) {
            scanListener.onMeasurementUpdate(measurements);
        }
    }
    
    /**
     * Handle scan completion
     */
    private void handleScanCompleted(JSONObject data) throws JSONException {
        ScanResult result = parseScanResult(data);
        
        stopScan();
        
        if (scanListener != null) {
            scanListener.onScanCompleted(result);
        }
    }
    
    /**
     * Handle scan errors
     */
    private void handleScanError(String error) {
        stopScan();
        
        if (scanListener != null) {
            scanListener.onScanError(error);
        }
    }
    
    /**
     * Parse measurements from JSON
     */
    private FloorMeasurements parseMeasurements(JSONObject data) throws JSONException {
        FloorMeasurements measurements = new FloorMeasurements();
        measurements.totalArea = (float) data.getDouble("totalArea");
        measurements.perimeter = (float) data.getDouble("perimeter");
        
        // Parse dimensions
        if (data.has("dimensions")) {
            JSONObject dims = data.getJSONObject("dimensions");
            measurements.dimensions = new FloorMeasurements.RoomDimensions();
            measurements.dimensions.length = (float) dims.getDouble("length");
            measurements.dimensions.width = (float) dims.getDouble("width");
            measurements.dimensions.aspectRatio = (float) dims.getDouble("aspectRatio");
        }
        
        // Parse corners
        measurements.corners = new ArrayList<>();
        if (data.has("corners")) {
            JSONArray corners = data.getJSONArray("corners");
            for (int i = 0; i < corners.length(); i++) {
                JSONObject corner = corners.getJSONObject(i);
                FloorMeasurements.CornerPoint point = new FloorMeasurements.CornerPoint();
                point.x = (float) corner.getDouble("x");
                point.y = (float) corner.getDouble("y");
                point.z = (float) corner.getDouble("z");
                point.angle = (float) corner.getDouble("angle");
                point.type = corner.getString("type");
                measurements.corners.add(point);
            }
        }
        
        return measurements;
    }
    
    /**
     * Parse scan result from JSON
     */
    private ScanResult parseScanResult(JSONObject data) throws JSONException {
        ScanResult result = new ScanResult();
        result.scanId = data.getString("scanId");
        result.timestamp = data.getLong("timestamp");
        result.measurements = parseMeasurements(data.getJSONObject("measurements"));
        
        // Parse quality metrics
        if (data.has("quality")) {
            JSONObject quality = data.getJSONObject("quality");
            result.quality = new ScanResult.ScanQuality();
            result.quality.confidence = (float) quality.getDouble("confidence");
            result.quality.pointDensity = (float) quality.getDouble("pointDensity");
            result.quality.scanCoverage = (float) quality.getDouble("scanCoverage");
            result.quality.accuracy = quality.getString("accuracy");
        }
        
        if (data.has("reportUrl")) {
            result.reportUrl = data.getString("reportUrl");
        }
        
        if (data.has("visualizationUrl")) {
            result.visualizationUrl = data.getString("visualizationUrl");
        }
        
        return result;
    }
    
    /**
     * Analyze local point clouds for immediate feedback
     */
    private void analyzeLocalPointClouds() {
        // Implement local analysis for immediate feedback
        // This provides quick results while waiting for cloud processing
        
        if (pointClouds.isEmpty()) return;
        
        // Calculate approximate area based on current point clouds
        float approximateArea = estimateAreaFromPointClouds();
        
        // Provide immediate feedback
        if (scanListener != null) {
            ScanProgress localProgress = new ScanProgress(
                Math.min(pointClouds.size() * 2.0f, 95.0f), // Estimate completion
                approximateArea,
                0.8f, // Local confidence estimate
                getTotalPointCount(),
                System.currentTimeMillis() - (currentScanId != null ? 0 : System.currentTimeMillis())
            );
            
            scanListener.onScanProgress(localProgress);
        }
    }
    
    /**
     * Estimate area from local point clouds
     */
    private float estimateAreaFromPointClouds() {
        if (pointClouds.isEmpty()) return 0;
        
        // Simple bounding box calculation
        float minX = Float.MAX_VALUE, maxX = Float.MIN_VALUE;
        float minZ = Float.MAX_VALUE, maxZ = Float.MIN_VALUE;
        
        for (PointCloud cloud : pointClouds) {
            cloud.getPoints().rewind();
            while (cloud.getPoints().hasRemaining()) {
                float x = cloud.getPoints().get();
                float y = cloud.getPoints().get(); // Skip y
                float z = cloud.getPoints().get();
                float confidence = cloud.getPoints().get();
                
                if (confidence > 0.5f) { // Only use confident points
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minZ = Math.min(minZ, z);
                    maxZ = Math.max(maxZ, z);
                }
            }
        }
        
        float area = (maxX - minX) * (maxZ - minZ);
        
        // Convert to appropriate units
        if (scanConfig.units.equals("imperial")) {
            area = area * 10.764f; // m² to ft²
        }
        
        return area;
    }
    
    /**
     * Get total point count from all clouds
     */
    private int getTotalPointCount() {
        int total = 0;
        for (PointCloud cloud : pointClouds) {
            total += cloud.getPoints().remaining() / 4; // 4 values per point (x,y,z,confidence)
        }
        return total;
    }
}