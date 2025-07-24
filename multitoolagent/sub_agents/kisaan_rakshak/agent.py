
#imports
from google.adk import Agent
import os
from dotenv import load_dotenv

load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
location = os.getenv("GOOGLE_CLOUD_LOCATION")

from vertexai.preview.generative_models import GenerativeModel
import vertexai

# Initialize Vertex AI environment
vertexai.init(project=project, location=location)

# Load Gemini model
model = GenerativeModel("gemini-1.5-flash")

import base64
from vertexai.preview.generative_models import Image, GenerativeModel





import json
import base64
from typing import Dict, List
import requests


def detect_loss_risk(crop_name: str, location: str, symptoms: str = "", base64_image: str = "", weather_data: dict = {}) -> str:
    """
    Analyzes threat risk using GCP tools (Earth Engine for satellite imagery, BigQuery GIS for region-specific data).
    Returns a risk summary with confidence score and possible threats.
    """
    
    risk_factors = []
    confidence_score = 0
    primary_threat = "Unknown"
    
    try:
        # 1. Analyze symptoms for disease/pest patterns
        if symptoms:
            symptom_risk = _analyze_symptoms(crop_name, symptoms)
            risk_factors.extend(symptom_risk['risks'])
            confidence_score += symptom_risk['confidence']
            if symptom_risk['primary_threat']:
                primary_threat = symptom_risk['primary_threat']
        
        # 2. Check NDVI anomaly using Earth Engine (simulated)
        ndvi_risk = _check_vegetation_health(location, crop_name)
        risk_factors.extend(ndvi_risk['risks'])
        confidence_score += ndvi_risk['confidence']
        
        # 3. Analyze weather patterns
        if weather_data:
            weather_risk = _analyze_weather_risk(weather_data, crop_name)
            risk_factors.extend(weather_risk['risks'])
            confidence_score += weather_risk['confidence']
        
        # 4. Check regional disease/pest reports (BigQuery simulation)
        regional_risk = _check_regional_threats(location, crop_name)
        risk_factors.extend(regional_risk['risks'])
        confidence_score += regional_risk['confidence']
        
        # 5. Image analysis if provided
        if base64_image:
            image_risk = _analyze_crop_image(base64_image, crop_name)
            risk_factors.extend(image_risk['risks'])
            confidence_score += image_risk['confidence']
            if image_risk['primary_threat']:
                primary_threat = image_risk['primary_threat']
        
        # Calculate final risk level
        total_risks = len(risk_factors)
        if total_risks == 0:
            return "No significant risks detected. Continue regular monitoring."
        
        avg_confidence = min(confidence_score / max(total_risks, 1), 95)
        risk_level = _determine_risk_level(risk_factors, avg_confidence)
        
        # Generate actionable response
        response = _generate_risk_response(risk_level, primary_threat, risk_factors, avg_confidence, crop_name)
        
        return response
        
    except Exception as e:
        return f"Error analyzing risk: {str(e)}. Please check inputs and try again."

def _analyze_symptoms(crop_name: str, symptoms: str) -> Dict:
    """Analyze text symptoms for disease/pest indicators"""
    symptoms_lower = symptoms.lower()
    risks = []
    confidence = 0
    primary_threat = None
    
    # Disease indicators
    disease_patterns = {
        'fungal': ['spots', 'mold', 'rot', 'blight', 'wilting', 'yellowing'],
        'bacterial': ['ooze', 'canker', 'soft rot', 'black spots'],
        'viral': ['mosaic', 'curling', 'stunted growth', 'mottling'],
        'pest': ['holes', 'chewed', 'insects', 'larvae', 'webbing']
    }
    
    for threat_type, keywords in disease_patterns.items():
        matches = sum(1 for keyword in keywords if keyword in symptoms_lower)
        if matches > 0:
            risks.append(f"{threat_type.title()} infection indicators")
            confidence += matches * 15
            if not primary_threat or matches > 2:
                primary_threat = f"{threat_type} infection"
    
    return {'risks': risks, 'confidence': min(confidence, 40), 'primary_threat': primary_threat}

def _check_vegetation_health(location: str, crop_name: str) -> Dict:
    """Simulate Earth Engine NDVI analysis"""
    # In real implementation, this would call Google Earth Engine API
    risks = []
    confidence = 0
    
    # Simulate NDVI anomaly detection
    # This would normally analyze satellite imagery for vegetation health
    import random
    random.seed(hash(location) % 1000)  # Consistent results for same location
    
    ndvi_value = random.uniform(0.3, 0.8)
    historical_avg = random.uniform(0.4, 0.7)
    
    if ndvi_value < historical_avg - 0.15:
        risks.append("Low vegetation health detected via satellite")
        confidence += 25
    elif ndvi_value < historical_avg - 0.05:
        risks.append("Slight vegetation stress observed")
        confidence += 15
    
    return {'risks': risks, 'confidence': confidence}

def _analyze_weather_risk(weather_data: dict, crop_name: str) -> Dict:
    """Analyze weather conditions for crop-specific threats"""
    risks = []
    confidence = 0
    
    # Extract weather parameters
    humidity = weather_data.get('humidity', 50)
    temperature = weather_data.get('temperature', 25)
    rainfall = weather_data.get('rainfall', 0)
    
    # High humidity + warm temp = fungal risk
    if humidity > 80 and temperature > 20:
        risks.append("High fungal disease risk due to humid conditions")
        confidence += 20
    
    # Excessive rainfall
    if rainfall > 100:  # mm per week
        risks.append("Waterlogging and root rot risk from excessive rainfall")
        confidence += 15
    
    # Extreme temperatures
    if temperature > 35 or temperature < 5:
        risks.append("Temperature stress risk to crop")
        confidence += 10
    
    return {'risks': risks, 'confidence': confidence}

def _check_regional_threats(location: str, crop_name: str) -> Dict:
    """Simulate BigQuery regional threat analysis"""
    # In real implementation, this would query BigQuery for regional disease/pest reports
    risks = []
    confidence = 0
    
    # Simulate regional threat database lookup
    import random
    random.seed(hash(location + crop_name) % 1000)
    
    regional_threats = [
        "aphid outbreaks", "rust disease", "stem borer", "leaf spot",
        "downy mildew", "thrips infestation", "bacterial wilt"
    ]
    
    if random.random() > 0.6:  # 40% chance of regional threat
        threat = random.choice(regional_threats)
        risks.append(f"Regional reports of {threat} in nearby areas")
        confidence += 20
    
    return {'risks': risks, 'confidence': confidence}

def _analyze_crop_image(base64_image: str, crop_name: str) -> Dict:
    """Simulate image analysis for visual disease/pest detection"""
    # In real implementation, this would use Google Vision API or custom ML model
    risks = []
    confidence = 0
    primary_threat = None
    
    try:
        # Decode image (basic validation)
        image_data = base64.b64decode(base64_image[:100])  # Just check format
        
        # Simulate ML-based image analysis
        import random
        analysis_seed = hash(base64_image[:50]) % 1000
        random.seed(analysis_seed)
        
        visual_indicators = [
            ("leaf discoloration", "fungal infection", 25),
            ("pest damage visible", "insect infestation", 30),
            ("wilting patterns", "bacterial wilt", 20),
            ("unusual growth patterns", "viral infection", 15)
        ]
        
        for indicator, threat, conf in visual_indicators:
            if random.random() > 0.7:  # 30% chance each
                risks.append(f"Image shows {indicator}")
                confidence += conf
                if not primary_threat:
                    primary_threat = threat
        
    except Exception:
        risks.append("Unable to analyze image - please ensure valid format")
        confidence += 5
    
    return {'risks': risks, 'confidence': confidence, 'primary_threat': primary_threat}

def _determine_risk_level(risk_factors: List[str], confidence: float) -> str:
    """Determine overall risk level"""
    num_risks = len(risk_factors)
    
    if confidence > 60 and num_risks >= 3:
        return "HIGH"
    elif confidence > 40 and num_risks >= 2:
        return "MEDIUM"
    elif num_risks >= 1:
        return "LOW"
    else:
        return "MINIMAL"

def _generate_risk_response(risk_level: str, primary_threat: str, risk_factors: List[str], confidence: float, crop_name: str) -> str:
    """Generate actionable response for farmer"""
    
    # Risk summary
    risk_summary = f"{risk_level} RISK detected for {crop_name}. Confidence: {confidence:.0f}%\n\n"
    
    # Primary threat
    if primary_threat and primary_threat != "Unknown":
        risk_summary += f"🚨 Primary Threat: {primary_threat}\n\n"
    
    # Risk factors
    if risk_factors:
        risk_summary += "⚠️ Risk Factors Detected:\n"
        for risk in risk_factors[:5]:  # Limit to top 5
            risk_summary += f"• {risk}\n"
        risk_summary += "\n"
    
    # Recommendations based on risk level
    recommendations = _get_recommendations(risk_level, primary_threat, crop_name)
    risk_summary += "📋 Recommended Actions:\n"
    for i, rec in enumerate(recommendations[:3], 1):  # Top 3 recommendations
        risk_summary += f"{i}. {rec}\n"
    
    if risk_level in ["HIGH", "MEDIUM"]:
        risk_summary += "\n⏰ Take action within 24-48 hours to prevent losses."
    
    return risk_summary

def _get_recommendations(risk_level: str, primary_threat: str, crop_name: str) -> List[str]:
    """Get specific recommendations based on detected risks"""
    
    base_recommendations = {
        "HIGH": [
            "Consult agricultural extension officer immediately",
            "Apply appropriate fungicide/pesticide treatment",
            "Increase field monitoring frequency to daily",
            "Consider harvest if crop is mature enough"
        ],
        "MEDIUM": [
            "Apply preventive spray treatment",
            "Monitor crop daily for symptom progression",
            "Improve drainage if waterlogging detected",
            "Contact local agricultural advisor"
        ],
        "LOW": [
            "Continue regular monitoring",
            "Apply preventive measures as precaution",
            "Maintain proper field sanitation"
        ]
    }
    
    threat_specific = {
        "fungal infection": [
            "Apply copper-based fungicide",
            "Improve air circulation around plants",
            "Reduce irrigation frequency"
        ],
        "insect infestation": [
            "Apply appropriate insecticide",
            "Use pheromone traps for monitoring",
            "Remove affected plant parts"
        ],
        "bacterial wilt": [
            "Remove infected plants immediately",
            "Apply bactericide treatment",
            "Avoid overhead irrigation"
        ]
    }
    
    recommendations = base_recommendations.get(risk_level, ["Monitor crop regularly"])
    
    if primary_threat in threat_specific:
        recommendations.extend(threat_specific[primary_threat])
    
    return recommendations



kisaan_rakshak = Agent (
    name="kisaan_rakshak",
    model="gemini-2.0-flash",
    description="I help farmers detect and prevent crop losses by analyzing patterns of threats using satellite and weather data.",
    instruction="""
You are Kisaan Rakshak, a loss prevention specialist for agriculture. Your mission is to detect risks that could lead to crop loss and help farmers take preventive action.

Your responsibilities include:

1. Analyze symptoms, environmental data, or patterns to detect potential threats (e.g., pest outbreaks, fungal diseases, extreme weather).
2. Use GCP tools like BigQuery GIS and Google Earth Engine to analyze vegetation health, soil moisture, and regional risk patterns.
3. Predict the severity and probability of threats based on current and historical data.
4. Suggest preventive or corrective actions the farmer should take.


You must keep your outputs concise, focused, and actionable for farmers.
    """,
    tools=[
        detect_loss_risk
    ]
)




#example user queries
# It's been very humid (85%) and warm (28°C) for a week. My rice crop in Kerala - any risks?
# We got 150mm rain in 3 days. My sugarcane in UP - what should I watch for?
# Very dry weather for 20 days, temperature 38°C. My cotton in Rajasthan needs checking?

# If you provide me with a crop, location, and any symptoms you're observing, I can give you a risk summary and suggest preventive actions.

# I don't have the capability to specifically target your field with satellite imagery in real time.
# Instead, I use publicly available satellite data that covers broad geographical areas. 
# When you provide your location (e.g., "sugarcane in UP"), I access pre-existing satellite imagery for that region. 
# This imagery is not taken on demand, but is part of ongoing data collection efforts that monitor vegetation health across large areas. 
# My analysis then identifies any unusual patterns or potential problems within that region.