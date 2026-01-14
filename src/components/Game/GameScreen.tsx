/**
 * GameScreen - メインゲーム画面
 *
 * 全てのゲームロジックを統合:
 * - Tone.Transportによる時間管理
 * - ゲームループによる更新
 * - 判定ロジック
 * - 状態管理
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import {
  Play,
  Pause,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Target,
} from 'lucide-react';

import type { Beatmap } from '../../types';
import { useToneTransport, useGameLoop, useJudgment, useGameState, useSoundEffects } from '../../hooks';
import { NoteRenderer } from './NoteRenderer';
import { JudgmentDisplay } from './JudgmentDisplay';
import {
  SidePanel,
  SidePanelSection,
  InfoItem,
  LanternDecoration,
  SteamEffect,
} from '../common';

interface GameScreenProps {
  beatmap: Beatmap;
  onBack: () => void;
  onResult: (score: ReturnType<typeof useGameState>['getScoreData']) => void;
}

// コンボ表示
const ComboDisplay = ({ combo }: { combo: number }) => {
  if (combo < 5) return null;

  return (
    <motion.div
      key={combo}
      className="absolute top-8 left-8 text-left pointer-events-none"
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      <div className="text-5xl md:text-6xl font-heading font-bold text-ramen-gold drop-shadow-lg">
        {combo}
      </div>
      <div className="text-lg text-ramen-cream/80 font-heading">COMBO</div>
    </motion.div>
  );
};

export const GameScreen = ({ beatmap, onBack, onResult }: GameScreenProps) => {
  // ゲーム状態
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 現在時刻（描画用） - refで同期的に更新
  const displayTimeRef = useRef(0);

  // Refs
  const hasStartedRef = useRef(false);
  const processedMissIdsRef = useRef<Set<string>>(new Set());

  // Refs for tracking state changes
  const prevComboRef = useRef(0);
  const prevRamenLevelRef = useRef(0);

  // Hooks
  const transport = useToneTransport({ bpm: beatmap.bpm });
  const judgment = useJudgment();
  const gameState = useGameState();
  const soundEffects = useSoundEffects({ enabled: !isMuted });

  // ゲームループ - 統一された時刻で全ての処理を実行
  useGameLoop(
    ({ audioTime }) => {
      if (!isPlaying || isPaused) return;

      // 表示用時刻を同期的に更新（refで遅延なし）
      displayTimeRef.current = audioTime;

      // MISS判定チェック
      const unjudgedNotes = gameState.getUnjudgedNotes();
      const missedIndices = judgment.findMissedNotes(audioTime, unjudgedNotes);

      missedIndices.forEach((localIndex) => {
        // unjudgedNotesのインデックスから元のnotesのインデックスを見つける
        const note = unjudgedNotes[localIndex];

        // 既に処理済みのノーツはスキップ（状態更新タイミングの問題を回避）
        if (processedMissIdsRef.current.has(note.id)) return;
        processedMissIdsRef.current.add(note.id);

        const originalIndex = gameState.notes.findIndex((n) => n.id === note.id);
        if (originalIndex !== -1) {
          gameState.recordMiss(originalIndex);
          // MISS効果音
          soundEffects.playJudgment('MISS');
        }
      });

      // ゲーム終了チェック
      if (gameState.isGameComplete && !hasStartedRef.current) {
        // 少し待ってから結果画面へ
        setTimeout(() => {
          transport.stop();
          setIsPlaying(false);
          onResult(gameState.getScoreData);
        }, 1000);
        hasStartedRef.current = true;
      }
    },
    { enabled: isPlaying && !isPaused }
  );

  // 初期化
  useEffect(() => {
    gameState.initialize(beatmap);
    setIsReady(true);
  }, [beatmap]);

  // コンボ・ラーメンレベル変化時の効果音
  useEffect(() => {
    // コンボマイルストーン（10, 20, 30, 50, 70, 100）
    const comboMilestones = [10, 20, 30, 50, 70, 100];
    if (gameState.combo > prevComboRef.current) {
      if (comboMilestones.includes(gameState.combo)) {
        soundEffects.playCombo(gameState.combo);
      }
    }
    prevComboRef.current = gameState.combo;
  }, [gameState.combo, soundEffects]);

  useEffect(() => {
    // ラーメンレベルアップ
    if (gameState.ramenLevel > prevRamenLevelRef.current) {
      soundEffects.playLevelUp();
    }
    prevRamenLevelRef.current = gameState.ramenLevel;
  }, [gameState.ramenLevel, soundEffects]);

  // 入力を即座に処理する関数
  const processInput = useCallback((inputTime: number) => {
    const unjudgedNotes = gameState.getUnjudgedNotes();
    const result = judgment.judgeNearestNote(inputTime, unjudgedNotes);

    if (result) {
      const [judgmentResult, localIndex] = result;
      const note = unjudgedNotes[localIndex];
      const originalIndex = gameState.notes.findIndex((n) => n.id === note.id);
      if (originalIndex !== -1) {
        gameState.recordJudgment(originalIndex, judgmentResult);
        soundEffects.playJudgment(judgmentResult.judgment);
      }
    }
  }, [gameState, judgment, soundEffects]);

  // キー入力ハンドラ - 入力を即座に処理
  const handleInput = useCallback(() => {
    if (!isPlaying || isPaused) return;

    // タップ音は即座に再生（フィードバック）
    soundEffects.playTap();

    // 入力を即座に処理（レイテンシー削減）
    const inputTime = Tone.Transport.seconds;
    processInput(inputTime);
  }, [isPlaying, isPaused, soundEffects, processInput]);

  // キーボード/タッチ入力のセットアップ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // スペースキー、Enter、または任意のキーで判定
      if (e.code === 'Space' || e.code === 'Enter' || e.key === 'f' || e.key === 'j') {
        e.preventDefault();
        handleInput();
      }
      // ESCでポーズ
      if (e.code === 'Escape') {
        if (isPlaying) {
          togglePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, isPlaying]);

  // ゲーム開始
  const startGame = useCallback(async () => {
    // Tone.js AudioContext開始
    await Tone.start();

    // 効果音初期化
    await soundEffects.initialize();

    // カウントダウン
    setCountdown(3);
    soundEffects.playCountdown(3);
    await new Promise((r) => setTimeout(r, 1000));
    setCountdown(2);
    soundEffects.playCountdown(2);
    await new Promise((r) => setTimeout(r, 1000));
    setCountdown(1);
    soundEffects.playCountdown(1);
    await new Promise((r) => setTimeout(r, 1000));
    setCountdown(null);

    // ゲーム開始
    soundEffects.playGameStart();
    hasStartedRef.current = false;
    processedMissIdsRef.current.clear();
    prevComboRef.current = 0;
    prevRamenLevelRef.current = 0;
    setIsPlaying(true);
    transport.start(beatmap.offset);
  }, [transport, beatmap.offset, soundEffects]);

  // ポーズ切り替え
  const togglePause = useCallback(async () => {
    if (isPaused) {
      // ポーズ解除時は3-2-1カウントダウン
      setCountdown(3);
      soundEffects.playCountdown(3);
      await new Promise((r) => setTimeout(r, 1000));
      setCountdown(2);
      soundEffects.playCountdown(2);
      await new Promise((r) => setTimeout(r, 1000));
      setCountdown(1);
      soundEffects.playCountdown(1);
      await new Promise((r) => setTimeout(r, 1000));
      setCountdown(null);

      transport.resume();
      setIsPaused(false);
    } else {
      transport.pause();
      setIsPaused(true);
    }
  }, [isPaused, transport, soundEffects]);

  // リトライ
  const retry = useCallback(() => {
    transport.stop();
    gameState.initialize(beatmap);
    setIsPlaying(false);
    setIsPaused(false);
    hasStartedRef.current = false;
    processedMissIdsRef.current.clear();
    displayTimeRef.current = 0;
    startGame();
  }, [transport, gameState, beatmap, startGame]);

  // ミュート切り替え
  const toggleMute = useCallback(() => {
    Tone.Destination.mute = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // 進行率
  const progressPercent = beatmap.notes.length > 0
    ? ((gameState.notesHit + gameState.missCount) / beatmap.notes.length) * 100
    : 0;

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-ramen-dark">
      {/* 3カラムレイアウト */}
      <div className="relative z-10 flex w-full min-h-screen">
        {/* 左サイドパネル */}
        <SidePanel position="left">
          <LanternDecoration />

          <SidePanelSection title="スコア">
            <div className="text-center">
              <div className="text-3xl font-heading font-bold text-ramen-gold transition-all duration-100">
                {gameState.score.toLocaleString()}
              </div>
            </div>
          </SidePanelSection>

          <SidePanelSection title="統計">
            <div className="space-y-1">
              <InfoItem
                label="PERFECT"
                value={gameState.perfectCount.toString()}
                icon={<Target className="w-full h-full text-yellow-400" />}
              />
              <InfoItem
                label="GREAT"
                value={gameState.greatCount.toString()}
                icon={<Target className="w-full h-full text-green-400" />}
              />
              <InfoItem
                label="GOOD"
                value={gameState.goodCount.toString()}
                icon={<Target className="w-full h-full text-blue-400" />}
              />
              <InfoItem
                label="MISS"
                value={gameState.missCount.toString()}
                icon={<Target className="w-full h-full text-gray-400" />}
              />
            </div>
          </SidePanelSection>

          <div className="flex-1" />

          <SidePanelSection className="border-t border-ramen-gold/20">
            <div className="space-y-2">
              <button
                className="ticket-button w-full text-sm"
                onClick={togglePause}
                disabled={!isPlaying}
              >
                {isPaused ? <Play className="w-4 h-4 inline mr-1" /> : <Pause className="w-4 h-4 inline mr-1" />}
                {isPaused ? '再開' : 'ポーズ'}
              </button>
              <button
                className="ticket-button w-full text-sm"
                onClick={retry}
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                リトライ
              </button>
            </div>
          </SidePanelSection>
        </SidePanel>

        {/* メインゲームエリア */}
        <main
          className="relative flex-1 flex flex-col overflow-hidden cursor-pointer"
          onClick={handleInput}
          onTouchStart={handleInput}
        >
          {/* 背景 */}
          <div className="absolute inset-0 bg-gradient-to-b from-ramen-dark via-ramen-brown/20 to-ramen-dark" />

          {/* ノーツ描画エリア */}
          <div className="relative flex-1">
            <NoteRenderer
              notes={gameState.notes}
              currentTime={displayTimeRef.current}
              lookAhead={2.5}
              lookBehind={0.3}
              judgmentLinePosition={0.15}
            />

            {/* 判定表示 */}
            <JudgmentDisplay result={gameState.lastJudgment} />

            {/* モバイル用統計オーバーレイ（サイドパネル非表示時） */}
            <div className="lg:hidden absolute top-4 left-0 right-0 flex justify-between px-4 pointer-events-none">
              {/* 左: スコア */}
              <div className="glass-panel-dark px-3 py-2 rounded-lg">
                <div className="text-xs text-ramen-cream/60 font-heading">SCORE</div>
                <div className="text-lg font-heading font-bold text-ramen-gold">
                  {gameState.score.toLocaleString()}
                </div>
              </div>

              {/* 右: 精度 */}
              <div className="glass-panel-dark px-3 py-2 rounded-lg">
                <div className="text-xs text-ramen-cream/60 font-heading">精度</div>
                <div className="text-lg font-heading text-ramen-cream">
                  {gameState.accuracy.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* モバイル用コンボ表示（サイドパネル非表示時） */}
            <div className="lg:hidden absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
              {gameState.combo >= 5 && (
                <motion.div
                  key={gameState.combo}
                  className="text-center"
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="text-3xl font-heading font-bold text-ramen-gold drop-shadow-lg">
                    {gameState.combo}
                  </div>
                  <div className="text-xs text-ramen-cream/80 font-heading">COMBO</div>
                </motion.div>
              )}
            </div>
          </div>

          {/* プログレスバー */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-ramen-dark/80 z-20">
            <motion.div
              className="h-full bg-gradient-to-r from-ramen-gold to-ramen-orange shadow-lg shadow-ramen-gold/50"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* カウントダウン */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black/50"
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

          {/* スタート前の画面 */}
          {!isPlaying && !countdown && isReady && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-3xl md:text-4xl font-heading text-ramen-cream mb-4">
                {beatmap.title}
              </h2>
              <p className="text-ramen-cream/70 mb-8 text-center">
                タップまたはキーボードでプレイ
                <br />
                <span className="text-sm text-ramen-gold/80">
                  ( Space / F / J / Enter )
                </span>
              </p>
              <button
                className="ticket-button ticket-button-red text-xl"
                onClick={startGame}
              >
                <Play className="w-6 h-6 inline mr-2" />
                スタート
              </button>
            </motion.div>
          )}

          {/* ポーズ画面 */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-4xl font-heading text-ramen-cream mb-8">ポーズ</h2>
                <div className="space-y-4">
                  <button
                    className="ticket-button ticket-button-red text-lg w-48"
                    onClick={togglePause}
                  >
                    <Play className="w-5 h-5 inline mr-2" />
                    再開
                  </button>
                  <button
                    className="ticket-button text-lg w-48"
                    onClick={retry}
                  >
                    <RotateCcw className="w-5 h-5 inline mr-2" />
                    リトライ
                  </button>
                  <button
                    className="ticket-button text-lg w-48"
                    onClick={onBack}
                  >
                    <Home className="w-5 h-5 inline mr-2" />
                    タイトルへ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* 右サイドパネル */}
        <SidePanel position="right">
          <LanternDecoration />

          <SidePanelSection title="コンボ">
            <div className="text-center">
              <div className="text-4xl font-heading font-bold text-ramen-gold">
                {gameState.combo}
              </div>
              <div className="text-sm text-ramen-cream/60">
                最大: {gameState.maxCombo}
              </div>
            </div>
          </SidePanelSection>

          <SidePanelSection title="ラーメン">
            <div className="text-center">
              <div className="text-6xl mb-2">
                {['🍜', '🍜', '🍥', '🍥', '🥢', '🥢', '👨‍🍳'][gameState.ramenLevel] || '🍜'}
              </div>
              <div className="text-sm text-ramen-cream/60">
                Lv.{gameState.ramenLevel + 1}
              </div>
            </div>
          </SidePanelSection>

          <SidePanelSection title="精度">
            <div className="text-center">
              <div className="text-2xl font-heading text-ramen-cream">
                {gameState.accuracy.toFixed(1)}%
              </div>
            </div>
          </SidePanelSection>

          <div className="flex-1" />

          <SidePanelSection className="border-t border-ramen-gold/20">
            <div className="flex justify-center gap-4">
              <button
                className="p-2 rounded-full bg-ramen-brown/30 hover:bg-ramen-brown/50 transition-colors"
                onClick={toggleMute}
                aria-label={isMuted ? "音声をオンにする" : "音声をミュートする"}
                aria-pressed={isMuted}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-ramen-cream" />
                ) : (
                  <Volume2 className="w-5 h-5 text-ramen-cream" />
                )}
              </button>
              <button
                className="p-2 rounded-full bg-ramen-brown/30 hover:bg-ramen-brown/50 transition-colors"
                onClick={onBack}
                aria-label="タイトル画面に戻る"
              >
                <Home className="w-5 h-5 text-ramen-cream" />
              </button>
            </div>
          </SidePanelSection>
        </SidePanel>
      </div>

      {/* 湯気エフェクト */}
      <SteamEffect particleCount={8} />
    </div>
  );
};

export default GameScreen;
