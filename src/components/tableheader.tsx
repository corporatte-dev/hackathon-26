import type { Field } from '../types';
import '../styles/tableheader.css';

type Props = {
    fields: Field[];
};

export default function TableHeader({ fields }: Props) {
  return (
    <div className="table-header">
      <div className="th-index">#</div>
      <div className="th-fields">
        {fields.map(f => (
          <div className="th-col" key={f.name}>
            <span className="th-icon">{f.icon}</span>
            <span className="th-name">{f.label}</span>
            <span className="th-unit">{f.unit}</span>
          </div>
        ))}
      </div>
      <div className="th-result">Crop</div>
      <div className="th-remove" />
    </div>
  );
}