# System Limitations

While the Learning Analytics Risk Predictor serves as a powerful demonstration of applied machine learning, any analytical instrument intrinsically possesses boundaries. The following highlight the academic and systemic limitations of the current iteration.

## 1. Synthetic Dataset Limitation
The models underlying this analytics system were trained utilizing synthetically generated dataset mechanisms rather than organically sourced historical academic registries. As such, nuanced demographic markers, socioeconomic influences, and anomalous outliers prevalent in actual university datasets may not be entirely represented. Conclusions reflect the bias of the synthesis generator.

## 2. Linear Model Assumption
The current classifier utilizes Logistic Regression. While exceptionally transparent and fast, this enforces an inherent assumption that relationships separating categories are largely linear. Extremely complex, multidimensional, non-linear interactions across obscure study habits and eventual outcomes might face systematic underfitting compared to more profound non-linear classifiers.

## 3. Lack of Real-World Institutional Data
System insights generated represent an artificial heuristic mapping. Because it is disconnected from a secure Student Information System (SIS) or Learning Management System (LMS), the model's internal representations of "risk" lack alignment to specific institutional policies or administrative definitions.

## 4. No Temporal Academic Tracking
The engine analyzes student metrics algorithmically as discrete snapshots. A student scoring a 45 on a test implies immediate classification logic. The system currently does not track velocity (e.g., assessing if the student scored 15 on the previous test and is actually rapidly improving).

## 5. No Advanced Explainability
While the system provides rule-based heuristic "insights", the mathematical classification confidence (e.g., "82% Confidence") lacks comprehensive explainable AI structures (such as SHAP values or LIME implementations). The system does not computationally surface exactly *which* parameter contributed identically to the probabilistic derivation, slightly obfuscating the mathematical root cause for non-technical educators.

