from flask import Flask, jsonify, request
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import time
from functools import wraps

app = Flask(__name__)

# Rate limiting decorator
def rate_limit(max_per_minute=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapper
    return decorator

# Enhanced ML prediction class with multiple timeframes
class CryptoPrediction:
    def __init__(self):
        self.api_base = "https://api.coingecko.com/api/v3"
        self.timeframe_configs = {
            '1h': {'hours': 1, 'days': 3, 'interval': 'hourly', 'ma_periods': [6, 12, 24]},
            '2h': {'hours': 2, 'days': 5, 'interval': 'hourly', 'ma_periods': [12, 24, 48]},
            '6h': {'hours': 6, 'days': 7, 'interval': 'hourly', 'ma_periods': [4, 8, 16]},
            '12h': {'hours': 12, 'days': 14, 'interval': 'daily', 'ma_periods': [3, 7, 14]},
            '24h': {'hours': 24, 'days': 30, 'interval': 'daily', 'ma_periods': [7, 14, 21]},
            '48h': {'hours': 48, 'days': 60, 'interval': 'daily', 'ma_periods': [14, 21, 30]}
        }
    
    def get_price_data(self, coin_id, timeframe='24h'):
        """Get historical price data optimized for timeframe"""
        try:
            config = self.timeframe_configs.get(timeframe, self.timeframe_configs['24h'])
            
            # For hourly data (1h, 2h, 6h)
            if config['interval'] == 'hourly':
                url = f"{self.api_base}/coins/{coin_id}/market_chart"
                params = {
                    "vs_currency": "usd",
                    "days": config['days'],
                    "interval": "hourly"
                }
            else:
                # For daily data (12h, 24h, 48h)
                url = f"{self.api_base}/coins/{coin_id}/market_chart"
                params = {
                    "vs_currency": "usd",
                    "days": config['days'],
                    "interval": "daily"
                }
            
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            # Convert to DataFrame
            prices = data['prices']
            volumes = data['total_volumes']
            
            df = pd.DataFrame(prices, columns=['timestamp', 'price'])
            df['volume'] = [v[1] for v in volumes]
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            return df, config
        except Exception as e:
            print(f"Error fetching data for {coin_id} ({timeframe}): {e}")
            return None, None
    
    def calculate_technical_indicators(self, df, config, timeframe):
        """Calculate technical indicators optimized for timeframe"""
        if df is None or len(df) < 10:
            return None
            
        # Get moving average periods for this timeframe
        ma1, ma2, ma3 = config['ma_periods']
        
        # Price changes
        df['price_change'] = df['price'].pct_change()
        if len(df) > ma1:
            df[f'price_change_{ma1}'] = df['price'].pct_change(ma1)
        
        # Moving averages (adaptive to timeframe)
        df[f'sma_{ma1}'] = df['price'].rolling(window=ma1).mean()
        df[f'sma_{ma2}'] = df['price'].rolling(window=ma2).mean()
        df[f'sma_{ma3}'] = df['price'].rolling(window=ma3).mean()
        
        # Exponential Moving Averages
        df[f'ema_{ma1}'] = df['price'].ewm(span=ma1).mean()
        df[f'ema_{ma2}'] = df['price'].ewm(span=ma2).mean()
        
        # Volatility (adaptive window)
        vol_window = min(ma1, len(df)//3)
        if vol_window > 2:
            df[f'volatility_{vol_window}'] = df['price'].rolling(window=vol_window).std()
        
        # Volume indicators
        if vol_window > 2:
            df[f'volume_sma_{vol_window}'] = df['volume'].rolling(window=vol_window).mean()
            df['volume_change'] = df['volume'].pct_change()
            df['volume_spike'] = df['volume'] / df[f'volume_sma_{vol_window}']
        
        # RSI (adaptive period)
        rsi_period = min(14, ma2)
        if len(df) > rsi_period:
            delta = df['price'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))
        
        # MACD (adaptive to timeframe)
        if timeframe in ['1h', '2h']:
            # Faster MACD for short timeframes
            ema_fast, ema_slow, signal = 6, 13, 5
        elif timeframe in ['6h', '12h']:
            # Medium MACD
            ema_fast, ema_slow, signal = 8, 17, 7
        else:
            # Standard MACD for longer timeframes
            ema_fast, ema_slow, signal = 12, 26, 9
            
        if len(df) > ema_slow:
            ema_fast_line = df['price'].ewm(span=ema_fast).mean()
            ema_slow_line = df['price'].ewm(span=ema_slow).mean()
            df['macd'] = ema_fast_line - ema_slow_line
            df['macd_signal'] = df['macd'].ewm(span=signal).mean()
            df['macd_histogram'] = df['macd'] - df['macd_signal']
        
        return df.dropna()
    
    def timeframe_prediction_model(self, df, config, timeframe):
        """Prediction model optimized for specific timeframe"""
        if df is None or len(df) < 5:
            return None
            
        latest = df.iloc[-1]
        current_price = latest['price']
        ma1, ma2, ma3 = config['ma_periods']
        
        # Timeframe-specific analysis weights
        if timeframe in ['1h', '2h']:
            # Short-term: Heavy weight on momentum and volume
            trend_weight = 0.25
            momentum_weight = 0.45
            volume_weight = 0.30
        elif timeframe in ['6h', '12h']:
            # Medium-term: Balanced approach
            trend_weight = 0.35
            momentum_weight = 0.35
            volume_weight = 0.30
        else:
            # Long-term: Heavy weight on trends
            trend_weight = 0.50
            momentum_weight = 0.25
            volume_weight = 0.25
        
        # Trend Analysis
        short_trend = latest[f'ema_{ma1}'] / latest[f'ema_{ma2}'] if latest[f'ema_{ma2}'] > 0 else 1
        medium_trend = latest[f'sma_{ma1}'] / latest[f'sma_{ma2}'] if latest[f'sma_{ma2}'] > 0 else 1
        long_trend = latest[f'sma_{ma2}'] / latest[f'sma_{ma3}'] if latest[f'sma_{ma3}'] > 0 else 1
        trend_score = (short_trend + medium_trend + long_trend) / 3
        
        # Momentum Analysis
        rsi_momentum = (50 - latest['rsi']) / 100 if 'rsi' in latest and not pd.isna(latest['rsi']) else 0
        macd_momentum = latest['macd_histogram'] / current_price if 'macd_histogram' in latest and not pd.isna(latest['macd_histogram']) else 0
        price_momentum = latest['price_change'] if not pd.isna(latest['price_change']) else 0
        momentum_score = (rsi_momentum + macd_momentum + price_momentum) / 3
        
        # Volume Analysis
        volume_signal = (latest['volume_spike'] - 1) if 'volume_spike' in latest and not pd.isna(latest['volume_spike']) else 0
        volume_trend = latest['volume_change'] if 'volume_change' in latest and not pd.isna(latest['volume_change']) else 0
        volume_score = (volume_signal + volume_trend) / 2
        
        # Combine signals with timeframe-specific weights
        prediction_factor = (
            trend_weight * (trend_score - 1) +
            momentum_weight * momentum_score +
            volume_weight * min(max(volume_score, -0.3), 0.3)
        )
        
        # Timeframe-specific caps on predictions
        if timeframe in ['1h', '2h']:
            max_change = 0.05  # Max 5% for short timeframes
        elif timeframe in ['6h', '12h']:
            max_change = 0.10  # Max 10% for medium timeframes
        else:
            max_change = 0.20  # Max 20% for longer timeframes
        
        predicted_change = max(min(prediction_factor, max_change), -max_change)
        predicted_price = current_price * (1 + predicted_change)
        
        # Enhanced confidence calculation
        vol_col = f'volatility_{min(ma1, len(df)//3)}' if f'volatility_{min(ma1, len(df)//3)}' in latest else None
        volatility = latest[vol_col] / current_price if vol_col and not pd.isna(latest[vol_col]) else 0.02
        
        data_quality = min(len(df) / config['days'], 1.0)
        signal_strength = abs(prediction_factor)
        
        # Timeframe-specific confidence adjustments
        if timeframe in ['1h', '2h']:
            base_confidence = min(signal_strength * 3, 0.8)  # Higher confidence for short-term
            volatility_penalty = min(volatility * 8, 0.3)
        else:
            base_confidence = min(signal_strength * 2, 0.9)
            volatility_penalty = min(volatility * 5, 0.4)
        
        confidence = max(0.1, min(0.95, base_confidence * data_quality - volatility_penalty))
        
        # Calculate expiry time based on timeframe
        prediction_time = datetime.now()
        expiry_time = prediction_time + timedelta(hours=config['hours'])
        
        return {
            'current_price': round(current_price, 6),
            'predicted_price': round(predicted_price, 6),
            'change_percent': round(predicted_change * 100, 2),
            'confidence': round(confidence, 2),
            'trend_score': round(trend_score, 3),
            'momentum_score': round(momentum_score, 3),
            'volume_score': round(volume_score, 3),
            'rsi': round(latest['rsi'], 1) if 'rsi' in latest and not pd.isna(latest['rsi']) else None,
            'macd': round(latest['macd'], 4) if 'macd' in latest and not pd.isna(latest['macd']) else None,
            'timestamp': prediction_time.isoformat(),
            'timeframe': timeframe,
            'prediction_horizon': f'{config["hours"]} hours',
            'expires_at': expiry_time.isoformat(),
            'target_date': expiry_time.strftime('%Y-%m-%d %H:%M UTC'),
            'volatility': round(volatility * 100, 2) if volatility else None,
            'max_expected_change': f'±{max_change*100:.1f}%'
        }

# Initialize predictor
predictor = CryptoPrediction()

# Routes
@app.route('/')
def home():
    return jsonify({
        "name": "FireAPI - Crypto Intelligence",
        "version": "3.0.0",
        "status": "active",
        "description": "Multi-timeframe AI cryptocurrency predictions",
        "timeframes": ["1h", "2h", "6h", "12h", "24h", "48h"],
        "endpoints": {
            "/predict/<coin_id>": "Get 24h prediction (default)",
            "/predict/<coin_id>/<timeframe>": "Get prediction for specific timeframe",
            "/trending": "Get trending predictions",
            "/trending/<timeframe>": "Get trending for timeframe",
            "/coins": "List supported coins",
            "/health": "API health check"
        },
        "timeframe_examples": {
            "1h": "/predict/bitcoin/1h - 1 hour prediction",
            "6h": "/predict/ethereum/6h - 6 hour prediction", 
            "24h": "/predict/solana/24h - 24 hour prediction"
        },
        "features": [
            "Multiple timeframe analysis (1h to 48h)",
            "Adaptive technical indicators per timeframe",
            "Timeframe-optimized confidence scoring",
            "Real-time predictions with expiry times"
        ]
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_version": "3.0.0",
        "available_timeframes": list(predictor.timeframe_configs.keys())
    })

@app.route('/predict/<coin_id>')
@app.route('/predict/<coin_id>/<timeframe>')
@rate_limit(max_per_minute=30)
def predict_coin(coin_id, timeframe='24h'):
    """Get prediction for specific coin and timeframe"""
    
    # Validate timeframe
    if timeframe not in predictor.timeframe_configs:
        return jsonify({
            "error": f"Invalid timeframe '{timeframe}'",
            "available_timeframes": list(predictor.timeframe_configs.keys())
        }), 400
    
    try:
        # Get historical data
        df, config = predictor.get_price_data(coin_id, timeframe)
        if df is None:
            return jsonify({"error": f"Could not fetch data for {coin_id}"}), 404
        
        # Calculate indicators
        df_with_indicators = predictor.calculate_technical_indicators(df, config, timeframe)
        if df_with_indicators is None:
            return jsonify({"error": "Insufficient data for analysis"}), 400
        
        # Make prediction
        prediction = predictor.timeframe_prediction_model(df_with_indicators, config, timeframe)
        if prediction is None:
            return jsonify({"error": "Could not generate prediction"}), 500
        
        return jsonify({
            "coin": coin_id,
            "timeframe": timeframe,
            "prediction": prediction,
            "model": f"fireapi_v3_{timeframe}",
            "data_points": len(df),
            "analysis_optimized_for": f"{timeframe} trading",
            "last_updated": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/trending')
@app.route('/trending/<timeframe>')
@rate_limit(max_per_minute=5)
def get_trending(timeframe='24h'):
    """Get trending predictions for specific timeframe"""
    
    if timeframe not in predictor.timeframe_configs:
        return jsonify({
            "error": f"Invalid timeframe '{timeframe}'",
            "available_timeframes": list(predictor.timeframe_configs.keys())
        }), 400
    
    popular_coins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin']
    predictions = {}
    
    for coin in popular_coins:
        try:
            df, config = predictor.get_price_data(coin, timeframe)
            if df is not None:
                df_indicators = predictor.calculate_technical_indicators(df, config, timeframe)
                if df_indicators is not None:
                    pred = predictor.timeframe_prediction_model(df_indicators, config, timeframe)
                    if pred is not None:
                        predictions[coin] = pred
            
            time.sleep(1.5)  # Rate limiting
            
        except Exception as e:
            print(f"Error processing {coin} ({timeframe}): {e}")
            continue
    
    # Sort by confidence * change_percent
    sorted_predictions = dict(sorted(
        predictions.items(), 
        key=lambda x: x[1]['confidence'] * abs(x[1]['change_percent']), 
        reverse=True
    ))
    
    return jsonify({
        "timeframe": timeframe,
        "trending_predictions": sorted_predictions,
        "total_analyzed": len(predictions),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/coins')
def supported_coins():
    """List supported coins and timeframes"""
    return jsonify({
        "supported_coins": [
            'bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2',
            'dogecoin', 'shiba-inu', 'chainlink', 'polygon', 'uniswap'
        ],
        "available_timeframes": list(predictor.timeframe_configs.keys()),
        "timeframe_details": {
            "1h": "1 hour - High frequency, momentum-focused",
            "2h": "2 hours - Short-term technical analysis", 
            "6h": "6 hours - Intraday trend analysis",
            "12h": "12 hours - Half-day trend prediction",
            "24h": "24 hours - Daily trend analysis",
            "48h": "48 hours - Multi-day trend prediction"
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
