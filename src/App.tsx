import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameState, Beatmap, ScoreData } from './types';
import { TitleScreen, LoadingScreen, ResultScreen } from './components/UI';
import { GameScreen } from './components/Game';
import { SteamEffect } from './components/common';

// プレースホルダー画面（博多ラーメン風）
const PlaceholderScreen = ({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) => (
  <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
    <motion.div
      className="noren-frame text-center px-12 py-8"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <p className="title-text text-3xl md:text-4xl mb-2">{name}画面</p>
      <p className="text-[var(--color-text-muted)] mb-6">（実装予定）</p>
      <span className="text-5xl block mb-4">🍜</span>
    </motion.div>

    <motion.button
      className="ticket-button mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ delay: 0.3 }}
      onClick={onBack}
    >
      タイトルに戻る
    </motion.button>

    <SteamEffect />
  </div>
);

function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [beatmap, setBeatmap] = useState<Beatmap | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);

  // 譜面を読み込み
  const loadBeatmap = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}beatmaps/sample.json`);
      const data = await response.json();

      // レーン割り当て（ローテーション方式）
      // 3レーン: 0=35%, 1=50%, 2=65% (垂直位置)
      const notesWithLanes = data.notes.map((note: any, index: number) => ({
        ...note,
        lane: index % 3, // 0, 1, 2のローテーション
      }));

      setBeatmap({ ...data, notes: notesWithLanes });
      return true;
    } catch (error) {
      console.error('Failed to load beatmap:', error);
      return false;
    }
  }, []);

  // ローディング完了後にゲーム画面へ遷移
  useEffect(() => {
    if (gameState === 'loading') {
      loadBeatmap().then((success) => {
        if (success) {
          setTimeout(() => {
            setGameState('playing');
          }, 1500);
        } else {
          setGameState('title');
        }
      });
    }
  }, [gameState, loadBeatmap]);

  // ゲーム開始処理
  const handleStart = useCallback(() => {
    setGameState('loading');
  }, []);

  // タイトルに戻る
  const handleBackToTitle = useCallback(() => {
    setGameState('title');
    setBeatmap(null);
    setScoreData(null);
  }, []);

  // ゲーム結果を受け取る
  const handleResult = useCallback((scoreDataFn: any) => {
    const data = typeof scoreDataFn === 'function' ? scoreDataFn() : scoreDataFn;
    setScoreData(data);
    setGameState('result');
  }, []);

  // リトライ
  const handleRetry = useCallback(() => {
    setScoreData(null);
    setGameState('playing');
  }, []);

  // 画面のレンダリング
  const renderScreen = () => {
    switch (gameState) {
      case 'title':
        return <TitleScreen onStart={handleStart} />;

      case 'loading':
        return (
          <LoadingScreen
            onBack={handleBackToTitle}
            message="譜面読み込み中..."
          />
        );

      case 'playing':
        if (!beatmap) {
          return <LoadingScreen onBack={handleBackToTitle} message="読み込み中..." />;
        }
        return (
          <GameScreen
            beatmap={beatmap}
            onBack={handleBackToTitle}
            onResult={handleResult}
          />
        );

      case 'paused':
        return <PlaceholderScreen name="ポーズ" onBack={handleBackToTitle} />;

      case 'result':
        if (!scoreData) {
          return <PlaceholderScreen name="リザルト" onBack={handleBackToTitle} />;
        }
        return (
          <ResultScreen
            scoreData={scoreData}
            onRetry={handleRetry}
            onBackToTitle={handleBackToTitle}
          />
        );

      default:
        return <TitleScreen onStart={handleStart} />;
    }
  };

  return (
    <div className="w-full h-full">
      {renderScreen()}
    </div>
  );
}

export default App;
