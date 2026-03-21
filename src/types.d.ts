

export type Field = {
  name: string;
  label: string;
  unit: string;
  step: string;
  icon: string;
};

export type PestInfo = {
  name: string;
  severity: 'low' | 'medium' | 'high';
};
 
export type CropResult = {
  rank: 1 | 2 | 3;
  name: string;
  confidence: number; // 0–100
  pests: PestInfo[];
};
 
export type PointResult = {
  pointIndex: number;
  crops: CropResult[];
};
