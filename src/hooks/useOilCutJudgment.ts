import { useCallback } from 'react';
import type { Judgment } from '../types';

interface JudgmentWindow {
  PERFECT: number;
  GREAT: number;
  GOOD: number;
}

const JUDGMENT_WINDOWS: JudgmentWindow = {
  PERFECT: 0.03, // ±30ms
  GREAT: 0.06,   // ±60ms
  GOOD: 0.1,     // ±100ms
};

export const useOilCutJudgment = () => {
  // 油切りタイミングを判定
  const judgeOilCut = useCallback(
    (inputTime: number, targetTime: number): Judgment => {
      const delta = Math.abs(inputTime - targetTime);

      if (delta <= JUDGMENT_WINDOWS.PERFECT) {
        return 'PERFECT';
      } else if (delta <= JUDGMENT_WINDOWS.GREAT) {
        return 'GREAT';
      } else if (delta <= JUDGMENT_WINDOWS.GOOD) {
        return 'GOOD';
      } else {
        return 'MISS';
      }
    },
    []
  );

  // 判定ウィンドウの状態を確認
  const isInWindow = useCallback(
    (inputTime: number, targetTime: number): boolean => {
      const delta = Math.abs(inputTime - targetTime);
      return delta <= JUDGMENT_WINDOWS.GOOD;
    },
    []
  );

  // MISSになるべき油切りをチェック
  const findMissedOilCuts = useCallback(
    (
      currentTime: number,
      unJudgedOilCuts: Array<{ id: string; time: number }>
    ): string[] => {
      return unJudgedOilCuts
        .filter((oilCut) => currentTime - oilCut.time > JUDGMENT_WINDOWS.GOOD)
        .map((oilCut) => oilCut.id);
    },
    []
  );

  return {
    judgeOilCut,
    isInWindow,
    findMissedOilCuts,
    JUDGMENT_WINDOWS,
  };
};
