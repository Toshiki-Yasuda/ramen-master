import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../engine';
import { useGameStore } from '../store/gameStore';
import type { Beatmap, JudgmentType, ScoreData } from '../types';

interface GameContainerProps {
  beatmap: Beatmap;
  onBack: () => void;
  onResult: (getScoreData: () => ScoreData) => void;
}

export function GameContainer({ beatmap, onBack, onResult }: GameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  const { score, combo, addScore, resetGame } = useGameStore();

  // 入力ハンドラ
  const handleInput = useCallback(() => {
    engineRef.current?.handleInput();
  }, []);

  // キーボードイベント
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleInput();
      }
      if (e.code === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, onBack]);

  // ゲームエンジン初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 既に初期化済みならスキップ
    if (isInitializedRef.current) return;

    let cancelled = false;

    // キャンバスサイズを設定
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const engine = new GameEngine();
    engineRef.current = engine;

    // 初期化と開始
    const initAndStart = async () => {
      try {
        await engine.init(canvas);
        if (cancelled) {
          engine.dispose();
          return;
        }

        await engine.loadBeatmap(beatmap);
        if (cancelled) {
          engine.dispose();
          return;
        }

        // コールバック設定
        engine.setCallbacks(
          (judgment: JudgmentType) => {
            addScore(judgment);
          },
          () => {
            // ゲーム終了時
            onResult(() => engine.getScoreData());
          }
        );

        // ゲームリセット
        resetGame();

        // ゲーム開始
        engine.start();
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    };

    initAndStart();

    // クリーンアップ
    return () => {
      cancelled = true;
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [beatmap, addScore, resetGame, onResult]);

  // スコア/コンボ更新をエンジンに反映
  useEffect(() => {
    engineRef.current?.updateScore(score, combo);
  }, [score, combo]);

  // リサイズ対応
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-amber-950 relative"
      onClick={handleInput}
      onTouchStart={(e) => {
        e.preventDefault();
        handleInput();
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* 戻るボタン */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBack();
        }}
        className="absolute top-4 left-4 px-4 py-2 text-sm font-bold text-amber-200 bg-amber-800/80 rounded-lg
                   hover:bg-amber-700/80 transition-colors"
      >
        戻る (ESC)
      </button>

      {/* 操作ヒント */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-amber-300/50 text-sm">
        スペースキー または タップで湯切り
      </div>
    </div>
  );
}
