// ゲーム全体で使用する定数

// 判定ウィンドウ（ms）
export const JUDGMENT_WINDOWS = {
  PERFECT: 30,
  GREAT: 60,
  GOOD: 100,
} as const;

// 判定ごとのスコア
export const JUDGMENT_SCORES = {
  PERFECT: 1000,
  GREAT: 800,
  GOOD: 500,
  MISS: 0,
} as const;

// カオスイベント発生のスコア閾値
export const CHAOS_SCORE_THRESHOLDS = {
  LEVEL_1: 1000,   // カオス解禁
  LEVEL_2: 3000,   // 中級カオス
  LEVEL_3: 5000,   // 上級カオス
  LEVEL_4: 8000,   // 超級カオス
  LEVEL_5: 10000,  // 究極カオス
} as const;

// カオスイベント発生確率
export const CHAOS_PROBABILITY = {
  NONE: 0,
  LOW: 0.1,
  MEDIUM: 0.2,
  HIGH: 0.35,
  MAX: 0.5,
} as const;

// ラーメン進化のコンボ閾値
export const RAMEN_COMBO_THRESHOLDS = {
  LEVEL_1: 0,
  LEVEL_2: 10,
  LEVEL_3: 20,
  LEVEL_4: 30,
  LEVEL_5: 50,
  LEVEL_6: 70,
  LEVEL_7: 100,
} as const;

// ゲームのデフォルト設定
export const DEFAULT_GAME_CONFIG = {
  noteSpeed: 1.0,
  audioOffset: 0,
  videoOffset: 0,
} as const;

// アニメーション時間（ms）
export const ANIMATION_DURATION = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 500,
  EXTRA_LONG: 800,
} as const;
