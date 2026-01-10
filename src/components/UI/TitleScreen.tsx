import { motion } from 'framer-motion';
import { fadeIn } from '../../constants/animations';

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

export const TitleScreen = ({ onStart }: TitleScreenProps) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/ramen-master/images/title.png)',
        }}
      />

      {/* 暗めのオーバーレイ（UIを見やすくするため） */}
      <div className="absolute inset-0 bg-black/30" />

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col items-center justify-end min-h-screen pb-8 md:pb-12">
        {/* スペーサー（タイトル画像の上部を見せるため） */}
        <div className="flex-1" />

        {/* スタートボタン（食券風） */}
        <motion.button
          className="ticket-button ticket-button-red text-xl md:text-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={onStart}
        >
          🍜 ゲームスタート
        </motion.button>

        {/* 開発中メッセージ */}
        <motion.p
          className="mt-6 text-white/80 text-xs md:text-sm text-center max-w-md px-4 drop-shadow-lg"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1 }}
        >
          ※ 現在開発中です
        </motion.p>

        {/* 画面下部の装飾 */}
        <motion.div
          className="mt-4 flex gap-3 text-xl md:text-2xl opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.2 }}
        >
          <span>🍥</span>
          <span>🥢</span>
          <span>🍜</span>
          <span>🥄</span>
          <span>🍥</span>
        </motion.div>
      </div>

      {/* 湯気エフェクト */}
      <SteamEffect />
    </div>
  );
};
