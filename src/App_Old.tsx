import { useState } from 'react';
import axios from 'axios';
import './App.css';

const fields = [
  { name: 'N', label: 'Nitrogen', unit: 'mg/kg', step: '1' },
  { name: 'P', label: 'Phosphorus', unit: 'mg/kg', step: '1' },
  { name: 'K', label: 'Potassium', unit: 'mg/kg', step: '1' },
  { name: 'temperature', label: 'Temperature', unit: '°C', step: '0.01' },
  { name: 'humidity', label: 'Humidity', unit: '%', step: '0.01' },
  { name: 'ph', label: 'pH Level', unit: 'pH', step: '0.01' },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', step: '0.01' },
];

export default function App() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult('');
    const formData = new FormData(e.currentTarget);

    const payload = {
      N: Number(formData.get('N')),
      P: Number(formData.get('P')),
      K: Number(formData.get('K')),
      temperature: Number(formData.get('temperature')),
      humidity: Number(formData.get('humidity')),
      ph: Number(formData.get('ph')),
      rainfall: Number(formData.get('rainfall')),
    };

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', payload);
      setResult(response.data.crop);
    } catch (error) {
      alert('Error: Check Python terminal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="noise" />

      <header className="header">
        <div className="header-badge">AI-POWERED</div>
        <h1 className="title">
          <span className="title-main">Smart Soil Analyzer</span>
        </h1>
        <p className="subtitle">
          Enter soil properties for points you want to describe based on your land, and AI generated plans for harvesting multiple crops will be made as a result as advice to yield more crops efficiently!
        </p>
      </header>

      <main className="card">
        <div className="card-label">SOIL PROPERTIES:</div>
        <form onSubmit={handlePredict} className="form">
          <div className="grid">
            {fields.map((f) => (
              <div className="field" key={f.name}>
                <label className="field-label" htmlFor={f.name}>
                  {f.label}
                  <span className="field-unit">{f.unit}</span>
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  type="number"
                  step={f.step}
                  placeholder="0.00"
                  required
                  className="input"
                />
              </div>
            ))}
          </div>

          <button type="submit" className={`btn ${loading ? 'btn--loading' : ''}`} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Analyzing…
              </>
            ) : (
              <>
                Analyze &amp; Create a Plan
              </>
            )}
          </button>
        </form>

        {result && (
          <div className="result">
            <div className="result-label">RECOMMENDED CROP</div>
            <div className="result-crop">{result}</div>
            <div className="result-bar" />
          </div>
        )}
      </main>

      <footer className="footer">
        Powered by machine learning · Results are advisory only
      </footer>
    </div>
  );
}