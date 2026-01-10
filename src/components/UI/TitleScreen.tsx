import { motion } from 'framer-motion';
import {
  fadeInFromTop,
  fadeIn,
  scaleIn,
  buttonVariants,
} from '../../constants/animations';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen = ({ onStart }: TitleScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* タイトルロゴ */}
      <motion.h1
        className="text-6xl md:text-8xl font-bold text-yellow-400 mb-4 text-shadow-glow"
        variants={fadeInFromTop}
        initial="hidden"
        animate="visible"
      >
        湯切りますたー
      </motion.h1>

      {/* サブタイトル */}
      <motion.p
        className="text-xl md:text-2xl text-white/80 mb-12"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        〜 ラーメン店主のリズムアクション 〜
      </motion.p>

      {/* 店主プレースホルダー */}
      <motion.div
        className="w-48 h-64 md:w-64 md:h-80 bg-gradient-to-b from-orange-400 to-orange-600 rounded-lg mb-8 flex items-center justify-center cursor-pointer"
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.05 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-white text-center p-4">
          店主画像
          <br />
          （準備中）
        </span>
      </motion.div>

      {/* スタートボタン */}
      <motion.button
        className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white text-2xl font-bold rounded-full shadow-lg"
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        transition={{ delay: 0.8 }}
        onClick={onStart}
      >
        ゲームスタート
      </motion.button>

      {/* 開発中メッセージ */}
      <motion.p
        className="mt-8 text-white/50 text-sm"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1.2 }}
      >
        ※ 現在開発中です。素材が追加されると店主が動き出します！
      </motion.p>
    </div>
  );
};
