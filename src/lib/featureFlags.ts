export const FEATURE_FLAGS = {
  proposalImageLibrary: process.env.NODE_ENV === 'development'
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
