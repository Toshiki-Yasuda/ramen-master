import { useState, useCallback } from 'react';
import type { GameState } from './types';
import { TitleScreen, LoadingScreen } from './components/UI';

// プレースホルダー画面
const PlaceholderScreen = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center text-white">
      <p className="text-2xl mb-4">{name}画面</p>
      <p className="text-gray-400">（実装予定）</p>
    </div>
  </div>
);

function App() {
  const [gameState, setGameState] = useState<GameState>('title');

  // ゲーム開始処理
  const handleStart = useCallback(() => {
    setGameState('loading');
    // TODO: 実際のローディング処理を追加
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
        return <PlaceholderScreen name="ゲーム" />;

      case 'paused':
        return <PlaceholderScreen name="ポーズ" />;

      case 'result':
        return <PlaceholderScreen name="リザルト" />;

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
