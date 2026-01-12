import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameState, Beatmap, ScoreData } from './types';
import { TitleScreen, LoadingScreen } from './components/UI';
import { GameScreen } from './components/Game';
import { Home, RotateCcw, Trophy, Target } from 'lucide-react';

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

// リザルト画面
const ResultScreen = ({
  scoreData,
  onRetry,
  onBack,
}: {
  scoreData: ScoreData;
  onRetry: () => void;
  onBack: () => void;
}) => {
  // ランク計算
  const getRank = () => {
    const total = scoreData.judgments.perfect + scoreData.judgments.great +
      scoreData.judgments.good + scoreData.judgments.miss;
    if (total === 0) return 'C';
    const perfectRate = scoreData.judgments.perfect / total;
    if (perfectRate >= 0.95) return 'S';
    if (perfectRate >= 0.85) return 'A';
    if (perfectRate >= 0.70) return 'B';
    return 'C';
  };

  const rank = getRank();
  const rankColors: Record<string, string> = {
    S: 'text-yellow-400',
    A: 'text-green-400',
    B: 'text-blue-400',
    C: 'text-gray-400',
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-ramen-dark">
      <motion.div
        className="noren-frame text-center px-12 py-8 max-w-md w-full mx-4"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <h2 className="title-text text-3xl md:text-4xl mb-6">リザルト</h2>

        {/* ランク */}
        <motion.div
          className={`text-8xl font-heading font-bold ${rankColors[rank]} mb-4`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          {rank}
        </motion.div>

        {/* スコア */}
        <div className="text-4xl font-heading text-ramen-gold mb-6">
          {scoreData.score.toLocaleString()}
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-left">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-ramen-gold" />
            <span className="text-ramen-cream/80">最大コンボ:</span>
            <span className="text-ramen-cream font-bold">{scoreData.maxCombo}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <span className="text-ramen-cream/80">PERFECT:</span>
            <span className="text-ramen-cream font-bold">{scoreData.judgments.perfect}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-ramen-cream/80">GREAT:</span>
            <span className="text-ramen-cream font-bold">{scoreData.judgments.great}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-ramen-cream/80">GOOD:</span>
            <span className="text-ramen-cream font-bold">{scoreData.judgments.good}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Target className="w-5 h-5 text-gray-400" />
            <span className="text-ramen-cream/80">MISS:</span>
            <span className="text-ramen-cream font-bold">{scoreData.judgments.miss}</span>
          </div>
        </div>
      </motion.div>

      {/* ボタン */}
      <motion.div
        className="flex gap-4 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button className="ticket-button ticket-button-red" onClick={onRetry}>
          <RotateCcw className="w-5 h-5 inline mr-2" />
          リトライ
        </button>
        <button className="ticket-button" onClick={onBack}>
          <Home className="w-5 h-5 inline mr-2" />
          タイトルへ
        </button>
      </motion.div>

      <SteamEffect />
    </div>
  );
};

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
      const response = await fetch('/ramen-master/beatmaps/sample.json');
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
  const handleResult = useCallback((getScoreData: () => ScoreData) => {
    setScoreData(getScoreData());
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
            onBack={handleBackToTitle}
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
