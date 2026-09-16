export type ValidationModel = {
  name: string;
  trainR2: number;
  cvR2Mean: number;
  cvR2Std: number;
  testR2: number;
  testMAE: number;
  testRMSE?: number;
  testMedianAE?: number;
  testMAPE?: number;
  overfitGap: number;
  overfitRisk: string;
  bestParams?: Record<string, any>;
};

export type ValidationBaseline = {
  name: string;
  testR2: number;
  testMAE: number;
  testRMSE?: number;
  testMedAE?: number;
};

export type SplitComparisonItem = {
  split: string;
  model: string;
  testR2: number;
  testMAE: number;
  testMedAE: number;
};

export type SegmentMetricItem = {
  item?: string;
  platform?: string;
  tier?: string;
  priceRange?: string;
  count: number;
  r2?: number;
  mae: number;
  medae: number;
};

export type ModelValidation = {
  rows: number;
  target?: string;
  selectedModel: string;
  selectedR2?: number;
  selectedMAE?: number;
  split: { method: string; trainRows: number; testRows: number; trainUntil?: string | null; testFrom?: string | null };
  baseline?: ValidationBaseline;
  baselines?: ValidationBaseline[];
  models: ValidationModel[];
  splitComparison?: SplitComparisonItem[];
  selectedCategoryMetrics?: SegmentMetricItem[];
  selectedPlatformMetrics?: SegmentMetricItem[];
  selectedPriceTierMetrics?: SegmentMetricItem[];
  leakageGuard: string;
};
