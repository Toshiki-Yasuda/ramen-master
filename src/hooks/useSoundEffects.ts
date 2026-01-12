/**
 * useSoundEffects - 効果音フック
 *
 * Tone.jsを使用してゲーム用の効果音を合成
 * - タップ音
 * - 判定音（PERFECT, GREAT, GOOD, MISS）
 * - コンボ音
 * - カウントダウン音
 */

import { useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import type { Judgment } from '../types';

interface SoundEffectsOptions {
  enabled?: boolean;
  volume?: number; // -60 to 0 dB
}

export const useSoundEffects = (options: SoundEffectsOptions = {}) => {
  const { enabled = true, volume = -10 } = options;

  // Synthsの参照
  const synthsRef = useRef<{
    tap: Tone.Synth | null;
    judgment: Tone.PolySynth | null;
    combo: Tone.MetalSynth | null;
    countdown: Tone.Synth | null;
    miss: Tone.NoiseSynth | null;
  }>({
    tap: null,
    judgment: null,
    combo: null,
    countdown: null,
    miss: null,
  });

  const isInitializedRef = useRef(false);

  // 初期化
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;

    // タップ音 - 短い打撃音
    synthsRef.current.tap = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
    }).toDestination();
    synthsRef.current.tap.volume.value = volume;

    // 判定音 - メロディックな音
    synthsRef.current.judgment = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.3,
      },
    }).toDestination();
    synthsRef.current.judgment.volume.value = volume - 5;

    // コンボ音 - 金属的な音
    synthsRef.current.combo = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.2,
        release: 0.1,
      },
      harmonicity: 3.1,
      modulationIndex: 16,
      resonance: 2000,
      octaves: 1.5,
    }).toDestination();
    synthsRef.current.combo.frequency.value = 300;
    synthsRef.current.combo.volume.value = volume - 15;

    // カウントダウン音
    synthsRef.current.countdown = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.2,
      },
    }).toDestination();
    synthsRef.current.countdown.volume.value = volume - 5;

    // MISS音 - ノイズ
    synthsRef.current.miss = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0,
        release: 0.1,
      },
    }).toDestination();
    synthsRef.current.miss.volume.value = volume - 10;

    isInitializedRef.current = true;
  }, [volume]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      Object.values(synthsRef.current).forEach((synth) => {
        synth?.dispose();
      });
    };
  }, []);

  // タップ音を再生
  const playTap = useCallback(() => {
    if (!enabled || !synthsRef.current.tap) return;
    synthsRef.current.tap.triggerAttackRelease('C5', '16n');
  }, [enabled]);

  // 判定音を再生
  const playJudgment = useCallback(
    (judgment: Judgment) => {
      if (!enabled) return;

      const synth = synthsRef.current.judgment;
      const miss = synthsRef.current.miss;

      if (!synth || !miss) return;

      switch (judgment) {
        case 'PERFECT':
          // 明るい和音
          synth.triggerAttackRelease(['E5', 'G#5', 'B5'], '8n');
          break;
        case 'GREAT':
          // やや明るい
          synth.triggerAttackRelease(['D5', 'F#5', 'A5'], '8n');
          break;
        case 'GOOD':
          // 普通
          synth.triggerAttackRelease(['C5', 'E5'], '16n');
          break;
        case 'MISS':
          // ノイズ
          miss.triggerAttackRelease('8n');
          break;
      }
    },
    [enabled]
  );

  // コンボ音を再生
  const playCombo = useCallback(
    (comboCount: number) => {
      if (!enabled || !synthsRef.current.combo) return;

      // コンボ数に応じて周波数を変える
      const baseFreq = 200 + Math.min(comboCount, 100) * 5;
      synthsRef.current.combo.frequency.value = baseFreq;
      synthsRef.current.combo.triggerAttackRelease('16n', Tone.now());
    },
    [enabled]
  );

  // カウントダウン音を再生
  const playCountdown = useCallback(
    (count: number) => {
      if (!enabled || !synthsRef.current.countdown) return;

      // 最後のカウント（1）は高い音
      const note = count === 1 ? 'C5' : 'G4';
      synthsRef.current.countdown.triggerAttackRelease(note, '8n');
    },
    [enabled]
  );

  // ゲーム開始音
  const playGameStart = useCallback(() => {
    if (!enabled || !synthsRef.current.judgment) return;

    const synth = synthsRef.current.judgment;
    const now = Tone.now();

    // 上昇するアルペジオ
    synth.triggerAttackRelease('C5', '16n', now);
    synth.triggerAttackRelease('E5', '16n', now + 0.1);
    synth.triggerAttackRelease('G5', '16n', now + 0.2);
    synth.triggerAttackRelease('C6', '8n', now + 0.3);
  }, [enabled]);

  // リザルト音
  const playResult = useCallback(
    (rank: 'S' | 'A' | 'B' | 'C') => {
      if (!enabled || !synthsRef.current.judgment) return;

      const synth = synthsRef.current.judgment;
      const now = Tone.now();

      switch (rank) {
        case 'S':
          // 華やかなファンファーレ
          synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
          synth.triggerAttackRelease(['D5', 'F#5', 'A5'], '8n', now + 0.2);
          synth.triggerAttackRelease(['E5', 'G#5', 'B5'], '8n', now + 0.4);
          synth.triggerAttackRelease(['C6', 'E6', 'G6'], '4n', now + 0.6);
          break;
        case 'A':
          synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
          synth.triggerAttackRelease(['E5', 'G5', 'C6'], '4n', now + 0.2);
          break;
        case 'B':
          synth.triggerAttackRelease(['C5', 'E5'], '8n', now);
          synth.triggerAttackRelease(['D5', 'F5'], '4n', now + 0.15);
          break;
        case 'C':
          synth.triggerAttackRelease(['C4', 'Eb4'], '4n', now);
          break;
      }
    },
    [enabled]
  );

  // ラーメンレベルアップ音
  const playLevelUp = useCallback(() => {
    if (!enabled || !synthsRef.current.judgment || !synthsRef.current.combo) return;

    const synth = synthsRef.current.judgment;
    const metal = synthsRef.current.combo;
    const now = Tone.now();

    // キラキラ音 + 金属音
    synth.triggerAttackRelease(['G5', 'B5', 'D6'], '16n', now);
    synth.triggerAttackRelease(['A5', 'C#6', 'E6'], '8n', now + 0.1);
    metal.triggerAttackRelease('8n', now + 0.15);
  }, [enabled]);

  return {
    initialize,
    playTap,
    playJudgment,
    playCombo,
    playCountdown,
    playGameStart,
    playResult,
    playLevelUp,
  };
};

export default useSoundEffects;
