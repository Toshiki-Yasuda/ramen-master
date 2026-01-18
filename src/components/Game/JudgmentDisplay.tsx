/**
 * JudgmentDisplay - 判定結果の表示コンポーネント
 *
 * PERFECT/GREAT/GOOD/MISS + FAST/SLOWを表示
 * アニメーション付きで一定時間後にフェードアウト
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Judgment } from '../../types';

interface DetailedJudgmentResult {
  judgment: Judgment;
  score: number;
  delta: number;
}

interface JudgmentDisplayProps {
  result: DetailedJudgmentResult | Judgment | null;
}

// 判定ごとの色設定
const JUDGMENT_COLORS = {
  PERFECT: {
    bg: 'from-yellow-400 to-orange-500',
    text: 'text-white',
    shadow: 'shadow-yellow-500/50',
  },
  GREAT: {
    bg: 'from-green-400 to-emerald-500',
    text: 'text-white',
    shadow: 'shadow-green-500/50',
  },
  GOOD: {
    bg: 'from-blue-400 to-cyan-500',
    text: 'text-white',
    shadow: 'shadow-blue-500/50',
  },
  MISS: {
    bg: 'from-gray-500 to-gray-600',
    text: 'text-white',
    shadow: 'shadow-gray-500/50',
  },
} as const;

// タイミング表示の色
const TIMING_COLORS = {
  FAST: 'text-cyan-300',
  SLOW: 'text-orange-300',
  JUST: 'text-yellow-300',
} as const;

export const JudgmentDisplay = ({ result }: JudgmentDisplayProps) => {
  if (!result) return null;

  // 文字列の場合はオブジェクトに変換
  const normalizedResult = typeof result === 'string'
    ? { judgment: result, score: 0, delta: 0, timing: 'JUST' as const }
    : result;

  const colors = JUDGMENT_COLORS[normalizedResult.judgment];
  const timingColor = 'timing' in normalizedResult ? TIMING_COLORS[normalizedResult.timing] : TIMING_COLORS.JUST;

  // PERFECTでJUSTの場合はタイミング表示しない
  const showTiming =
    normalizedResult.judgment !== 'MISS' &&
    !('timing' in normalizedResult && normalizedResult.judgment === 'PERFECT' && normalizedResult.timing === 'JUST');

  // PERFECT時の特別なアニメーション
  const isPerfect = normalizedResult.judgment === 'PERFECT';

  return (
    <AnimatePresence mode="wait">
      {/* 背景グロー効果（PERFECT時のみ） */}
      {isPerfect && (
        <motion.div
          className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}

      <motion.div
        key={`${normalizedResult.judgment}-${normalizedResult.delta}-${Date.now()}`}
        className="absolute left-1/4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.3, x: -30, rotateZ: -15 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: 0,
          rotateZ: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.6,
          x: 30,
          y: -50,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* 判定テキスト - 強化アニメーション */}
        <motion.div
          className={`
            px-8 py-3 rounded-lg font-heading text-3xl md:text-4xl font-bold
            bg-gradient-to-r ${colors.bg} ${colors.text}
            shadow-2xl ${colors.shadow}
            relative overflow-hidden
          `}
          initial={{ rotateX: -45 }}
          animate={{
            rotateX: 0,
            boxShadow: isPerfect
              ? ['0 0 10px rgba(255,215,0,0.5)', '0 0 30px rgba(255,215,0,0.8)', '0 0 10px rgba(255,215,0,0.5)']
              : ['0 20px 25px -5px rgba(0,0,0,0.1)', '0 20px 25px -5px rgba(0,0,0,0.2)', '0 20px 25px -5px rgba(0,0,0,0.1)']
          }}
          transition={{
            duration: 0.3,
            boxShadow: { duration: 0.6, times: [0, 0.5, 1] }
          }}
        >
          {normalizedResult.judgment}
        </motion.div>

        {/* FAST/SLOW表示 */}
        {showTiming && (
          <motion.div
            className={`mt-2 text-sm font-heading ${timingColor} drop-shadow-lg`}
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.2 }}
          >
            {'timing' in normalizedResult ? normalizedResult.timing : 'JUST'}
          </motion.div>
        )}

        {/* スコア表示 - ポップアップ効果 */}
        {normalizedResult.score > 0 && (
          <motion.div
            className="mt-3 text-2xl md:text-3xl font-heading text-ramen-gold drop-shadow-lg font-bold"
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{
              opacity: [1, 0.8, 1],
              scale: [1.2, 1, 1.1],
              y: 0
            }}
            transition={{ delay: 0.12, duration: 0.4 }}
          >
            +{normalizedResult.score}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default JudgmentDisplay;
