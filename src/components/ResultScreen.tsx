import { Trophy, Target, RotateCcw, Home } from 'lucide-react';
import type { ScoreData } from '../types';

interface ResultScreenProps {
  scoreData: ScoreData;
  onRetry: () => void;
  onBack: () => void;
}

// ランクを計算
function getRank(scoreData: ScoreData): string {
  const total =
    scoreData.judgments.perfect +
    scoreData.judgments.great +
    scoreData.judgments.good +
    scoreData.judgments.miss;

  if (total === 0) return 'C';

  const perfectRate = scoreData.judgments.perfect / total;
  if (perfectRate >= 0.95) return 'S';
  if (perfectRate >= 0.85) return 'A';
  if (perfectRate >= 0.7) return 'B';
  return 'C';
}

const rankColors: Record<string, string> = {
  S: 'text-yellow-400',
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-gray-400',
};

export function ResultScreen({ scoreData, onRetry, onBack }: ResultScreenProps) {
  const rank = getRank(scoreData);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-900 to-amber-950">
      {/* リザルトカード */}
      <div className="bg-amber-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-amber-600/30 max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-amber-200 text-center mb-6 font-serif">
          リザルト
        </h2>

        {/* ランク */}
        <div
          className={`text-8xl font-bold text-center mb-4 ${rankColors[rank]} animate-bounce-slow`}
        >
          {rank}
        </div>

        {/* スコア */}
        <div className="text-4xl font-bold text-amber-200 text-center mb-8">
          {scoreData.score.toLocaleString()}
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300/80">最大コンボ:</span>
            <span className="text-amber-100 font-bold">{scoreData.maxCombo}</span>
          </div>

          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <span className="text-amber-300/80">PERFECT:</span>
            <span className="text-amber-100 font-bold">{scoreData.judgments.perfect}</span>
          </div>

          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-amber-300/80">GREAT:</span>
            <span className="text-amber-100 font-bold">{scoreData.judgments.great}</span>
          </div>

          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-amber-300/80">GOOD:</span>
            <span className="text-amber-100 font-bold">{scoreData.judgments.good}</span>
          </div>

          <div className="flex items-center gap-2 col-span-2">
            <Target className="w-5 h-5 text-gray-400" />
            <span className="text-amber-300/80">MISS:</span>
            <span className="text-amber-100 font-bold">{scoreData.judgments.miss}</span>
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 text-lg font-bold text-white bg-red-600 rounded-lg
                     hover:bg-red-500 hover:scale-105 active:scale-95
                     transition-all duration-150 shadow-lg"
        >
          <RotateCcw className="w-5 h-5" />
          リトライ
        </button>

        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-lg font-bold text-amber-900 bg-amber-200 rounded-lg
                     hover:bg-amber-100 hover:scale-105 active:scale-95
                     transition-all duration-150 shadow-lg"
        >
          <Home className="w-5 h-5" />
          タイトルへ
        </button>
      </div>
    </div>
  );
}
