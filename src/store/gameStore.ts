import { create } from 'zustand';
import type { GameStoreState, JudgmentType, HighScoreData } from '../types';
import { SCORE_VALUES } from '../types';

const HIGHSCORE_KEY = 'yukiri-master-highscore';

const initialJudgments = {
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
};

// localStorageからハイスコアを読み込む
function loadHighScoreFromStorage(): HighScoreData | null {
  try {
    const saved = localStorage.getItem(HIGHSCORE_KEY);
    if (saved) {
      return JSON.parse(saved) as HighScoreData;
    }
  } catch {
    // パースエラーは無視
  }
  return null;
}

// localStorageにハイスコアを保存
function saveHighScoreToStorage(data: HighScoreData): void {
  try {
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(data));
  } catch {
    // 保存エラーは無視
  }
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: 'title',
  score: 0,
  combo: 0,
  maxCombo: 0,
  judgments: { ...initialJudgments },
  lastJudgment: null,
  highScore: loadHighScoreFromStorage(),
  isNewRecord: false,

  setGameState: (state) => set({ gameState: state }),

  addScore: (judgment: JudgmentType) => {
    const scoreToAdd = SCORE_VALUES[judgment];
    const isMiss = judgment === 'MISS';

    set((state) => {
      const newCombo = isMiss ? 0 : state.combo + 1;
      const newMaxCombo = Math.max(state.maxCombo, newCombo);
      const judgmentKey = judgment.toLowerCase() as keyof typeof initialJudgments;

      return {
        score: state.score + scoreToAdd,
        combo: newCombo,
        maxCombo: newMaxCombo,
        judgments: {
          ...state.judgments,
          [judgmentKey]: state.judgments[judgmentKey] + 1,
        },
        lastJudgment: judgment,
      };
    });
  },

  resetGame: () =>
    set({
      score: 0,
      combo: 0,
      maxCombo: 0,
      judgments: { ...initialJudgments },
      lastJudgment: null,
      isNewRecord: false,
    }),

  getScoreData: () => {
    const state = get();
    return {
      score: state.score,
      maxCombo: state.maxCombo,
      judgments: state.judgments,
    };
  },

  checkAndSaveHighScore: () => {
    const state = get();
    const currentHighScore = state.highScore?.score ?? 0;

    if (state.score > currentHighScore) {
      const newHighScore: HighScoreData = {
        score: state.score,
        maxCombo: state.maxCombo,
        date: new Date().toISOString(),
      };
      saveHighScoreToStorage(newHighScore);
      set({ highScore: newHighScore, isNewRecord: true });
      return true;
    }
    return false;
  },

  loadHighScore: () => {
    const highScore = loadHighScoreFromStorage();
    set({ highScore });
  },
}));
