import type { ScoreData, HighScoreData } from '../types';

interface ResultScreenProps {
  scoreData: ScoreData;
  highScore: HighScoreData | null;
  isNewRecord: boolean;
  onRetry: () => void;
  onBack: () => void;
}

// ランクを計算
function getRank(scoreData: ScoreData): { rank: string; label: string } {
  const total =
    scoreData.judgments.perfect +
    scoreData.judgments.great +
    scoreData.judgments.good +
    scoreData.judgments.miss;

  if (total === 0) return { rank: 'C', label: '修行中' };

  const perfectRate = scoreData.judgments.perfect / total;
  if (perfectRate >= 0.95) return { rank: '極', label: 'MASTER' };
  if (perfectRate >= 0.85) return { rank: '匠', label: 'EXPERT' };
  if (perfectRate >= 0.7) return { rank: '職', label: 'SKILLED' };
  return { rank: '習', label: 'TRAINING' };
}

const rankColors: Record<string, string> = {
  '極': 'from-yellow-400 to-amber-500',
  '匠': 'from-green-400 to-emerald-500',
  '職': 'from-blue-400 to-cyan-500',
  '習': 'from-gray-400 to-gray-500',
};

export function ResultScreen({ scoreData, highScore, isNewRecord, onRetry, onBack }: ResultScreenProps) {
  const { rank, label } = getRank(scoreData);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#1a0f0a] overflow-hidden px-4">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2d1f15] to-[#1a0f0a]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[450px] md:w-[600px] h-[150px] sm:h-[225px] md:h-[300px] bg-[#c94a4a]/10 rounded-full blur-3xl" />

      {/* 店主画像（右側）- 大画面のみ表示 */}
      <div className="hidden md:block absolute right-0 bottom-0 h-[70%] lg:h-[85%] pointer-events-none">
        <img
          src="/ramen-master/images/chef/serve.png"
          alt="店主"
          className="h-full w-auto object-contain opacity-90"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm sm:max-w-md px-4 sm:px-6">
        {/* NEW RECORD バッジ */}
        {isNewRecord && (
          <div className="absolute -top-2 sm:top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full animate-pulse">
            <span className="text-xs sm:text-sm font-bold text-[#1a0f0a] tracking-wider">NEW RECORD!</span>
          </div>
        )}

        {/* タイトル */}
        <h2 className="text-xs sm:text-sm tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37] mb-4 sm:mb-6 md:mb-8 uppercase mt-6 sm:mt-8">
          Result
        </h2>

        {/* ランク */}
        <div className="relative mb-4 sm:mb-6">
          <div className={`text-5xl sm:text-7xl md:text-8xl font-bold bg-gradient-to-b ${rankColors[rank]} bg-clip-text text-transparent`}
               style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}>
            {rank}
          </div>
          <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] text-[#fff8e7]/60">
            {label}
          </div>
        </div>

        {/* スコア */}
        <div className="text-2xl sm:text-3xl md:text-4xl font-extralight text-[#fff8e7] mb-2 sm:mb-3 tracking-wider">
          {scoreData.score.toLocaleString()}
        </div>

        {/* ハイスコア */}
        {highScore && (
          <div className="text-xs sm:text-sm text-[#d4af37]/70 mb-4 sm:mb-6 tracking-wider">
            HIGH SCORE: {highScore.score.toLocaleString()}
          </div>
        )}

        {/* 統計グリッド */}
        <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {/* 最大コンボ */}
          <div className="col-span-2 flex items-center justify-center gap-3 sm:gap-4 py-2 border-y border-[#d4af37]/20">
            <span className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] text-[#d4af37]">MAX COMBO</span>
            <span className="text-lg sm:text-xl font-light text-[#fff8e7]">{scoreData.maxCombo}</span>
          </div>

          {/* 判定内訳 */}
          <JudgmentStat label="極" value={scoreData.judgments.perfect} color="text-yellow-400" />
          <JudgmentStat label="良" value={scoreData.judgments.great} color="text-green-400" />
          <JudgmentStat label="可" value={scoreData.judgments.good} color="text-blue-400" />
          <JudgmentStat label="失" value={scoreData.judgments.miss} color="text-red-400" />
        </div>

        {/* ボタン */}
        <div className="flex gap-3 sm:gap-4">
          <button
            onClick={onRetry}
            className="group relative px-5 sm:px-8 py-2.5 sm:py-3 overflow-hidden active:scale-95 transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#c94a4a] to-[#a83232] rounded-sm" />
            <div className="absolute inset-[2px] bg-[#1a0f0a] rounded-sm group-hover:bg-[#2d1f15] transition-colors" />
            <span className="relative text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] text-[#c94a4a]">
              RETRY
            </span>
          </button>

          <button
            onClick={onBack}
            className="group relative px-5 sm:px-8 py-2.5 sm:py-3 overflow-hidden active:scale-95 transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8972e] rounded-sm" />
            <div className="absolute inset-[2px] bg-[#1a0f0a] rounded-sm group-hover:bg-[#2d1f15] transition-colors" />
            <span className="relative text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] text-[#d4af37]">
              TITLE
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 判定統計コンポーネント
function JudgmentStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
      <span className={`text-base sm:text-xl ${color}`}
            style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}>
        {label}
      </span>
      <span className="text-sm sm:text-lg font-light text-[#fff8e7]">{value}</span>
    </div>
  );
}
