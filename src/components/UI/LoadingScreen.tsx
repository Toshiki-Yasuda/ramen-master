import { motion } from 'framer-motion';
import { SteamEffect } from '../common';

interface LoadingScreenProps {
  onBack?: () => void;
  message?: string;
}

export const LoadingScreen = ({
  onBack,
  message = '読み込み中...',
}: LoadingScreenProps) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* 回転するラーメン */}
      <motion.div
        className="text-7xl md:text-8xl mb-6"
        animate={{
          rotate: 360,
          y: [0, -10, 0],
        }}
        transition={{
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
          y: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        🍜
      </motion.div>

      {/* ローディングメッセージ */}
      <motion.p
        className="subtitle-text text-xl md:text-2xl mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>

      {/* プログレスバー（食券風） */}
      <div className="w-64 md:w-80 h-4 bg-[var(--color-wood)] rounded border-2 border-[var(--color-wood-light)] overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--color-secondary)] via-[var(--color-accent)] to-[var(--color-secondary)]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ローディングテキストアニメーション */}
      <motion.div
        className="mt-6 flex gap-2 text-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {['🥢', '🍥', '🥚', '🍖', '🌿'].map((emoji, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>

      {/* 戻るボタン（オプション） */}
      {onBack && (
        <motion.button
          className="ticket-button mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 1 }}
          onClick={onBack}
        >
          タイトルに戻る
        </motion.button>
      )}

      {/* 湯気エフェクト */}
      <SteamEffect particleCount={5} />
    </div>
  );
};
