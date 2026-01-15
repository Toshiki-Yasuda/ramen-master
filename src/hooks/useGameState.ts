/**
 * useGameState - ゲーム状態管理Hook
 *
 * 管理する状態:
 * - スコア、コンボ
 * - 各判定のカウント
 * - ノーツキュー
 * - ラーメン進化レベル
 * - カオスイベント
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { Note, Beatmap, ScoreData } from '../types';
import { RAMEN_COMBO_THRESHOLDS } from '../constants';
import type { DetailedJudgmentResult } from './useJudgment';

// ゲーム状態
interface GamePlayState {
  // スコア情報
  score: number;
  combo: number;
  maxCombo: number;

  // 判定カウント
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;

  // 進行状況
  notesHit: number;
  totalNotes: number;

  // ラーメンレベル（コンボに応じて進化）
  ramenLevel: number;

  // カオスイベント発動フラグ
  chaosEventActive: boolean;
  currentChaosEvent: string | null;
}

// ノーツの状態（内部管理用）
interface NoteState extends Omit<Note, 'isHit' | 'judgment'> {
  isHit: boolean;
  result?: DetailedJudgmentResult;
}

export const useGameState = () => {
  // ゲーム状態
  const [state, setState] = useState<GamePlayState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    greatCount: 0,
    goodCount: 0,
    missCount: 0,
    notesHit: 0,
    totalNotes: 0,
    ramenLevel: 0,
    chaosEventActive: false,
    currentChaosEvent: null,
  });

  // ノーツキュー
  const [notes, setNotes] = useState<NoteState[]>([]);

  // 最後の判定結果（表示用）
  const [lastJudgment, setLastJudgment] = useState<DetailedJudgmentResult | null>(null);

  // 判定表示タイマー（自動クリア用）
  const judgmentTimerRef = useRef<number | null>(null);

  /**
   * ゲームを初期化
   */
  const initialize = useCallback((beatmap: Beatmap) => {
    // ノーツを初期化
    const initialNotes: NoteState[] = (beatmap.notes || []).map((note) => ({
      ...note,
      isHit: false,
    }));

    setNotes(initialNotes);
    setState({
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      notesHit: 0,
      totalNotes: (beatmap.notes || []).length,
      ramenLevel: 0,
      chaosEventActive: false,
      currentChaosEvent: null,
    });
    setLastJudgment(null);

    // 判定タイマーをクリア
    if (judgmentTimerRef.current) {
      clearTimeout(judgmentTimerRef.current);
      judgmentTimerRef.current = null;
    }
  }, []);

  // RAMEN_COMBO_THRESHOLDSの値を配列化
  const ramenThresholds = useMemo(() =>
    Object.values(RAMEN_COMBO_THRESHOLDS) as number[],
    []
  );

  /**
   * ラーメンレベルを計算
   */
  const calculateRamenLevel = useCallback((combo: number): number => {
    for (let i = ramenThresholds.length - 1; i >= 0; i--) {
      if (combo >= ramenThresholds[i]) {
        return i;
      }
    }
    return 0;
  }, [ramenThresholds]);

  /**
   * 判定を記録
   */
  const recordJudgment = useCallback(
    (noteIndex: number, result: DetailedJudgmentResult) => {
      // ノーツの状態を更新（効率的なimmutable更新）
      setNotes((prev) => {
        const newNotes = [...prev];
        newNotes[noteIndex] = { ...prev[noteIndex], isHit: true, result };
        return newNotes;
      });

      // ゲーム状態を更新
      setState((prev) => {
        const isMiss = result.judgment === 'MISS';
        const newCombo = isMiss ? 0 : prev.combo + 1;
        const newMaxCombo = Math.max(prev.maxCombo, newCombo);
        const newScore = prev.score + result.score * (1 + Math.floor(newCombo / 10) * 0.1); // コンボボーナス

        // 判定カウントを更新
        const counts = {
          perfectCount: prev.perfectCount + (result.judgment === 'PERFECT' ? 1 : 0),
          greatCount: prev.greatCount + (result.judgment === 'GREAT' ? 1 : 0),
          goodCount: prev.goodCount + (result.judgment === 'GOOD' ? 1 : 0),
          missCount: prev.missCount + (result.judgment === 'MISS' ? 1 : 0),
        };

        // ラーメンレベルを計算
        const newRamenLevel = calculateRamenLevel(newCombo);

        return {
          ...prev,
          score: Math.floor(newScore),
          combo: newCombo,
          maxCombo: newMaxCombo,
          notesHit: prev.notesHit + (isMiss ? 0 : 1),
          ramenLevel: newRamenLevel,
          ...counts,
        };
      });

      // 最後の判定を保存（800ms後に自動クリア）
      setLastJudgment(result);

      // 既存のタイマーをクリア
      if (judgmentTimerRef.current) {
        clearTimeout(judgmentTimerRef.current);
      }

      // 800ms後に判定表示をクリア
      judgmentTimerRef.current = window.setTimeout(() => {
        setLastJudgment(null);
      }, 800);
    },
    [calculateRamenLevel]
  );

  /**
   * MISSを記録（ノーツを見逃した場合）
   */
  const recordMiss = useCallback((noteIndex: number) => {
    const missResult: DetailedJudgmentResult = {
      judgment: 'MISS',
      score: 0,
      timing: 'SLOW',
      timeDiff: 0,
    };
    recordJudgment(noteIndex, missResult);
  }, [recordJudgment]);

  /**
   * 未判定のノーツを取得
   */
  const getUnjudgedNotes = useCallback((): NoteState[] => {
    return notes.filter((note) => !note.isHit);
  }, [notes]);

  /**
   * 表示すべきノーツを取得（時間範囲内）
   */
  const getVisibleNotes = useCallback(
    (currentTime: number, lookAhead: number = 3, lookBehind: number = 0.5): NoteState[] => {
      return notes.filter((note) => {
        const timeDiff = note.time - currentTime;
        return timeDiff >= -lookBehind && timeDiff <= lookAhead;
      });
    },
    [notes]
  );

  /**
   * カオスイベントを発動
   */
  const triggerChaosEvent = useCallback((eventId: string) => {
    setState((prev) => ({
      ...prev,
      chaosEventActive: true,
      currentChaosEvent: eventId,
    }));
  }, []);

  /**
   * カオスイベントを終了
   */
  const endChaosEvent = useCallback(() => {
    setState((prev) => ({
      ...prev,
      chaosEventActive: false,
      currentChaosEvent: null,
    }));
  }, []);

  /**
   * 精度を計算（パーセント）
   */
  const accuracy = useMemo(() => {
    const total = state.perfectCount + state.greatCount + state.goodCount + state.missCount;
    if (total === 0) return 100;

    // 加重平均で精度を計算
    const weightedScore =
      state.perfectCount * 100 +
      state.greatCount * 80 +
      state.goodCount * 50 +
      state.missCount * 0;

    return Math.floor((weightedScore / total) * 10) / 10;
  }, [state.perfectCount, state.greatCount, state.goodCount, state.missCount]);

  /**
   * ゲーム結果データを取得
   */
  const getScoreData = useCallback((): ScoreData => {
    return {
      score: state.score,
      combo: state.combo,
      maxCombo: state.maxCombo,
      judgments: {
        perfect: state.perfectCount,
        great: state.greatCount,
        good: state.goodCount,
        miss: state.missCount,
      },
    };
  }, [state]);

  /**
   * ゲームが完了したか確認
   */
  const isGameComplete = useMemo(() => {
    return notes.length > 0 && notes.every((note) => note.isHit);
  }, [notes]);

  return {
    // 状態
    ...state,
    notes,
    lastJudgment,
    accuracy,
    isGameComplete,

    // アクション
    initialize,
    recordJudgment,
    recordMiss,
    triggerChaosEvent,
    endChaosEvent,

    // ノーツ取得
    getUnjudgedNotes,
    getVisibleNotes,

    // 結果
    getScoreData,
  };
};

export default useGameState;
