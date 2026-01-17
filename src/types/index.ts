// ゲーム状態
export type GameState = 'title' | 'loading' | 'playing' | 'paused' | 'result';

// 判定結果
export type JudgmentType = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

// 判定ウィンドウ（ms）
export const JUDGMENT_WINDOWS = {
  PERFECT: 30,
  GREAT: 60,
  GOOD: 100,
} as const;

// スコア設定
export const SCORE_VALUES: Record<JudgmentType, number> = {
  PERFECT: 1000,
  GREAT: 800,
  GOOD: 500,
  MISS: 0,
};

// ノート（譜面上の1打）
export interface Note {
  t: number; // 出現時刻（秒）
  hit?: boolean; // 判定済みフラグ
  judgment?: JudgmentType; // 判定結果
}

// 譜面メタ情報
export interface BeatmapMeta {
  title: string;
  bpm: number;
  offset: number; // 開始オフセット（秒）
}

// 譜面オーディオ設定
export interface BeatmapAudio {
  bgm: string; // BGMファイルパス
}

// 譜面データ
export interface Beatmap {
  meta: BeatmapMeta;
  audio: BeatmapAudio;
  notes: Note[];
}

// 判定カウント
export interface JudgmentCounts {
  perfect: number;
  great: number;
  good: number;
  miss: number;
}

// スコアデータ
export interface ScoreData {
  score: number;
  maxCombo: number;
  judgments: JudgmentCounts;
}

// ゲームストア状態
export interface GameStoreState {
  gameState: GameState;
  score: number;
  combo: number;
  maxCombo: number;
  judgments: JudgmentCounts;
  lastJudgment: JudgmentType | null;

  // アクション
  setGameState: (state: GameState) => void;
  addScore: (judgment: JudgmentType) => void;
  resetGame: () => void;
  getScoreData: () => ScoreData;
}
