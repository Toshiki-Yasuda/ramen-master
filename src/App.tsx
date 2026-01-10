import { useState, useCallback, useEffect } from 'react';
import type { GameState } from './types';
import { TitleScreen, LoadingScreen } from './components/UI';

// プレースホルダー画面（タイトルに戻るボタン付き）
const PlaceholderScreen = ({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="text-center text-white">
      <p className="text-2xl mb-4">{name}画面</p>
      <p className="text-gray-400 mb-8">（実装予定）</p>
      <button
        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
        onClick={onBack}
      >
        タイトルに戻る
      </button>
    </div>
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
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-800">
      {renderScreen()}
    </div>
  );
}

export default App;
