import { motion } from 'framer-motion';
import {
  fadeInFromTop,
  fadeIn,
  scaleIn,
} from '../../constants/animations';

interface TitleScreenProps {
  onStart: () => void;
}

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

// 提灯コンポーネント
const Lantern = ({ side }: { side: 'left' | 'right' }) => (
  <motion.div
    className={`lantern fixed top-8 ${side === 'left' ? 'left-4 md:left-8' : 'right-4 md:right-8'} text-4xl md:text-6xl`}
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.8 }}
  >
    🏮
  </motion.div>
);

export const TitleScreen = ({ onStart }: TitleScreenProps) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* 背景オーバーレイ（暖かい光） */}
      <div className="absolute inset-0 bg-gradient-radial from-orange-900/20 via-transparent to-transparent pointer-events-none" />

      {/* 提灯 */}
      <Lantern side="left" />
      <Lantern side="right" />

      {/* タイトルロゴ */}
      <motion.h1
        className="title-text text-5xl md:text-7xl lg:text-8xl mb-4 text-center"
        variants={fadeInFromTop}
        initial="hidden"
        animate="visible"
      >
        湯切りますたー
      </motion.h1>

      {/* サブタイトル */}
      <motion.p
        className="subtitle-text text-lg md:text-xl lg:text-2xl mb-8 md:mb-12"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        〜 ラーメン店主のリズムアクション 〜
      </motion.p>

      {/* 店主プレースホルダー（木枠風） */}
      <motion.div
        className="noren-frame w-48 h-64 md:w-56 md:h-72 lg:w-64 lg:h-80 mb-8 flex items-center justify-center cursor-pointer"
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.02 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-center">
          <span className="text-6xl mb-2 block">👨‍🍳</span>
          <span className="text-[var(--color-text-cream)] text-sm">
            店主画像
            <br />
            （準備中）
          </span>
        </div>
      </motion.div>

      {/* スタートボタン（食券風） */}
      <motion.button
        className="ticket-button ticket-button-red"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        onClick={onStart}
      >
        🍜 ゲームスタート
      </motion.button>

      {/* 開発中メッセージ */}
      <motion.p
        className="mt-8 text-[var(--color-text-muted)] text-xs md:text-sm text-center max-w-md"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1.2 }}
      >
        ※ 現在開発中です。素材が追加されると店主が動き出します！
      </motion.p>

      {/* 湯気エフェクト */}
      <SteamEffect />

      {/* 画面下部の装飾 */}
      <motion.div
        className="absolute bottom-4 flex gap-4 text-2xl opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.5 }}
      >
        <span>🍥</span>
        <span>🥢</span>
        <span>🍜</span>
        <span>🥄</span>
        <span>🍥</span>
      </motion.div>
    </div>
  );
};
