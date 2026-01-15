import { useState, useCallback } from 'react';
import type { Beatmap, Judgment } from '../types';

interface GamePlayState {
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  ramenLevel: number;
  currentTime: number;
  isGameComplete: boolean;
  lastJudgment: Judgment | null;
  lastJudgmentTime: number;
}

export const useGamePlayState = (beatmap: Beatmap) => {
  const [state, setState] = useState<GamePlayState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    greatCount: 0,
    goodCount: 0,
    missCount: 0,
    ramenLevel: 0,
    currentTime: 0,
    isGameComplete: false,
    lastJudgment: null,
    lastJudgmentTime: 0,
  });

  // スコア計算（コンボボーナス付き）
  const calculateScore = useCallback((baseScore: number, combo: number) => {
    const comboMultiplier = 1 + Math.floor(combo / 10) * 0.1;
    return Math.floor(baseScore * comboMultiplier);
  }, []);

  // ラーメンレベル計算
  const calculateRamenLevel = useCallback((combo: number) => {
    if (combo >= 100) return 6;
    if (combo >= 70) return 5;
    if (combo >= 50) return 4;
    if (combo >= 30) return 3;
    if (combo >= 20) return 2;
    if (combo >= 10) return 1;
    return 0;
  }, []);

  // 精度計算
  const calculateAccuracy = useCallback(() => {
    const total = state.perfectCount + state.greatCount + state.goodCount + state.missCount;
    if (total === 0) return 0;
    const weightedScore =
      state.perfectCount * 100 +
      state.greatCount * 80 +
      state.goodCount * 50 +
      state.missCount * 0;
    return Math.floor((weightedScore / (total * 100)) * 1000) / 10;
  }, [state]);

  // 判定を記録
  const recordJudgment = useCallback((judgment: Judgment) => {
    setState((prev) => {
      let newCombo = prev.combo;
      let newScore = prev.score;
      let newPerfect = prev.perfectCount;
      let newGreat = prev.greatCount;
      let newGood = prev.goodCount;
      let newMiss = prev.missCount;

      const baseScores: Record<Judgment, number> = {
        PERFECT: 1000,
        GREAT: 800,
        GOOD: 500,
        MISS: 0,
      };

      const baseScore = baseScores[judgment];

      if (judgment === 'MISS') {
        newCombo = 0;
        newMiss += 1;
      } else {
        newCombo += 1;
        newScore += calculateScore(baseScore, newCombo);
        if (judgment === 'PERFECT') newPerfect += 1;
        else if (judgment === 'GREAT') newGreat += 1;
        else if (judgment === 'GOOD') newGood += 1;
      }

      const newMaxCombo = Math.max(prev.maxCombo, newCombo);
      const newRamenLevel = calculateRamenLevel(newCombo);

      return {
        ...prev,
        score: newScore,
        combo: newCombo,
        maxCombo: newMaxCombo,
        perfectCount: newPerfect,
        greatCount: newGreat,
        goodCount: newGood,
        missCount: newMiss,
        ramenLevel: newRamenLevel,
        lastJudgment: judgment,
        lastJudgmentTime: prev.currentTime,
      };
    });
  }, [calculateScore, calculateRamenLevel]);

  // 時刻を更新
  const updateTime = useCallback((time: number) => {
    setState((prev) => ({
      ...prev,
      currentTime: time,
      isGameComplete: beatmap.duration ? time >= beatmap.duration : false,
    }));
  }, [beatmap.duration]);

  // ゲーム完了
  const completeGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGameComplete: true,
    }));
  }, []);

  // リセット
  const reset = useCallback(() => {
    setState({
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      ramenLevel: 0,
      currentTime: 0,
      isGameComplete: false,
      lastJudgment: null,
      lastJudgmentTime: 0,
    });
  }, []);

  // スコアデータを取得
  const getScoreData = useCallback(() => ({
    score: state.score,
    combo: state.maxCombo,
    maxCombo: state.maxCombo,
    judgments: {
      perfect: state.perfectCount,
      great: state.greatCount,
      good: state.goodCount,
      miss: state.missCount,
    },
    accuracy: calculateAccuracy(),
    ramenLevel: state.ramenLevel,
  }), [state, calculateAccuracy]);

  return {
    ...state,
    recordJudgment,
    updateTime,
    completeGame,
    reset,
    getScoreData,
    accuracy: calculateAccuracy(),
  };
};
