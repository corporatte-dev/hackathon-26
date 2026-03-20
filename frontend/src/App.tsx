import { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [result, setResult] = useState<string>('');

  const handlePredict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      N: Number(formData.get('N')),
      P: Number(formData.get('P')),
      K: Number(formData.get('K')),
      temperature: Number(formData.get('temperature')),
      humidity: Number(formData.get('humidity')),
      ph: Number(formData.get('ph')),
      rainfall: Number(formData.get('rainfall'))
    };

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', payload);
      setResult(response.data.crop);
    } catch (error) {
      alert("Error: Check Python terminal");
    }
  };

  const s = { padding: '10px', marginBottom: '10px', width: '250px', display: 'block' };

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Crop Predictor</h1>
      <form onSubmit={handlePredict} style={{ display: 'inline-block', textAlign: 'left' }}>
        <input name="N" type="number" placeholder="Nitrogen (N)" required style={s} />
        <input name="P" type="number" placeholder="Phosphorus (P)" required style={s} />
        <input name="K" type="number" placeholder="Potassium (K)" required style={s} />
        <input name="temperature" type="number" step="0.01" placeholder="Temperature" required style={s} />
        <input name="humidity" type="number" step="0.01" placeholder="Humidity" required style={s} />
        <input name="ph" type="number" step="0.01" placeholder="pH" required style={s} />
        <input name="rainfall" type="number" step="0.01" placeholder="Rainfall" required style={s} />
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Predict</button>
      </form>
      {result && <h2 style={{ color: 'green' }}>Result: {result.toUpperCase()}</h2>}
    </div>
  );
}