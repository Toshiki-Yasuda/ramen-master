/**
 * useJudgment - ノーツ判定ロジックHook
 *
 * 音ゲーにおける判定の重要ポイント:
 * - 入力時刻とノーツ時刻の差分で判定
 * - FAST/SLOW表示でプレイヤーにフィードバック
 * - 判定ウィンドウは調整可能に
 */

import { useCallback, useMemo } from 'react';
import type { Judgment, Note } from '../types';
import { JUDGMENT_WINDOWS, JUDGMENT_SCORES } from '../constants';

// 判定タイミング（FAST = 早押し, SLOW = 遅押し）
export type JudgmentTiming = 'FAST' | 'SLOW' | 'JUST';

// 判定結果の詳細
export interface DetailedJudgmentResult {
  judgment: Judgment;
  score: number;
  timing: JudgmentTiming;
  timeDiff: number; // ミリ秒単位の差分（負 = FAST, 正 = SLOW）
}

interface JudgmentConfig {
  // 判定ウィンドウ（ミリ秒）
  perfectWindow?: number;
  greatWindow?: number;
  goodWindow?: number;
  // JUST判定の閾値（この範囲内ならFAST/SLOW表示しない）
  justThreshold?: number;
}

export const useJudgment = (config: JudgmentConfig = {}) => {
  // デフォルト値をconstantsから取得
  const {
    perfectWindow = JUDGMENT_WINDOWS.PERFECT,
    greatWindow = JUDGMENT_WINDOWS.GREAT,
    goodWindow = JUDGMENT_WINDOWS.GOOD,
    justThreshold = 10, // ±10ms以内はJUST
  } = config;

  /**
   * 時刻の差分からタイミング種別を判定
   * @param timeDiff ミリ秒単位（負 = 入力が早い, 正 = 入力が遅い）
   */
  const getTiming = useCallback(
    (timeDiff: number): JudgmentTiming => {
      if (Math.abs(timeDiff) <= justThreshold) {
        return 'JUST';
      }
      return timeDiff < 0 ? 'FAST' : 'SLOW';
    },
    [justThreshold]
  );

  /**
   * 時刻の差分から判定を取得
   * @param timeDiff ミリ秒単位の差分（絶対値）
   */
  const getJudgmentFromDiff = useCallback(
    (absDiff: number): Judgment => {
      if (absDiff <= perfectWindow) return 'PERFECT';
      if (absDiff <= greatWindow) return 'GREAT';
      if (absDiff <= goodWindow) return 'GOOD';
      return 'MISS';
    },
    [perfectWindow, greatWindow, goodWindow]
  );

  /**
   * ノーツの判定を行う
   * @param inputTime 入力時刻（秒）
   * @param noteTime ノーツの目標時刻（秒）
   * @returns 判定結果
   */
  const judge = useCallback(
    (inputTime: number, noteTime: number): DetailedJudgmentResult => {
      // 差分を計算（ミリ秒単位）
      // 負の値 = 入力が早い（FAST）
      // 正の値 = 入力が遅い（SLOW）
      const timeDiff = (inputTime - noteTime) * 1000;
      const absDiff = Math.abs(timeDiff);

      // 判定を取得
      const judgment = getJudgmentFromDiff(absDiff);
      const timing = getTiming(timeDiff);
      const score = JUDGMENT_SCORES[judgment];

      return {
        judgment,
        score,
        timing,
        timeDiff,
      };
    },
    [getJudgmentFromDiff, getTiming]
  );

  /**
   * 複数のノーツの中から最も近いノーツを見つけて判定
   * @param inputTime 入力時刻（秒）
   * @param notes 判定対象のノーツ配列
   * @returns [判定結果, 判定されたノーツのインデックス] または null
   */
  const judgeNearestNote = useCallback(
    (
      inputTime: number,
      notes: Note[]
    ): [DetailedJudgmentResult, number] | null => {
      if (notes.length === 0) return null;

      // 最も近いノーツを見つける
      let nearestIndex = 0;
      let nearestDiff = Infinity;

      notes.forEach((note, index) => {
        const diff = Math.abs(inputTime - note.time);
        if (diff < nearestDiff) {
          nearestDiff = diff;
          nearestIndex = index;
        }
      });

      // 判定ウィンドウ外なら判定しない
      const timeDiffMs = nearestDiff * 1000;
      if (timeDiffMs > goodWindow) {
        return null;
      }

      const result = judge(inputTime, notes[nearestIndex].time);
      return [result, nearestIndex];
    },
    [judge, goodWindow]
  );

  /**
   * MISSを判定すべきノーツを検出
   * 判定ウィンドウを過ぎたノーツを見つける
   * @param currentTime 現在時刻（秒）
   * @param notes 未判定のノーツ配列
   * @returns MISS判定すべきノーツのインデックス配列
   */
  const findMissedNotes = useCallback(
    (currentTime: number, notes: Note[]): number[] => {
      const missedIndices: number[] = [];
      const missThreshold = currentTime - goodWindow / 1000; // ミリ秒→秒

      notes.forEach((note, index) => {
        if (note.time < missThreshold && !note.isHit) {
          missedIndices.push(index);
        }
      });

      return missedIndices;
    },
    [goodWindow]
  );

  /**
   * ノーツが判定可能な範囲にあるか確認
   * @param currentTime 現在時刻（秒）
   * @param noteTime ノーツの時刻（秒）
   */
  const isNoteInWindow = useCallback(
    (currentTime: number, noteTime: number): boolean => {
      const diff = Math.abs(currentTime - noteTime) * 1000;
      return diff <= goodWindow;
    },
    [goodWindow]
  );

  /**
   * 判定結果の表示テキストを取得
   */
  const getJudgmentText = useCallback(
    (result: DetailedJudgmentResult): string => {
      if (result.judgment === 'MISS') return 'MISS';

      // PERFECTでJUSTならただのPERFECT
      if (result.judgment === 'PERFECT' && result.timing === 'JUST') {
        return 'PERFECT';
      }

      // それ以外はFAST/SLOWを付ける
      return `${result.judgment} ${result.timing}`;
    },
    []
  );

  // 判定ウィンドウの情報
  const windows = useMemo(
    () => ({
      perfect: perfectWindow,
      great: greatWindow,
      good: goodWindow,
    }),
    [perfectWindow, greatWindow, goodWindow]
  );

  return {
    // 判定関数
    judge,
    judgeNearestNote,
    findMissedNotes,
    isNoteInWindow,

    // ユーティリティ
    getTiming,
    getJudgmentText,

    // 設定値
    windows,
  };
};

export default useJudgment;
