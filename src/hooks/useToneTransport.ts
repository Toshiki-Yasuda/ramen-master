/**
 * useToneTransport - Tone.Transportを使ったゲーム時間管理Hook
 *
 * Tone.Transportの特徴:
 * - BPMベースの時間管理
 * - 高精度なスケジューリング
 * - 一時停止/再開/シーク対応
 *
 * 注意: 時刻の取得はuseGameLoop経由で行う（RAFと同期するため）
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface TransportState {
  isStarted: boolean;
  isPaused: boolean;
  bpm: number;
}

interface TransportOptions {
  bpm?: number;
  timeSignature?: [number, number]; // [分子, 分母]
}

// スケジュールされたイベントのコールバック型
type ScheduleCallback = (time: number) => void;

export const useToneTransport = (options: TransportOptions = {}) => {
  const { bpm = 120, timeSignature = [4, 4] } = options;

  // 状態（positionとbeatはuseGameLoopで管理するため削除）
  const [state, setState] = useState<TransportState>({
    isStarted: false,
    isPaused: false,
    bpm,
  });

  // スケジュールIDを追跡
  const scheduleIdsRef = useRef<number[]>([]);

  /**
   * 初期化
   */
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.timeSignature = timeSignature;

    return () => {
      // クリーンアップ：スケジュールされたイベントをすべてクリア
      scheduleIdsRef.current.forEach((id) => Tone.Transport.clear(id));
      scheduleIdsRef.current = [];
    };
  }, []);

  /**
   * BPM変更
   */
  const setBPM = useCallback((newBpm: number): void => {
    Tone.Transport.bpm.value = newBpm;
    setState((prev) => ({ ...prev, bpm: newBpm }));
  }, []);

  /**
   * Transport開始
   */
  const start = useCallback(async (offset = 0): Promise<void> => {
    await Tone.start(); // AudioContext開始（ユーザーインタラクション後に必要）

    Tone.Transport.start('+0.1', offset); // 100ms後に開始（スケジューリングエラー防止）

    setState((prev) => ({
      ...prev,
      isStarted: true,
      isPaused: false,
    }));
    // RAFループは削除 - 時刻はuseGameLoopで取得
  }, []);

  /**
   * Transport停止
   */
  const stop = useCallback((): void => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;

    setState((prev) => ({
      ...prev,
      isStarted: false,
      isPaused: false,
    }));
  }, []);

  /**
   * Transport一時停止
   */
  const pause = useCallback((): void => {
    Tone.Transport.pause();

    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  /**
   * Transport再開
   */
  const resume = useCallback((): void => {
    Tone.Transport.start();

    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));
    // RAFループは削除 - 時刻はuseGameLoopで取得
  }, []);

  /**
   * 指定位置にシーク
   */
  const seek = useCallback((position: number): void => {
    Tone.Transport.seconds = position;
  }, []);

  /**
   * イベントをスケジュール
   * 指定した時刻にコールバックを実行
   */
  const schedule = useCallback((callback: ScheduleCallback, time: number): number => {
    const id = Tone.Transport.schedule((audioTime) => {
      callback(audioTime);
    }, time);

    scheduleIdsRef.current.push(id);
    return id;
  }, []);

  /**
   * 繰り返しイベントをスケジュール
   */
  const scheduleRepeat = useCallback(
    (callback: ScheduleCallback, interval: number, startTime = 0): number => {
      const id = Tone.Transport.scheduleRepeat(
        (audioTime) => {
          callback(audioTime);
        },
        interval,
        startTime
      );

      scheduleIdsRef.current.push(id);
      return id;
    },
    []
  );

  /**
   * 一度だけ実行されるイベントをスケジュール
   */
  const scheduleOnce = useCallback((callback: ScheduleCallback, time: number): number => {
    const id = Tone.Transport.scheduleOnce((audioTime) => {
      callback(audioTime);
    }, time);

    scheduleIdsRef.current.push(id);
    return id;
  }, []);

  /**
   * スケジュールをクリア
   */
  const clearSchedule = useCallback((id: number): void => {
    Tone.Transport.clear(id);
    scheduleIdsRef.current = scheduleIdsRef.current.filter((i) => i !== id);
  }, []);

  /**
   * すべてのスケジュールをクリア
   */
  const clearAllSchedules = useCallback((): void => {
    scheduleIdsRef.current.forEach((id) => Tone.Transport.clear(id));
    scheduleIdsRef.current = [];
  }, []);

  /**
   * 現在のTransport時刻を取得（高精度）
   */
  const getTime = useCallback((): number => {
    return Tone.Transport.seconds;
  }, []);

  /**
   * 秒をBPMベースの拍に変換
   */
  const secondsToBeats = useCallback(
    (seconds: number): number => {
      return seconds * (bpm / 60);
    },
    [bpm]
  );

  /**
   * 拍を秒に変換
   */
  const beatsToSeconds = useCallback(
    (beats: number): number => {
      return beats / (bpm / 60);
    },
    [bpm]
  );

  /**
   * Tone.Drawを使った描画同期
   * 音声イベントと視覚的な更新を同期させる
   */
  const scheduleDraw = useCallback((callback: () => void, time: number): void => {
    Tone.Draw.schedule(callback, time);
  }, []);

  return {
    // 状態
    ...state,

    // 基本操作
    start,
    stop,
    pause,
    resume,
    seek,
    setBPM,

    // 時刻取得
    getTime,

    // スケジューリング
    schedule,
    scheduleRepeat,
    scheduleOnce,
    clearSchedule,
    clearAllSchedules,
    scheduleDraw,

    // ユーティリティ
    secondsToBeats,
    beatsToSeconds,
  };
};

export default useToneTransport;
