from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Learning Analytics Risk Predictor")

origins = [
    "http://localhost:3000",
    "https://intelligent-learning-analytics-and.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML Artifacts ONCE at startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Note: assuming ml-service is adjacent to backend
ML_DIR = os.path.join(os.path.dirname(BASE_DIR), "ml-service")

try:
    model = joblib.load(os.path.join(ML_DIR, 'model.pkl'))
    scaler = joblib.load(os.path.join(ML_DIR, 'scaler.pkl'))
    train_weighted_scores = joblib.load(os.path.join(ML_DIR, 'weighted_scores.pkl'))
except FileNotFoundError as e:
    print(f"Warning: ML Artifacts not found. Please run Jupyter Notebook first. {e}")
    model, scaler, train_weighted_scores = None, None, None

# Input Validation Schema
class StudentInput(BaseModel):
    quiz_scores: float = Field(..., ge=0, le=100)
    test_scores: float = Field(..., ge=0, le=100)
    maths_score: float = Field(..., ge=0, le=100)
    reading: float = Field(..., ge=0, le=100)
    writing: float = Field(..., ge=0, le=100)
    time_spent: float = Field(..., ge=0, le=24)
    communication: float = Field(..., ge=0, le=100)

@app.post("/predict-risk")
async def predict_risk(student: StudentInput):
    if not model or not scaler or train_weighted_scores is None:
        raise HTTPException(status_code=500, detail="ML Model artifacts not loaded. Train the model first.")

    # 1. Feature Engineering (Compute weighted score inline)
    weighted_score = (
        0.4 * student.test_scores + 
        0.3 * student.quiz_scores + 
        0.2 * student.maths_score + 
        0.05 * student.reading + 
        0.05 * student.writing
    )

    # 2. Extract features into array matching training order
    feature_vals = np.array([[
        student.quiz_scores, student.test_scores, student.maths_score,
        student.reading, student.writing, student.time_spent,
        student.communication
    ]])

    # 3. Predict & Probability
    try:
        scaled_features = scaler.transform(feature_vals)
        predicted_class = model.predict(scaled_features)[0]
        probabilities = model.predict_proba(scaled_features)[0]
        confidence = float(np.max(probabilities))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {e}")

    # 4. Percentile Logic
    percentile = int((np.sum(train_weighted_scores < weighted_score) / len(train_weighted_scores)) * 100)

    # 5. Rule-Based Insights & Recommendations
    insights = []
    
    if student.test_scores > 85:
        insights.append("Strong test performance demonstrate solid subject mastery.")
    elif student.test_scores < 45:
        insights.append("Weak test results suggest foundational knowledge gaps.")
        
    if student.maths_score < 50:
        insights.append("Mathematical foundation requires additional support and practice.")
        
    if student.time_spent < 2:
        insights.append("Low daily study time is impacting academic outcomes.")
    elif student.time_spent > 6:
        insights.append("High academic engagement through consistent study hours.")
        
    if student.reading > 80 and student.writing > 80:
        insights.append("Strong literacy and reading comprehension skills.")
    elif student.communication < 40:
        insights.append("Limited communication skills may hinder peer learning.")

    # Truncate to strictly 3 max
    insights = insights[:3]

    if predicted_class == 'At-risk':
        risk_description = "Your academic performance indicates potential risk and requires attention."
        recommendation = "Increase structured study hours and focus on weak subjects."
    elif predicted_class == 'Average':
        risk_description = "Your performance is stable with room for improvement."
        recommendation = "Maintain consistency and improve test performance."
    else:
        risk_description = "You demonstrate strong academic readiness."
        recommendation = "Advance to higher-level practice and competitive preparation."

    # Return Pure JSON via FastAPI defaults
    return {
        "risk_level": predicted_class,
        "confidence": round(confidence * 100, 2),
        "weighted_score": round(weighted_score, 2),
        "percentile": percentile,
        "risk_description": risk_description,
        "recommendation": recommendation,
        "feature_insights": insights
    }