export const FEATURE_FLAGS = {
  proposalImageLibrary: true
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
