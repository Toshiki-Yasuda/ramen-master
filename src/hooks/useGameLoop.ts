/**
 * useGameLoop - requestAnimationFrameベースのゲームループHook
 *
 * 音ゲーにおける重要ポイント:
 * - フレームレート非依存（delta timeベース）
 * - 音声時刻との同期
 * - タブがバックグラウンドになった時の処理
 */

import { useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';

// ゲームループコールバックの型
interface GameLoopCallbackParams {
  // 前フレームからの経過時間（秒）
  deltaTime: number;
  // 現在のタイムスタンプ（requestAnimationFrameから）
  timestamp: number;
  // 現在の音声時刻（Tone.Transport）
  audioTime: number;
  // ゲーム開始からの経過時間（秒）
  elapsedTime: number;
}

type GameLoopCallback = (params: GameLoopCallbackParams) => void;

interface UseGameLoopOptions {
  // ループ有効/無効
  enabled?: boolean;
  // 最大delta time（大きすぎるdeltaを制限）
  maxDeltaTime?: number;
}

export const useGameLoop = (
  callback: GameLoopCallback,
  options: UseGameLoopOptions = {}
) => {
  const { enabled = true, maxDeltaTime = 0.1 } = options; // 100ms以上のdeltaは制限

  // Refs
  const callbackRef = useRef<GameLoopCallback>(callback);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  // callbackの更新を追跡（毎フレーム最新のcallbackを使用）
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  /**
   * ゲームループの1フレーム
   */
  const loop = useCallback(
    (timestamp: number) => {
      if (!isRunningRef.current) return;

      // 初回フレームの処理
      if (lastTimestampRef.current === 0) {
        lastTimestampRef.current = timestamp;
        startTimeRef.current = timestamp;
      }

      // delta time計算（ミリ秒→秒）
      let deltaTime = (timestamp - lastTimestampRef.current) / 1000;

      // 大きすぎるdeltaを制限（タブ復帰時など）
      if (deltaTime > maxDeltaTime) {
        deltaTime = maxDeltaTime;
      }

      // 経過時間（秒）
      const elapsedTime = (timestamp - startTimeRef.current) / 1000;

      // 音声時刻を取得
      const audioTime = Tone.Transport.seconds;

      // コールバック実行
      callbackRef.current({
        deltaTime,
        timestamp,
        audioTime,
        elapsedTime,
      });

      lastTimestampRef.current = timestamp;

      // 次フレームをリクエスト
      animationFrameRef.current = requestAnimationFrame(loop);
    },
    [maxDeltaTime]
  );

  /**
   * ゲームループ開始
   */
  const start = useCallback(() => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    lastTimestampRef.current = 0; // リセット
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  /**
   * ゲームループ停止
   */
  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * ゲームループ一時停止
   */
  const pause = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * ゲームループ再開
   */
  const resume = useCallback(() => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    // 最後のタイムスタンプをリセット（一時停止中の時間をスキップ）
    lastTimestampRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  /**
   * リセット（経過時間をリセット）
   */
  const reset = useCallback(() => {
    startTimeRef.current = performance.now();
    lastTimestampRef.current = 0;
  }, []);

  // enabledが変わったときの処理
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, start, stop]);

  // Visibility API: タブがバックグラウンドになった時の処理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // タブが非表示になったら一時停止
        pause();
      } else if (enabled) {
        // タブが表示されたら再開
        resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, pause, resume]);

  return {
    start,
    stop,
    pause,
    resume,
    reset,
    isRunning: isRunningRef.current,
  };
};

export default useGameLoop;
