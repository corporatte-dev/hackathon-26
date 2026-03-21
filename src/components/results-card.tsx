import type { CropResult, PestInfo, PointResult } from '../types';
import '../styles/resultscard.css';

type Props = {
  results: PointResult[];
};

const RANK_LABEL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };
const RANK_ICON:  Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const SEVERITY_LABEL: Record<PestInfo['severity'], string> = {
  low:    'Low',
  medium: 'Med',
  high:   'High',
};

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="conf-bar" title={`${value.toFixed(1)}% confidence`}>
      <div
        className={`conf-bar__fill conf-bar__fill--${value >= 75 ? 'high' : value >= 45 ? 'mid' : 'low'}`}
        style={{ width: `${value}%` }}
      />
      <span className="conf-bar__label">{value.toFixed(1)}%</span>
    </div>
  );
}

function PestTag({ pest }: { pest: PestInfo }) {
  return (
    <span className={`pest-tag pest-tag--${pest.severity}`}>
      <span className="pest-tag__dot" />
      {pest.name}
      <span className="pest-tag__sev">{SEVERITY_LABEL[pest.severity]}</span>
    </span>
  );
}

function CropCard({ crop }: { crop: CropResult }) {
  return (
    <div className={`crop-card crop-card--rank-${crop.rank}`}>
      <div className="crop-card__header">
        <span className="crop-card__rank-icon">{RANK_ICON[crop.rank]}</span>
        <div className="crop-card__title-group">
          <span className="crop-card__rank-label">{RANK_LABEL[crop.rank]} Choice</span>
          <span className="crop-card__name">{crop.name}</span>
        </div>
        <ConfidenceBar value={crop.confidence} />
      </div>

      {crop.pests.length > 0 && (
        <div className="crop-card__pests">
          <span className="crop-card__pests-label">⚠ Common Pests</span>
          <div className="crop-card__pest-list">
            {crop.pests.map(p => (
              <PestTag key={p.name} pest={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsCard({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <section className="results-card" aria-label="Analysis Results">

      <div className="results-card__header">
        <div className="results-card__title-row">
          <h2 className="results-card__title">Results</h2>
          <span className="results-card__badge">{results.length} point{results.length > 1 ? 's' : ''} analyzed</span>
        </div>
        <p className="results-card__subtitle">
          Top 3 compatible crops per sample point, ranked by model confidence.
        </p>
      </div>

      <div className="results-card__body">
        {results.map(pt => (
          <div className="point-result" key={pt.pointIndex}>

            {results.length > 1 && (
              <div className="point-result__label">
                <span className="point-result__index">Point {pt.pointIndex}</span>
              </div>
            )}

            <div className="point-result__crops">
              {pt.crops.map(crop => (
                <CropCard key={crop.rank} crop={crop} />
              ))}
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}