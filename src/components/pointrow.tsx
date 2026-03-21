import type { Field } from '../types';
import '../styles/pointrow.css';

type PointRowProps = {
  index: number;
  fields: Field[];
  values: Record<string, string>;
  result: string | null;
  loading: boolean;
  removable: boolean;
  onChange: (field: string, value: string) => void;
  onRemove: () => void;
};

export default function PointRow({
  index,
  fields,
  values,
  result,
  loading,
  removable,
  onChange,
  onRemove,
}: PointRowProps) {
  return (
    <div className="point-row">
      <div className="point-row__index">{index}</div>

      {/* One input cell per field */}
      {fields.map(f => (
        <div className="point-row__cell" key={f.name}>
          <input
            type="number"
            step={f.step}
            placeholder="—"
            value={values[f.name]}
            onChange={e => onChange(f.name, e.target.value)}
            className="point-row__input"
            aria-label={`${f.label} (${f.unit})`}
          />
        </div>
      ))}

      {/* Result chip / spinner */}
      <div className="point-row__result">
        {loading ? (
          <span className="point-row__spinner" role="status" aria-label="Analyzing" />
        ) : result ? (
          <span
            className={`point-row__chip${result === 'Error' ? ' point-row__chip--error' : ''}`}
          >
            {result}
          </span>
        ) : (
          <span className="point-row__empty">—</span>
        )}
      </div>

      {/* Remove button */}
      <div className="point-row__remove">
        <button
          className="point-row__remove-btn"
          onClick={onRemove}
          disabled={!removable}
          title="Remove row"
          aria-label="Remove this sample point"
        >
          ✕
        </button>
      </div>

    </div>
  );
}