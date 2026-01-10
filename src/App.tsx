import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from './types';
import { TitleScreen, LoadingScreen } from './components/UI';

// 湯気コンポーネント
const SteamEffect = () => (
  <div className="steam-container">
    <div className="steam" />
    <div className="steam" />
    <div className="steam" />
    <div className="steam" />
    <div className="steam" />
  </div>
);

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

  // ローディング完了後にゲーム画面へ遷移
  useEffect(() => {
    if (gameState === 'loading') {
      const timer = setTimeout(() => {
        setGameState('playing');
      }, 2000); // 2秒後にゲーム画面へ
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // ゲーム開始処理
  const handleStart = useCallback(() => {
    setGameState('loading');
  }, []);

  // タイトルに戻る
  const handleBackToTitle = useCallback(() => {
    setGameState('title');
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
            message="準備中..."
          />
        );

      case 'playing':
        return <PlaceholderScreen name="ゲーム" onBack={handleBackToTitle} />;

      case 'paused':
        return <PlaceholderScreen name="ポーズ" onBack={handleBackToTitle} />;

      case 'result':
        return <PlaceholderScreen name="リザルト" onBack={handleBackToTitle} />;

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
