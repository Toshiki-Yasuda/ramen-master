import { useState, useCallback, useEffect } from 'react';
import { TitleScreen, ResultScreen, GameContainer } from './components';
import { useGameStore } from './store/gameStore';
import type { GameState, Beatmap, ScoreData } from './types';

// ローディング画面
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-900 to-amber-950">
      <div className="text-4xl mb-4 animate-bounce">🍜</div>
      <p className="text-amber-200 text-xl">{message}</p>
    </div>
  );
}

function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [beatmap, setBeatmap] = useState<Beatmap | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);

  const { setGameState: setStoreGameState, resetGame, checkAndSaveHighScore, highScore, isNewRecord } = useGameStore();

  // 譜面を読み込み
  const loadBeatmap = useCallback(async () => {
    try {
      const response = await fetch('/ramen-master/beatmaps/sample.json');
      if (!response.ok) {
        throw new Error('Beatmap not found');
      }
      const data = await response.json();
      setBeatmap(data);
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
            setStoreGameState('playing');
          }, 500);
        } else {
          setGameState('title');
          setStoreGameState('title');
        }
      });
    }
  }, [gameState, loadBeatmap, setStoreGameState]);

  // ゲーム開始処理
  const handleStart = useCallback(() => {
    setGameState('loading');
    setStoreGameState('loading');
  }, [setStoreGameState]);

  // タイトルに戻る
  const handleBackToTitle = useCallback(() => {
    setGameState('title');
    setStoreGameState('title');
    setBeatmap(null);
    setScoreData(null);
    resetGame();
  }, [setStoreGameState, resetGame]);

  // ゲーム結果を受け取る
  const handleResult = useCallback(
    (getScoreData: () => ScoreData) => {
      setScoreData(getScoreData());
      checkAndSaveHighScore(); // ハイスコアチェック
      setGameState('result');
      setStoreGameState('result');
    },
    [setStoreGameState, checkAndSaveHighScore]
  );

  // リトライ
  const handleRetry = useCallback(() => {
    setScoreData(null);
    resetGame();
    setGameState('playing');
    setStoreGameState('playing');
  }, [resetGame, setStoreGameState]);

  // 画面のレンダリング
  const renderScreen = () => {
    switch (gameState) {
      case 'title':
        return <TitleScreen onStart={handleStart} highScore={highScore} />;

      case 'loading':
        return <LoadingScreen message="譜面読み込み中..." />;

      case 'playing':
        if (!beatmap) {
          return <LoadingScreen message="読み込み中..." />;
        }
        return (
          <GameContainer
            beatmap={beatmap}
            onBack={handleBackToTitle}
            onResult={handleResult}
          />
        );

      case 'result':
        if (!scoreData) {
          return <LoadingScreen message="集計中..." />;
        }
        return (
          <ResultScreen
            scoreData={scoreData}
            highScore={highScore}
            isNewRecord={isNewRecord}
            onRetry={handleRetry}
            onBack={handleBackToTitle}
          />
        );

      default:
        return <TitleScreen onStart={handleStart} />;
    }
  };

  return <div className="w-full h-full">{renderScreen()}</div>;
}

export default App;
