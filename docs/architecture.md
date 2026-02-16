# System Architecture

## High-Level System Diagram
```
[Jupyter Notebook] → [Save ML Artifacts (.pkl)] → [FastAPI Backend] ↔ [React Frontend]
```

## Data Flow Explanation

### Training Phase
1. **Dataset Generation:** A dataset outlining simulated student interactions, scores, and behaviors is generated or ingested within the Notebook environment.
2. **Feature Engineering:** Features are evaluated, standardized, and engineered (e.g., the creation of base arrays representing the weighted academic baseline matrix).
3. **Model Training:** A Logistic Regression model is utilized to learn risk boundaries from the standardized dataset inputs.
4. **Evaluation:** The model is evaluated utilizing confusion matrices and standard accuracy metrics to ensure readiness.
5. **Artifact Saving:** The environment's specific states are serialized utilizing `joblib`. The scaler, model, and the training sample distributions are written durably to disk.

### Inference Phase
1. **User Input:** A user inputs prospective or current student metrics via the React UI.
2. **Validation:** Pydantic models in FastAPI aggressively validate input variables constraints (e.g., ensuring test scores strictly remain 0-100).
3. **Scaling:** The incoming feature array is transformed precisely using the historically saved `scaler.pkl`.
4. **Prediction:** The standardized array is passed to `model.pkl` to fetch logarithmic probability matrices, taking the `max()` to assign the class and system confidence.
5. **Percentile Computation:** The incoming weighted score translates its location against the raw empirical cumulative distribution function retained within `weighted_scores.pkl`.
6. **Response Generation:** The final JSON dictating insights, classifications, and system thresholds is pushed to the client.

## Why Separation of Training & Inference Matters
- **Performance:** Model training is inherently blocking and CPU/GPU-intensive. By segregating it to a separate, offline step, the inference environment remains lightweight, rapid, and uninhibited by random memory spikes.
- **Determinism:** Artifact serialization guarantees that the inference behavior operates on explicitly validated parameters exactly as they existed on the snapshot date, eliminating undocumented environment mutations.
- **Memory Efficiency:** A Notebook consumes considerable RAM to hold raw subsets. FastAPI loads solely the optimized, compiled `.pkl` files natively to RAM, significantly lowering server costs.
- **Scalability:** The inference server can be horizontally scaled infinitely behind a load balancer without recalculating training coefficients.

## Why FastAPI is Superior to Node + Spawn
Historically, projects sometimes attempt to execute ML models by `child_process.spawn("python")` from a Javascript backend like Express/Node.js. This approach is intrinsically flawed:
1. Every inference spawns an entirely independent operating system process.
2. It requires reloading gigabytes of ML libraries (`scikit-learn`, `pandas`) into RAM repeatedly on *every* request, causing catastrophic lag globally (5000ms+ per request).
3. FastAPI lives natively entirely inside Python. Artifacts (`.pkl`s) are loaded **ONCE** into memory on application startup, enabling inference latency measuring ~5ms without breaking the bounds of the interpreter.

## Artifact Explanation
The `ml-service` directory outputs three serialized components essential for inference:
1. `model.pkl`: The serialized binary comprising the completely trained Logistic Regression model and its intercept/coef states.
2. `scaler.pkl`: The exact states (mean and standard deviation) used to normalize the original dataset. Future inputs MUST use this file to maintain correct numerical proportions for the model calculation.
3. `weighted_scores.pkl`: An extracted Numpy array comprising the weighted scores of all original students trained on. Required exclusively for evaluating accurate percentile rankings in dynamic time.
