import type { Variants } from 'framer-motion';

// 共通アニメーション定義

// フェードイン + 上から降りてくる
export const fadeInFromTop: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

// フェードイン
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

// 下からフェードイン
export const fadeInFromBottom: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

// スケールイン（バウンス）
export const scaleIn: Variants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: { type: 'spring', stiffness: 200 },
  },
};

// ホバー時の拡大
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

// タップ時の縮小
export const tapScale = {
  scale: 0.95,
};

// ボタン用アニメーション
export const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
  hover: { scale: 1.1 },
  tap: { scale: 0.95 },
};

// 回転アニメーション（ローディング用）
export const spinAnimation = {
  rotate: 360,
  transition: { duration: 1, repeat: Infinity, ease: 'linear' },
};

// カオスイベント用アニメーション
export const chaosAnimations: Record<string, Variants> = {
  fadeInScale: {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300 },
    },
    exit: { scale: 0, opacity: 0 },
  },
  spinIn: {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
    exit: { scale: 0, rotate: 180, opacity: 0 },
  },
  bounceIn: {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 10 },
    },
    exit: { y: 100, opacity: 0 },
  },
  slideInFromRight: {
    hidden: { x: 300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
    exit: { x: -300, opacity: 0 },
  },
  floatIn: {
    hidden: { y: -50, opacity: 0 },
    visible: {
      y: [0, -10, 0],
      opacity: 1,
      transition: {
        y: { repeat: Infinity, duration: 2 },
        opacity: { duration: 0.3 },
      },
    },
    exit: { y: -50, opacity: 0 },
  },
  dropIn: {
    hidden: { y: -200, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
    exit: { y: 200, opacity: 0 },
  },
};

// 店主アニメーション
export const chefAnimations: Variants = {
  idle: {
    y: [0, -5, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  yukigiri: {
    rotate: [0, -15, 15, -10, 10, 0],
    y: [0, -20, 0],
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  perfect: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.2 },
  },
  miss: {
    x: [0, -10, 10, -5, 5, 0],
    transition: { duration: 0.3 },
  },
};
