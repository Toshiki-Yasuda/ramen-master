import { motion } from 'framer-motion';
import type { CookingPhase } from '../../types';

interface ChefAnimatorProps {
  phase: CookingPhase;
  currentTime: number;
}

// 各段階のアニメーション定義
const phaseAnimations: Record<CookingPhase, any> = {
  soup: {
    scale: [1, 1.08, 0.98, 1.05, 1],
    opacity: [0.8, 1, 0.9],
    rotateZ: [-2, 2, -1, 0],
    transition: { duration: 2.5, repeat: 3, ease: 'easeInOut' },
  },
  oil_cut: {
    rotateZ: [-8, 8, -6, 6, -4, 4, 0],
    y: [-5, 5, -5, 5, 0],
    opacity: [0.9, 1, 0.95],
    transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
  },
  noodles: {
    y: [0, -8, -2, -6, 0],
    x: [-2, 2, -1, 0],
    opacity: [0.9, 1, 0.9],
    transition: { duration: 1.4, repeat: 3, ease: 'easeInOut' },
  },
  topping: {
    scale: [1, 1.04, 1.02, 1.03, 1],
    rotateZ: [-1, 1, -0.5, 0],
    opacity: [0.85, 1, 0.95],
    transition: { duration: 1.2, repeat: 2, ease: 'easeInOut' },
  },
  complete: {
    scale: [1, 1.1, 1.05, 1.15, 1],
    opacity: 1,
    rotateZ: [0, -5, 5, -3, 0],
    transition: { duration: 0.8 },
  },
};

const phaseTexts: Record<CookingPhase, string> = {
  soup: 'スープを投入中...',
  oil_cut: '油切り準備中...',
  noodles: '麺を盛り付け中...',
  topping: 'トッピング中...',
  complete: 'ラーメン完成！',
};

const phaseEmojis: Record<CookingPhase, string> = {
  soup: '🍜',
  oil_cut: '🥘',
  noodles: '🍜',
  topping: '🍜',
  complete: '✨',
};

export const ChefAnimator: React.FC<ChefAnimatorProps> = ({
  phase,
  currentTime,
}) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 店主キャラクター（プレースホルダー） */}
      <motion.div
        className="text-9xl"
        {...phaseAnimations[phase]}
      >
        👨‍🍳
      </motion.div>

      {/* フェーズテキスト */}
      <motion.div
        className="text-2xl font-heading text-ramen-gold"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        key={phase}
      >
        {phaseTexts[phase]}
      </motion.div>

      {/* ラーメン状態表示 */}
      <motion.div
        className="text-6xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: 2 }}
      >
        {phaseEmojis[phase]}
      </motion.div>

      {/* 時刻表示（デバッグ用） */}
      <div className="text-xs text-ramen-cream/50 mt-4">
        {currentTime.toFixed(1)}s / {phase}
      </div>
    </motion.div>
  );
};
