/**
 * GameScreen - 調理型リズムゲーム
 *
 * ゲームロジック:
 * 1. BPMに合わせて調理が自動進行
 * 2. 油切りタイミングで ◯ が表示
 * 3. タイミング内でクリック/タップで判定
 * 4. スコア・コンボ・ラーメン進化を管理
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import { Home } from 'lucide-react';

import type { Beatmap, CookingPhase } from '../../types';
import { useGamePlayState } from '../../hooks/useGamePlayState';
import { useOilCutJudgment } from '../../hooks/useOilCutJudgment';
import { useChaosEventTrigger } from '../../hooks/useChaosEventTrigger';
import { useAudioManager } from '../../hooks/useAudioManager';
import { ChefAnimator } from './ChefAnimator';
import { OilCutChanceDisplay } from './OilCutChanceDisplay';
import { CookingProgressBar } from './CookingProgressBar';
import { RamenDisplay } from './RamenDisplay';
import { ChaosEventDisplay } from './ChaosEventDisplay';
import { JudgmentDisplay } from './JudgmentDisplay';
import { SteamEffect } from '../common';

interface GameScreenProps {
  beatmap: Beatmap;
  onBack: () => void;
  onResult: (score: any) => void;
}

// 調理段階のタイムテーブル
const COOKING_STAGES = {
  soup: { start: 0, end: 4 },
  oil_cut: { start: 4, end: 12 },
  noodles: { start: 12, end: 16 },
  topping: { start: 16, end: 20 },
  complete: { start: 20, end: 24 },
};

export const GameScreen = ({ beatmap, onBack, onResult }: GameScreenProps) => {
  // ゲーム状態
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CookingPhase>('soup');

  // 時刻管理
  const displayTimeRef = useRef(0);
  const lastProcessedOilCutRef = useRef(new Set<string>());

  // ゲーム状態管理
  const gameState = useGamePlayState(beatmap);
  const judgment = useOilCutJudgment();
  const chaos = useChaosEventTrigger();
  const audio = useAudioManager();

  // BGM・SE読み込み
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // BGM読み込み
        const bgmPath = beatmap.bgm
          ? `/audio/bgm/${beatmap.bgm}`
          : '/audio/bgm/bgm_ramen.mp3';
        await audio.loadBGM(bgmPath);

        // SE読み込み
        const seFiles = {
          perfect: '/audio/se/perfect.mp3',
          great: '/audio/se/great.mp3',
          good: '/audio/se/good.mp3',
          miss: '/audio/se/miss.mp3',
          tap: '/audio/se/tap.mp3',
          combo: '/audio/se/combo.mp3',
        };
        await audio.loadAllSE(seFiles);
      } catch (error) {
        console.warn('音声ファイルの読み込みに失敗しました:', error);
      }
    };

    initializeAudio();
  }, [beatmap.bgm, audio.loadBGM, audio.loadAllSE]);

  // 未判定の油切りチャンスを取得
  const getUnjudgedOilCuts = useCallback(() => {
    return (beatmap.oilCutChances || []).filter(
      (oilCut) => !lastProcessedOilCutRef.current.has(oilCut.id)
    );
  }, [beatmap]);

  // 現在の調理段階を取得
  const getCurrentPhase = useCallback((time: number): CookingPhase => {
    if (time < COOKING_STAGES.soup.end) return 'soup';
    if (time < COOKING_STAGES.oil_cut.end) return 'oil_cut';
    if (time < COOKING_STAGES.noodles.end) return 'noodles';
    if (time < COOKING_STAGES.topping.end) return 'topping';
    return 'complete';
  }, []);

  // 次の油切りチャンスを取得
  const getNextOilCutChance = useCallback(() => {
    const unjudged = getUnjudgedOilCuts();
    const currentTime = displayTimeRef.current;
    return unjudged.find(
      (oilCut) =>
        oilCut.time >= currentTime &&
        oilCut.time <= currentTime + 0.5  // 表示期間を0.5秒に延長
    );
  }, [getUnjudgedOilCuts]);

  // 入力処理
  const handleInput = useCallback(() => {
    if (!isPlaying) return;

    const currentTime = Tone.Transport.seconds;
    const nextOilCut = getNextOilCutChance();

    if (nextOilCut) {
      const judgmentResult = judgment.judgeOilCut(
        currentTime,
        nextOilCut.time
      );

      lastProcessedOilCutRef.current.add(nextOilCut.id);
      gameState.recordJudgment(judgmentResult);

      // SE再生
      if (judgmentResult !== 'MISS') {
        const seType = judgmentResult === 'PERFECT'
          ? 'perfect'
          : judgmentResult === 'GREAT'
            ? 'great'
            : 'good';
        audio.playSE(seType as any);
      } else {
        audio.playSE('miss');
      }

      console.log('判定:', judgmentResult);
    }
  }, [isPlaying, getNextOilCutChance, judgment, gameState, audio]);

  // ゲームループ
  useEffect(() => {
    if (!isPlaying) return;

    const updateGame = () => {
      const audioTime = Tone.Transport.seconds;
      displayTimeRef.current = audioTime;

      gameState.updateTime(audioTime);

      // 調理段階を更新
      const phase = getCurrentPhase(audioTime);
      if (phase !== currentPhase) {
        setCurrentPhase(phase);
      }

      // ゲーム終了チェック
      const duration = beatmap.duration || 12; // デフォルト12秒
      if (audioTime >= duration && isPlaying) {
        Tone.Transport.stop();
        audio.stop();
        setIsPlaying(false);
        onResult(gameState.getScoreData());
      }

      // MISSになるべき油切りをチェック
      const missedIds = judgment.findMissedOilCuts(
        audioTime,
        getUnjudgedOilCuts()
      );
      missedIds.forEach((id) => {
        lastProcessedOilCutRef.current.add(id);
        gameState.recordJudgment('MISS');
      });

      // カオスイベント判定
      chaos.checkAndTriggerEvent(gameState.score);

      requestAnimationFrame(updateGame);
    };

    const frameId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(frameId);
  }, [
    isPlaying,
    gameState,
    judgment,
    currentPhase,
    beatmap.duration,
    onResult,
    getCurrentPhase,
    getUnjudgedOilCuts,
  ]);

  // キーボード入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  // ゲーム開始
  const startGame = useCallback(async () => {
    await Tone.start();

    setCountdown(3);
    await new Promise((r) => setTimeout(r, 1000));
    setCountdown(2);
    await new Promise((r) => setTimeout(r, 1000));
    setCountdown(1);
    await new Promise((r) => setTimeout(r, 1000));
    setCountdown(null);

    gameState.reset();
    lastProcessedOilCutRef.current.clear();
    setCurrentPhase('soup');
    setIsPlaying(true);
    Tone.Transport.bpm.value = beatmap.bpm;

    // BGM再生開始
    if (audio.isLoaded) {
      audio.play(0);
    }

    Tone.Transport.start('+0.1');
  }, [beatmap.bpm, gameState, audio]);

  // 初期化
  useEffect(() => {
    setIsReady(true);
  }, []);

  // 次の油切りチャンス
  const nextOilCut = getNextOilCutChance();
  const timeToNextOilCut = nextOilCut
    ? Math.max(0, nextOilCut.time - displayTimeRef.current)
    : 0;

  const phaseProgress =
    (displayTimeRef.current - COOKING_STAGES[currentPhase].start) /
    (COOKING_STAGES[currentPhase].end - COOKING_STAGES[currentPhase].start);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-ramen-dark flex flex-col">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-ramen-dark via-ramen-brown/20 to-ramen-dark" />

      {/* メインコンテンツ */}
      <div className="relative z-10 flex-1 flex flex-col p-6">
        {/* 上部: 進捗とスコア */}
        <div className="flex-0 mb-6">
          <CookingProgressBar
            currentPhase={currentPhase}
            phaseProgress={Math.min(1, Math.max(0, phaseProgress))}
            score={gameState.score}
            combo={gameState.combo}
            accuracy={gameState.accuracy}
          />
        </div>

        {/* 中央: 店主アニメーション */}
        <div className="flex-1 flex items-center justify-center">
          <ChefAnimator phase={currentPhase} currentTime={displayTimeRef.current} />
        </div>

        {/* 判定表示 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <JudgmentDisplay result={gameState.lastJudgment} />
        </div>

        {/* 油切りチャンス表示 */}
        <OilCutChanceDisplay
          isActive={nextOilCut !== undefined && nextOilCut.time - displayTimeRef.current <= 0.5}
          timeRemaining={timeToNextOilCut}
          windowSize={500}
        />

        {/* カオスイベント表示 */}
        <ChaosEventDisplay
          eventType={chaos.currentEvent}
          isActive={chaos.isActive}
        />
      </div>

      {/* 下部: ラーメン進化表示 + コントロール */}
      <div className="flex-0 flex justify-between items-end gap-4 p-4">
        {/* 左: ラーメン進化表示 */}
        <div className="w-40">
          <RamenDisplay level={gameState.ramenLevel} maxCombo={gameState.combo} />
        </div>

        {/* 右: コントロール */}
        <button
          className="p-2 rounded-full bg-ramen-brown/30 hover:bg-ramen-brown/50 transition-colors"
          onClick={() => {
            audio.stop();
            Tone.Transport.stop();
            onBack();
          }}
          aria-label="タイトル画面に戻る"
        >
          <Home className="w-5 h-5 text-ramen-cream" />
        </button>
      </div>

      {/* カウントダウン */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key={countdown}
              className="text-8xl font-heading font-bold text-ramen-gold"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* スタート画面 */}
      {!isPlaying && !countdown && isReady && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-3xl md:text-4xl font-heading text-ramen-cream mb-4">
            {beatmap.title}
          </h2>
          <p className="text-ramen-cream/70 mb-8 text-center">
            リズムに合わせて油切りを成功させよう！
            <br />
            <span className="text-sm text-ramen-gold/80">
              ( Space / Click / Tap )
            </span>
          </p>
          <button
            className="ticket-button ticket-button-red text-xl px-8 py-4"
            onClick={startGame}
          >
            スタート
          </button>
        </motion.div>
      )}

      {/* 湯気エフェクト */}
      <SteamEffect particleCount={8} />
    </div>
  );
};

export default GameScreen;
