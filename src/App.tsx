import { useState } from 'react';
import axios from 'axios';
import './App.css';
import PointRow from './components/pointrow';
import type { CropResult, Field, PointResult } from './types';
import TableHeader from './components/tableheader';
import ResultsCard from './components/results-card';

export const FIELDS: Field[] = [
  { name: 'N',           label: 'N',    unit: 'mg/kg', step: '1',    icon: '🌿' },
  { name: 'P',           label: 'P',    unit: 'mg/kg', step: '1',    icon: '🔴' },
  { name: 'K',           label: 'K',    unit: 'mg/kg', step: '1',    icon: '🟡' },
  { name: 'temperature', label: 'Temp', unit: '°C',    step: '0.01', icon: '🌡️' },
  { name: 'humidity',    label: 'Hum',  unit: '%',     step: '0.01', icon: '💧' },
  { name: 'ph',          label: 'pH',   unit: 'pH',    step: '0.01', icon: '⚗️' },
  { name: 'rainfall',    label: 'Rain', unit: 'mm',    step: '0.01', icon: '🌧️' },
];

// Shape expected from the Python API for each point:
// {
//   crops: [
//     { rank: 1, name: "wheat", confidence: 87.4, pests: [{ name: "aphids", severity: "high" }] },
//     { rank: 2, name: "rice",  confidence: 64.1, pests: [...] },
//     { rank: 3, name: "maize", confidence: 51.0, pests: [...] },
//   ]
// }

type Point = {
  id: number;
  values: Record<string, string>;
  result: string | null;
  loading: boolean;
};

let nextId = 1;
const emptyValues = () => Object.fromEntries(FIELDS.map(f => [f.name, '']));
const newPoint = (): Point => ({ id: nextId++, values: emptyValues(), result: null, loading: false });

export default function App() {
  const [points, setPoints] = useState<Point[]>([newPoint()]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [results, setResults]   = useState<PointResult[]>([]);

  const updateValue = (id: number, field: string, value: string) =>
    setPoints(pts =>
      pts.map(p => p.id === id ? { ...p, values: { ...p.values, [field]: value } } : p)
    );

  const addPoint = () => setPoints(pts => [...pts, newPoint()]);

  const removePoint = (id: number) =>
    setPoints(pts => pts.filter(p => p.id !== id));

  const predictOne = async (point: Point): Promise<string> => {
    const payload = Object.fromEntries(FIELDS.map(f => [f.name, Number(point.values[f.name])]));
    const response = await axios.post('http://127.0.0.1:5000/predict', payload);
    return response.data.crop as string;
  };

    const handleAnalyzeAll = async () => {
    setGlobalLoading(true);
    setResults([]);
    setPoints(pts => pts.map(p => ({ ...p, loading: true })));
 
    const settled = await Promise.allSettled(
      points.map((p, idx) => predictOne(p).then(crops => ({ pointIndex: idx + 1, crops })))
    );
 
    const newResults: PointResult[] = settled.map((s, idx) =>
      s.status === 'fulfilled'
        ? s.value
        : {
            pointIndex: idx + 1,
            crops: [{ rank: 1, name: 'Error', confidence: 0, pests: [] }] as CropResult[],
          }
    );
 
    setPoints(pts => pts.map(p => ({ ...p, loading: false })));
    setResults(newResults);
    setGlobalLoading(false);
  };

  const allFilled = points.every(p => FIELDS.every(f => p.values[f.name] !== ''));

  return (
    <div className="page">
      <div className="noise" />

      <header className="header">
        <div className="header-badge">AI-POWERED</div>
        <h1 className="title">
          <span className="title-main">Smart Soil Analyzer</span>
        </h1>
        <p className="subtitle">
          Add one or more soil sample points, fill in their parameters, and run the analysis on the points.
        </p>
      </header>

      <main className="card">
        <TableHeader fields={FIELDS} />

        <div className="table-body">
          {points.map((point, idx) => (
            <PointRow
              key={point.id}
              index={idx + 1}
              fields={FIELDS}
              values={point.values}
              result={point.result}
              loading={point.loading}
              removable={points.length > 1}
              onChange={(field, value) => updateValue(point.id, field, value)}
              onRemove={() => removePoint(point.id)}
            />
          ))}
        </div>

        <div className="table-actions">
          <button className="btn-add" onClick={addPoint}>
            + Add Sample Point
          </button>
          <button
            className={`btn-analyze ${globalLoading ? 'btn-analyze--loading' : ''}`}
            onClick={handleAnalyzeAll}
            disabled={globalLoading || !allFilled}
          >
            {globalLoading
              ? <><span className="spinner spinner--light" /> Analyzing…</>
              : <>Analyze All</>
            }
          </button>
        </div>

      </main>

      {results.length > 0 && (
        <ResultsCard results={results} />
      )}

      <footer className="footer">
        Powered by machine learning · Results are advisory only
      </footer>
    </div>
  );
}