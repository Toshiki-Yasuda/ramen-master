import { motion } from 'framer-motion';
import { Home, RotateCcw } from 'lucide-react';
import type { ScoreData } from '../../types';

interface ResultScreenProps {
  scoreData: ScoreData & { ramenLevel?: number; accuracy?: number };
  onBackToTitle: () => void;
  onRetry: () => void;
}

// ランク判定
const getRank = (accuracy: number): string => {
  if (accuracy >= 99) return 'SS';
  if (accuracy >= 95) return 'S';
  if (accuracy >= 90) return 'A';
  if (accuracy >= 80) return 'B';
  if (accuracy >= 70) return 'C';
  return 'D';
};

const getRankColor = (rank: string): string => {
  switch (rank) {
    case 'SS':
    case 'S':
      return 'text-yellow-300';
    case 'A':
      return 'text-emerald-300';
    case 'B':
      return 'text-blue-300';
    case 'C':
      return 'text-orange-300';
    default:
      return 'text-gray-300';
  }
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
  scoreData,
  onBackToTitle,
  onRetry,
}) => {
  const accuracy = scoreData.accuracy || 0;
  const rank = getRank(accuracy);
  const ramenLevel = scoreData.ramenLevel || 0;

  const ramenEmojis = ['🍜', '🍜', '🥚', '🥚', '🥢', '🥢', '👨‍🍳'];
  const ramenNames = [
    '素ラーメン',
    'ネギラーメン',
    'チャーシュー麺',
    '味玉ラーメン',
    '背脂ラーメン',
    '全部乗せ',
    '店主スペシャル',
  ];

  return (
    <motion.div
      className="relative w-full h-screen overflow-hidden bg-ramen-dark flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-ramen-dark via-ramen-brown/30 to-ramen-dark" />

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-6 text-center">
        {/* リザルト大タイトル */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-ramen-gold mb-4">
            ラーメン完成！
          </h1>
          <p className="text-xl text-ramen-cream/70">
            {ramenEmojis[ramenLevel]} {ramenNames[ramenLevel]}
          </p>
        </motion.div>

        {/* ランク表示 */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className={`text-9xl font-heading font-bold ${getRankColor(rank)}`}>
            {rank}
          </div>
          <p className="text-lg text-ramen-cream/70">ランク</p>
        </motion.div>

        {/* スコアと精度 */}
        <motion.div
          className="grid grid-cols-2 gap-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {/* スコア */}
          <div className="glass-panel-dark px-6 py-4 rounded-lg">
            <div className="text-sm text-ramen-cream/60 font-heading mb-2">
              スコア
            </div>
            <div className="text-4xl font-heading font-bold text-ramen-gold">
              {scoreData.score.toLocaleString()}
            </div>
          </div>

          {/* 精度 */}
          <div className="glass-panel-dark px-6 py-4 rounded-lg">
            <div className="text-sm text-ramen-cream/60 font-heading mb-2">
              精度
            </div>
            <div className="text-4xl font-heading font-bold text-ramen-cream">
              {accuracy.toFixed(1)}%
            </div>
          </div>
        </motion.div>

        {/* 判定統計 */}
        <motion.div
          className="grid grid-cols-4 gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="glass-panel-dark px-3 py-3 rounded-lg text-center">
            <div className="text-yellow-400 text-2xl font-bold">
              {scoreData.judgments.perfect}
            </div>
            <div className="text-xs text-ramen-cream/60 mt-1 font-heading">
              PERFECT
            </div>
          </div>

          <div className="glass-panel-dark px-3 py-3 rounded-lg text-center">
            <div className="text-green-400 text-2xl font-bold">
              {scoreData.judgments.great}
            </div>
            <div className="text-xs text-ramen-cream/60 mt-1 font-heading">
              GREAT
            </div>
          </div>

          <div className="glass-panel-dark px-3 py-3 rounded-lg text-center">
            <div className="text-blue-400 text-2xl font-bold">
              {scoreData.judgments.good}
            </div>
            <div className="text-xs text-ramen-cream/60 mt-1 font-heading">
              GOOD
            </div>
          </div>

          <div className="glass-panel-dark px-3 py-3 rounded-lg text-center">
            <div className="text-gray-400 text-2xl font-bold">
              {scoreData.judgments.miss}
            </div>
            <div className="text-xs text-ramen-cream/60 mt-1 font-heading">
              MISS
            </div>
          </div>
        </motion.div>

        {/* コンボ */}
        <motion.div
          className="glass-panel-dark px-8 py-4 rounded-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="text-sm text-ramen-cream/60 font-heading mb-1">
            最大コンボ
          </div>
          <div className="text-3xl font-heading font-bold text-ramen-gold">
            {scoreData.maxCombo}
          </div>
        </motion.div>

        {/* ボタン */}
        <motion.div
          className="flex gap-4 mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <button
            className="ticket-button ticket-button-red px-8 py-3 flex items-center gap-2"
            onClick={onRetry}
          >
            <RotateCcw className="w-5 h-5" />
            もう一度
          </button>
          <button
            className="ticket-button px-8 py-3 flex items-center gap-2"
            onClick={onBackToTitle}
          >
            <Home className="w-5 h-5" />
            タイトルへ
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
