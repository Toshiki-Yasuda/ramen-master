// ゲームの判定種類
export type Judgment = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

// 判定結果
export interface JudgmentResult {
  judgment: Judgment;
  score: number;
  delta: number; // タイミングのずれ（ms）
}

// ノーツの種類
export type NoteType = 'tap' | 'hold' | 'yukigiri_combo';

// ノーツデータ
export interface Note {
  id: string;
  time: number; // 秒
  type: NoteType;
  lane?: number; // 将来の拡張用
  duration?: number; // holdノーツ用
  pattern?: number[]; // コンボノーツ用
  isHit?: boolean;
  judgment?: Judgment;
}

// 譜面データ
export interface Beatmap {
  songId: string;
  title: string;
  artist?: string;
  bpm: number;
  offset: number; // 最初のビートまでのオフセット（秒）
  difficulty?: {
    easy?: number;
    normal?: number;
    hard?: number;
  };
  notes: Note[];
}

// ゲーム状態
export type GameState = 'title' | 'loading' | 'playing' | 'paused' | 'result';

// スコア情報
export interface ScoreData {
  score: number;
  combo: number;
  maxCombo: number;
  judgments: {
    perfect: number;
    great: number;
    good: number;
    miss: number;
  };
}

// カオスイベント
export interface ChaosEvent {
  id: string;
  minScore: number;
  image: string;
  duration: number; // ms
  animation?: string;
}

// ラーメンレベル
export interface RamenLevel {
  level: number;
  combo: number;
  name: string;
  description: string;
  image?: string;
}

// 店主の表情
export type ChefExpression =
  | 'idle'
  | 'yukigiri'
  | 'perfect'
  | 'great'
  | 'miss'
  | 'wink'
  | 'muscle';

// 店主のアニメーション状態
export interface ChefState {
  expression: ChefExpression;
  isAnimating: boolean;
}

// オーディオ設定
export interface AudioConfig {
  bpm: number;
  audioOffset: number; // キャリブレーションで設定
  videoOffset: number;
}

// ゲームコンフィグ
export interface GameConfig {
  audio: AudioConfig;
  noteSpeed: number; // ノーツの移動速度
  judgmentWindows: {
    perfect: number;
    great: number;
    good: number;
  };
}
