import { useState } from 'react';
import axios from 'axios';
import './App.css';
import PointRow from './components/pointrow';
import type { Field } from './types';
import TableHeader from './components/tableheader';

export const FIELDS: Field[] = [
  { name: 'N',           label: 'N',    unit: 'mg/kg', step: '1',    icon: '🌿' },
  { name: 'P',           label: 'P',    unit: 'mg/kg', step: '1',    icon: '🔴' },
  { name: 'K',           label: 'K',    unit: 'mg/kg', step: '1',    icon: '🟡' },
  { name: 'temperature', label: 'Temp', unit: '°C',    step: '0.01', icon: '🌡️' },
  { name: 'humidity',    label: 'Hum',  unit: '%',     step: '0.01', icon: '💧' },
  { name: 'ph',          label: 'pH',   unit: 'pH',    step: '0.01', icon: '⚗️' },
  { name: 'rainfall',    label: 'Rain', unit: 'mm',    step: '0.01', icon: '🌧️' },
];

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
    setPoints(pts => pts.map(p => ({ ...p, loading: true, result: null })));

    const updated = await Promise.all(
      points.map(async p => {
        try {
          const result = await predictOne(p);
          return { ...p, result, loading: false };
        } catch {
          return { ...p, result: 'Error', loading: false };
        }
      })
    );

    setPoints(updated);
    setGlobalLoading(false);
  };

  const allFilled = points.every(p => FIELDS.every(f => p.values[f.name] !== ''));

  return (
    <div className="page">
      <div className="noise" />

      <header className="header">
        <div className="header-badge">AI-POWERED</div>
        <h1 className="title">
          <span className="title-main">Smart Soil</span>
          <span className="title-sub">Analyzer</span>
        </h1>
        <p className="subtitle">
          Add one or more soil sample points, fill in their parameters, and run a batch prediction.
        </p>
      </header>

      <main className="card">

        {/* Column headers */}
        <TableHeader fields={FIELDS} />

        {/* Point rows — rendered by PointRow component */}
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

        {/* Actions */}
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
              : <><span>🔬</span> Analyze All</>
            }
          </button>
        </div>

      </main>

      <footer className="footer">
        Powered by machine learning · Results are advisory only
      </footer>
    </div>
  );
}