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
  const maxTimeRemaining = windowSize / 1000; // ミリ秒から秒に変換

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 外側の拡大ターゲット */}
          <motion.div
            className="absolute w-32 h-32 border-4 border-ramen-gold rounded-full"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* 中央の固定ターゲット */}
          <motion.div
            className="absolute w-24 h-24 border-4 border-ramen-gold rounded-full flex items-center justify-center bg-ramen-gold/10"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 20px rgba(255, 200, 0, 0.5)',
                '0 0 40px rgba(255, 200, 0, 0.8)',
                '0 0 20px rgba(255, 200, 0, 0.5)',
              ],
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <div className="text-4xl">⭘</div>
          </motion.div>

          {/* テキスト */}
          <motion.div
            className="absolute top-1/2 transform -translate-y-1/2 text-center pointer-events-none"
            style={{ marginTop: 120 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-3xl font-heading text-ramen-gold font-bold animate-pulse">
              今すぐクリック！
            </div>
            <motion.div
              className="text-2xl text-ramen-cream mt-2"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              油切り準備完了
            </motion.div>
          </motion.div>

          {/* プログレスバー（時間表示） */}
          <motion.div
            className="absolute bottom-1/3 w-40 h-2 bg-ramen-brown/30 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-ramen-gold to-ramen-orange"
              initial={{ width: '100%' }}
              animate={{ width: `${Math.max(0, (timeRemaining / maxTimeRemaining) * 100)}%` }}
              transition={{ duration: 0.05, type: 'tween' }}
            />
          </motion.div>

          {/* 背景のグロー効果 */}
          <motion.div
            className="absolute inset-0 bg-ramen-gold/5 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ width: 200, height: 200 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
