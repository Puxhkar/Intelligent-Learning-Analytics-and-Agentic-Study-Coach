# Learning Analytics Risk Prediction System

## Project Overview
The Learning Analytics Risk Prediction System is designed to identify students who are at risk of poor academic performance based on their study habits, test scores, and communication skills. 

By analyzing specific inputs such as quiz scores, time spent studying, reading/writing capabilities, and communication levels, the system outputs an overall risk level (e.g., At-risk, Average, High-performing), accompanied by a confidence score, percentile ranking, and targeted rule-based recommendations. This empowers educators and institutions to proactively intervene and support students in need.

## Architecture Overview
The system relies on a strictly separated training and inference pipeline:
1. **Model Training**: Executed offline using a Jupyter Notebook. This isolates the heavy data processing and model generation from runtime servers.
2. **Inference Backend**: Powered by FastAPI, an extremely fast and lightweight Python framework that loads the trained artifacts and serves predictions.
3. **Frontend Dashboard**: A modern React (Vite) interface that allows users to easily input student metrics and visualize the resulting risk assessment in real-time.

## Core Features
- **Risk Level Prediction**: Categorizes students directly into actionable groups.
- **Confidence Score**: Displays the algorithmic probability of the predicted risk level.
- **Percentile Standing**: Shows how the student compares against the training dataset distribution.
- **Weighted Academic Score**: Calculates a transparent benchmark based on weighted academic inputs.
- **Feature-Level Insights**: Highlights specific areas of concern or excellence (e.g., low communication skills, strong math foundation).
- **Rule-Based Recommendation**: Provides direct, human-readable advice for the student.
- **Swagger API Documentation**: Built-in, interactive API testing out-of-the-box.

## Technology Stack
- **Python** (Core ML and Backend language)
- **FastAPI** (High-performance web framework for APIs)
- **Uvicorn** (ASGI web server implementation for Python)
- **scikit-learn** (Machine learning library for training and inference)
- **joblib** (Efficient artifact serialization and deserialization)
- **Pydantic** (Robust data validation and settings management)
- **React** (Frontend user interface ecosystem)

## Project Structure
```
AI_ML_Project/
├── backend/                  # Inference Server
│   ├── main.py               # FastAPI application
│   └── requirements.txt      # Python dependencies
├── docs/                     # Project Documentation
│   ├── architecture.md       # High-level architecture explanation
│   └── limitations.md        # Academic and systemic limitations
├── frontend/                 # React UI
│   ├── package.json          # Node dependencies
│   ├── src/                  # React components and styling
│   └── vite.config.js        # Vite bundler configuration
├── ml-service/               # Model Training and Artifacts
│   ├── train_model.ipynb     # Jupyter Notebook for ML training
│   ├── model.pkl             # Serialized Logistic Regression model
│   ├── scaler.pkl            # Serialized standard scaler
│   └── weighted_scores.pkl   # Serialized base scores for percentile logic
├── RUNNING_GUIDE.md          # Step-by-step startup instructions
└── README.md                 # Project Overview (This file)
```

## Model Description
The core predictive capability is driven by a **Logistic Regression** model. The model learns a non-linear combination of input features scaled standardly to predict the ultimate class. 
The system defines a proprietary **Weighted Score Formula** inline during inference:
`(0.4 * Test Scores) + (0.3 * Quiz Scores) + (0.2 * Math Score) + (0.05 * Reading) + (0.05 * Writing)`

The resulting continuous risk representation is categorized strictly, with final predictions determined by the algorithmic probabilistic output of the Logistic Regression model, mapping to `At-risk`, `Average`, or `High-performing`.

## API Endpoint Documentation
### POST `/predict-risk`
Calculates and returns the risk level for a given student profile.

**Request Schema:**
```json
{
  "quiz_scores": 80.0,
  "test_scores": 85.0,
  "maths_score": 75.0,
  "reading": 90.0,
  "writing": 80.0,
  "time_spent": 5.0,
  "communication": 85.0
}
```

**Response Example:**
```json
{
  "risk_level": "High-performing",
  "confidence": 81.72,
  "weighted_score": 81.5,
  "percentile": 99,
  "risk_description": "You demonstrate strong academic readiness.",
  "recommendation": "Advance to higher-level practice and competitive preparation.",
  "feature_insights": [
    "High academic engagement through consistent study hours.",
    "Strong literacy and reading comprehension skills."
  ]
}
```

## How Percentile Is Computed
During training, every student's weighted academic score is calculated and securely stored in `weighted_scores.pkl`. When an inference request is received, the live input generates a new weighted score. The percentile is simply the percentage of the pre-calculated training population that scored *lower* than the new live input, offering immediate academic context.

## Future Improvements
- Integration of advanced explainability tools, such as SHAP or LIME, to provide weight breakdowns per feature on the frontend.
- Connecting a persistent database to track individual student progression over time.
- Adding temporal models (e.g., LSTMs) to measure academic trajectories rather than distinct snapshots.
