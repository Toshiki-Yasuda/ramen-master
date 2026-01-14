/**
 * JudgmentDisplay - 判定結果の表示コンポーネント
 *
 * PERFECT/GREAT/GOOD/MISS + FAST/SLOWを表示
 * アニメーション付きで一定時間後にフェードアウト
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { DetailedJudgmentResult } from '../../hooks/useJudgment';

interface JudgmentDisplayProps {
  result: DetailedJudgmentResult | null;
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

  const colors = JUDGMENT_COLORS[result.judgment];
  const timingColor = TIMING_COLORS[result.timing];

  // PERFECTでJUSTの場合はタイミング表示しない
  const showTiming =
    result.judgment !== 'MISS' &&
    !(result.judgment === 'PERFECT' && result.timing === 'JUST');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${result.judgment}-${result.timeDiff}-${Date.now()}`}
        className="absolute left-1/4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.5, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: -20 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {/* 判定テキスト */}
        <motion.div
          className={`
            px-6 py-2 rounded-lg font-heading text-2xl md:text-3xl font-bold
            bg-gradient-to-r ${colors.bg} ${colors.text}
            shadow-lg ${colors.shadow}
          `}
          initial={{ rotateX: -30 }}
          animate={{ rotateX: 0 }}
          transition={{ duration: 0.2 }}
        >
          {result.judgment}
        </motion.div>

        {/* FAST/SLOW表示 */}
        {showTiming && (
          <motion.div
            className={`mt-1 text-sm font-heading ${timingColor} drop-shadow-lg`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {result.timing}
          </motion.div>
        )}

        {/* スコア表示 */}
        {result.score > 0 && (
          <motion.div
            className="mt-2 text-lg font-heading text-ramen-gold drop-shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            +{result.score}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default JudgmentDisplay;
