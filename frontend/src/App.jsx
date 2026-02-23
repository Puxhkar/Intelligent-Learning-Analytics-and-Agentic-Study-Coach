import React, { useState } from 'react';
import StudentInputForm from './components/StudentInputForm';
import RiskDashboard from './components/RiskDashboard';
import './App.css';

function App() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePredict = async (studentData) => {
        setLoading(true);
        setError('');
        setResults(null);

        try {
            let apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            if (apiUrl.endsWith('/')) {
                apiUrl = apiUrl.slice(0, -1);
            }
            const response = await fetch(`${apiUrl}/predict-risk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Prediction failed');
            }

            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err.message || 'Failed to connect to ML backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            <div className="bg-particles">
                {[...Array(20)].map((_, i) => (
                    <span key={i} className="particle" style={{ '--i': i }} />
                ))}
            </div>

            <div className="app-container">
                <header className="app-header" style={{ marginBottom: '40px' }}>
                    <div className="header-badge">Production ML v2.0</div>
                    <h1 className="app-title">
                        Learning Analytics <span className="title-accent">Risk Predictor</span>
                    </h1>
                    <p className="app-subtitle">
                        Student Risk Assessment · Percentile Ranking · AI Recommendations
                    </p>
                </header>

                <main style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                    {/* Input Form Section */}
                    <section style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                        <StudentInputForm onPredict={handlePredict} loading={loading} />
                    </section>

                    {error && (
                        <div className="error-banner">
                            <span className="error-icon">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Results / Dashboard Section */}
                    {loading && (
                        <div className="skeleton-container" style={{ marginTop: '20px' }}>
                            <div className="skeleton-block tall" />
                            <div className="skeleton-block" />
                        </div>
                    )}

                    {results && !loading && (
                        <RiskDashboard result={results} />
                    )}

                    {!results && !loading && !error && (
                        <div className="empty-state">
                            <div className="empty-icon">🎯</div>
                            <p>Enter student features above to generate a precise risk assessment and academic standing report.</p>
                        </div>
                    )}

                </main>

                <footer style={{ marginTop: '60px', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                    <p>&copy; 2026 Learning Analytics Pro · Secure Inference Engine</p>
                </footer>

            </div>
        </div>
    );
}

export default App;