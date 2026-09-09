type ValidationModel = {
  name: string;
  trainR2: number;
  cvR2Mean: number;
  cvR2Std: number;
  testR2: number;
  testMAE: number;
  overfitGap: number;
  overfitRisk: string;
};

export type ModelValidation = {
  rows: number;
  selectedModel: string;
  split: { method: string; trainRows: number; testRows: number; trainUntil: string; testFrom: string };
  baseline: { name: string; testR2: number; testMAE: number };
  models: ValidationModel[];
  leakageGuard: string;
};


