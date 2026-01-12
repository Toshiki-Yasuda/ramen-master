/**
 * useAudioManager - Tone.jsを使った音声管理Hook
 *
 * 音ゲーにおける重要ポイント:
 * - Web Audio APIのクロックを使用（高精度）
 * - BGMとSEの分離管理
 * - オフセット調整機能
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';

// SE種類の定義
export type SEType = 'tap' | 'perfect' | 'great' | 'good' | 'miss' | 'combo';

interface AudioManagerState {
  isLoaded: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface AudioManagerOptions {
  // 音声オフセット（ms）- 正の値で音が早く、負の値で音が遅く聞こえる補正
  audioOffset?: number;
  // 映像オフセット（ms）- 正の値でノーツが早く、負の値でノーツが遅く表示される補正
  visualOffset?: number;
}

export const useAudioManager = (options: AudioManagerOptions = {}) => {
  const { audioOffset = 0, visualOffset = 0 } = options;

  // 状態
  const [state, setState] = useState<AudioManagerState>({
    isLoaded: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  // Refs（再レンダリングを避けるため）
  const playerRef = useRef<Tone.Player | null>(null);
  const sePlayersRef = useRef<Map<SEType, Tone.Player>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  /**
   * BGMを読み込む
   */
  const loadBGM = useCallback(async (url: string): Promise<void> => {
    // 既存のプレイヤーをクリーンアップ
    if (playerRef.current) {
      playerRef.current.dispose();
    }

    try {
      // Tone.jsのコンテキストを開始（ユーザーインタラクション後に必要）
      await Tone.start();

      // 新しいプレイヤーを作成
      const player = new Tone.Player({
        url,
        onload: () => {
          setState((prev) => ({
            ...prev,
            isLoaded: true,
            duration: player.buffer.duration,
          }));
        },
      }).toDestination();

      playerRef.current = player;
    } catch (error) {
      console.error('BGM読み込みエラー:', error);
      throw error;
    }
  }, []);

  /**
   * SEを読み込む
   */
  const loadSE = useCallback(async (type: SEType, url: string): Promise<void> => {
    try {
      await Tone.start();

      const player = new Tone.Player({
        url,
      }).toDestination();

      // 読み込み完了を待つ
      await new Promise<void>((resolve) => {
        player.buffer.onload = () => resolve();
        if (player.loaded) resolve();
      });

      sePlayersRef.current.set(type, player);
    } catch (error) {
      console.error(`SE読み込みエラー (${type}):`, error);
    }
  }, []);

  /**
   * 複数のSEを一括読み込み
   */
  const loadAllSE = useCallback(
    async (seMap: Record<SEType, string>): Promise<void> => {
      const loadPromises = Object.entries(seMap).map(([type, url]) =>
        loadSE(type as SEType, url)
      );
      await Promise.all(loadPromises);
    },
    [loadSE]
  );

  /**
   * BGM再生開始
   */
  const play = useCallback((startTime = 0): void => {
    if (!playerRef.current || !state.isLoaded) {
      console.warn('BGMが読み込まれていません');
      return;
    }

    // オフセットを適用（秒単位に変換）
    const offsetSeconds = audioOffset / 1000;

    playerRef.current.start(Tone.now(), startTime + offsetSeconds);
    setState((prev) => ({ ...prev, isPlaying: true }));

    // 現在時刻の更新ループを開始
    const updateTime = () => {
      if (playerRef.current && state.isPlaying) {
        // Tone.Transportの時間を使用（高精度）
        const currentTime = Tone.Transport.seconds;
        setState((prev) => ({ ...prev, currentTime }));
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };
    updateTime();
  }, [state.isLoaded, audioOffset]);

  /**
   * BGM停止
   */
  const stop = useCallback((): void => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, []);

  /**
   * BGM一時停止
   */
  const pause = useCallback((): void => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  /**
   * SE再生（低遅延）
   */
  const playSE = useCallback((type: SEType): void => {
    const player = sePlayersRef.current.get(type);
    if (player) {
      // 即座に再生（Tone.now()を使用）
      player.start(Tone.now());
    }
  }, []);

  /**
   * 現在の音声時刻を取得（高精度）
   * 判定に使用するメインの時刻取得関数
   */
  const getCurrentTime = useCallback((): number => {
    if (!playerRef.current) return 0;

    // Web Audio APIのコンテキスト時刻を使用
    // これが最も正確な時刻
    return Tone.getContext().currentTime;
  }, []);

  /**
   * ゲーム判定用の補正済み時刻を取得
   * 映像オフセットを考慮した時刻
   */
  const getGameTime = useCallback((): number => {
    const currentTime = getCurrentTime();
    // 映像オフセットを適用（秒単位に変換）
    return currentTime - visualOffset / 1000;
  }, [getCurrentTime, visualOffset]);

  /**
   * クリーンアップ
   */
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      sePlayersRef.current.forEach((player) => player.dispose());
      sePlayersRef.current.clear();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    // 状態
    ...state,

    // BGM操作
    loadBGM,
    play,
    stop,
    pause,

    // SE操作
    loadSE,
    loadAllSE,
    playSE,

    // 時刻取得
    getCurrentTime,
    getGameTime,
  };
};

export default useAudioManager;
