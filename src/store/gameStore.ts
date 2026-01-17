import { create } from 'zustand';
import type { GameStoreState, JudgmentType } from '../types';
import { SCORE_VALUES } from '../types';

const initialJudgments = {
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: 'title',
  score: 0,
  combo: 0,
  maxCombo: 0,
  judgments: { ...initialJudgments },
  lastJudgment: null,

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
    }),

  getScoreData: () => {
    const state = get();
    return {
      score: state.score,
      maxCombo: state.maxCombo,
      judgments: state.judgments,
    };
  },
}));
