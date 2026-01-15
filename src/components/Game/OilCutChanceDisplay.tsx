import { motion, AnimatePresence } from 'framer-motion';

interface OilCutChanceDisplayProps {
  isActive: boolean;
  timeRemaining: number; // 秒
  windowSize: number; // ウィンドウの大きさ（ミリ秒）
}

export const OilCutChanceDisplay: React.FC<OilCutChanceDisplayProps> = ({
  isActive,
  timeRemaining,
  windowSize,
}) => {
  const maxTimeRemaining = windowSize / 1000;
  const progressPercent = Math.max(0, (timeRemaining / maxTimeRemaining) * 100);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* 背景グロー */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-ramen-gold/20 to-transparent"
            animate={{
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />

          {/* メイン表示エリア */}
          <motion.div
            className="relative flex flex-col items-center gap-6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* テキスト: "油切りチャンス!" */}
            <motion.div
              className="text-center"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1],
              }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <div className="text-5xl md:text-6xl font-heading font-bold text-ramen-gold drop-shadow-2xl">
                油切りチャンス！
              </div>
              <motion.div
                className="text-3xl font-heading font-bold text-ramen-orange mt-2 drop-shadow-lg"
                animate={{
                  opacity: [1, 0.7, 1],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                今すぐクリック！
              </motion.div>
            </motion.div>

            {/* 大きな◯ターゲット */}
            <motion.div
              className="relative w-48 h-48 flex items-center justify-center"
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              {/* 外側リング（パルス） */}
              <motion.div
                className="absolute inset-0 border-8 border-ramen-gold rounded-full"
                animate={{
                  scale: [1, 1.3],
                  opacity: [1, 0],
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />

              {/* 中央ターゲット */}
              <motion.div
                className="w-40 h-40 border-8 border-ramen-gold rounded-full flex items-center justify-center bg-gradient-to-br from-ramen-gold/30 to-ramen-gold/10"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255, 200, 0, 0.5)',
                    '0 0 60px rgba(255, 200, 0, 0.9)',
                    '0 0 20px rgba(255, 200, 0, 0.5)',
                  ],
                }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <motion.div
                  className="text-8xl font-bold"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  ⭘
                </motion.div>
              </motion.div>
            </motion.div>

            {/* タイマーバー */}
            <motion.div
              className="w-64 h-4 bg-ramen-brown/40 rounded-full overflow-hidden border-2 border-ramen-gold/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-ramen-gold to-ramen-orange shadow-lg shadow-ramen-gold/50"
                animate={{ width: `${Math.max(0, progressPercent)}%` }}
                transition={{ duration: 0.05, type: 'tween' }}
              />
            </motion.div>

            {/* 残り時間表示 */}
            <motion.div
              className="text-2xl font-heading font-bold text-ramen-gold drop-shadow-lg"
              animate={{
                scale: timeRemaining < 0.1 ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {timeRemaining.toFixed(2)}s
            </motion.div>

            {/* 緊急時の警告（0.1秒以下） */}
            {timeRemaining < 0.1 && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-red-500"
                animate={{
                  scale: [1, 1.2],
                  opacity: [0.8, 0],
                }}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* 隅のカウントダウン表示 */}
          <motion.div
            className="absolute top-12 right-12 text-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-sm text-ramen-cream/60 font-heading">
              油切りまで
            </div>
            <motion.div
              className="text-4xl font-heading font-bold text-ramen-gold drop-shadow-lg"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {timeRemaining.toFixed(1)}s
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
