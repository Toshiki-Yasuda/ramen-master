import type { ScoreData } from '../types';

interface ResultScreenProps {
  scoreData: ScoreData;
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

export function ResultScreen({ scoreData, onRetry, onBack }: ResultScreenProps) {
  const { rank, label } = getRank(scoreData);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#1a0f0a] overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2d1f15] to-[#1a0f0a]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c94a4a]/10 rounded-full blur-3xl" />

      {/* 店主画像（右側） */}
      <div className="absolute right-0 bottom-0 h-[85%] pointer-events-none">
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
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        {/* タイトル */}
        <h2 className="text-sm tracking-[0.4em] text-[#d4af37] mb-8 uppercase">
          Result
        </h2>

        {/* ランク */}
        <div className="relative mb-6">
          <div className={`text-8xl font-bold bg-gradient-to-b ${rankColors[rank]} bg-clip-text text-transparent`}
               style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}>
            {rank}
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] text-[#fff8e7]/60">
            {label}
          </div>
        </div>

        {/* スコア */}
        <div className="text-4xl font-extralight text-[#fff8e7] mb-8 tracking-wider">
          {scoreData.score.toLocaleString()}
        </div>

        {/* 統計グリッド */}
        <div className="w-full grid grid-cols-2 gap-4 mb-8">
          {/* 最大コンボ */}
          <div className="col-span-2 flex items-center justify-center gap-4 py-2 border-y border-[#d4af37]/20">
            <span className="text-xs tracking-[0.2em] text-[#d4af37]">MAX COMBO</span>
            <span className="text-xl font-light text-[#fff8e7]">{scoreData.maxCombo}</span>
          </div>

          {/* 判定内訳 */}
          <JudgmentStat label="極" value={scoreData.judgments.perfect} color="text-yellow-400" />
          <JudgmentStat label="良" value={scoreData.judgments.great} color="text-green-400" />
          <JudgmentStat label="可" value={scoreData.judgments.good} color="text-blue-400" />
          <JudgmentStat label="失" value={scoreData.judgments.miss} color="text-red-400" />
        </div>

        {/* ボタン */}
        <div className="flex gap-4">
          <button
            onClick={onRetry}
            className="group relative px-8 py-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#c94a4a] to-[#a83232] rounded-sm" />
            <div className="absolute inset-[2px] bg-[#1a0f0a] rounded-sm group-hover:bg-[#2d1f15] transition-colors" />
            <span className="relative text-sm tracking-[0.2em] text-[#c94a4a]">
              RETRY
            </span>
          </button>

          <button
            onClick={onBack}
            className="group relative px-8 py-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8972e] rounded-sm" />
            <div className="absolute inset-[2px] bg-[#1a0f0a] rounded-sm group-hover:bg-[#2d1f15] transition-colors" />
            <span className="relative text-sm tracking-[0.2em] text-[#d4af37]">
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
    <div className="flex items-center justify-between px-4 py-2">
      <span className={`text-xl ${color}`}
            style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}>
        {label}
      </span>
      <span className="text-lg font-light text-[#fff8e7]">{value}</span>
    </div>
  );
}
