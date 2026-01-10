import { motion } from 'framer-motion';
import { spinAnimation } from '../../constants/animations';

interface LoadingScreenProps {
  onBack?: () => void;
  message?: string;
}

export const LoadingScreen = ({
  onBack,
  message = '読み込み中...',
}: LoadingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* 回転するラーメン */}
      <motion.div className="text-6xl mb-4" animate={spinAnimation}>
        🍜
      </motion.div>

      {/* ローディングメッセージ */}
      <p className="text-white text-xl mb-2">{message}</p>

      {/* プログレスバー（将来の拡張用） */}
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mt-4">
        <motion.div
          className="h-full bg-yellow-400"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* 戻るボタン（オプション） */}
      {onBack && (
        <button
          className="mt-8 px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          onClick={onBack}
        >
          タイトルに戻る
        </button>
      )}
    </div>
  );
};
