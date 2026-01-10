import { motion } from 'framer-motion';
import { fadeIn } from '../../constants/animations';
import {
  SidePanel,
  SidePanelSection,
  MenuItem,
  InfoItem,
  LanternDecoration,
} from '../common';

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
    <div className="steam" />
  </div>
);

export const TitleScreen = ({ onStart }: TitleScreenProps) => {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-ramen-dark">
      {/* 3カラムレイアウト */}
      <div className="relative z-10 flex w-full min-h-screen">
        {/* 左サイドパネル */}
        <SidePanel position="left">
          <LanternDecoration />

          <SidePanelSection title="メニュー">
            <div className="space-y-2">
              <MenuItem
                icon="🎮"
                label="ゲームスタート"
                onClick={onStart}
              />
              <MenuItem
                icon="⚙️"
                label="設定"
                disabled
              />
              <MenuItem
                icon="📊"
                label="ランキング"
                disabled
              />
              <MenuItem
                icon="❓"
                label="遊び方"
                disabled
              />
            </div>
          </SidePanelSection>

          <div className="flex-1" />

          <SidePanelSection className="border-t border-ramen-gold/20">
            <div className="text-center text-ramen-cream/50 text-xs">
              <p>🍜 湯切りますたー 🍜</p>
              <p className="mt-1">ver 0.1.0</p>
            </div>
          </SidePanelSection>
        </SidePanel>

        {/* メインコンテンツ（中央） */}
        <main className="relative flex-1 flex flex-col items-center justify-end pb-8 md:pb-12 overflow-hidden">
          {/* 背景画像（中央カラムのみ） */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/ramen-master/images/title.png)',
            }}
          />
          {/* 暗めのオーバーレイ */}
          <div className="absolute inset-0 bg-black/20" />

          {/* スペーサー（タイトル画像の上部を見せるため） */}
          <div className="relative z-10 flex-1" />

          {/* スタートボタン（食券風）- モバイル用 */}
          <motion.button
            className="relative z-10 ticket-button ticket-button-red text-xl md:text-2xl lg:hidden"
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
            className="relative z-10 mt-6 text-white/80 text-xs md:text-sm text-center max-w-md px-4 drop-shadow-lg"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1 }}
          >
            ※ 現在開発中です
          </motion.p>

          {/* 画面下部の装飾 */}
          <motion.div
            className="relative z-10 mt-4 flex gap-3 text-xl md:text-2xl opacity-70"
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
        </main>

        {/* 右サイドパネル */}
        <SidePanel position="right">
          <LanternDecoration />

          <SidePanelSection title="ゲーム情報">
            <div className="space-y-1">
              <InfoItem label="最高スコア" value="---" icon="🏆" />
              <InfoItem label="プレイ回数" value="0" icon="🎮" />
              <InfoItem label="最大コンボ" value="---" icon="🔥" />
            </div>
          </SidePanelSection>

          <SidePanelSection title="難易度">
            <div className="space-y-2">
              <MenuItem
                icon="🌶️"
                label="ピリ辛"
                active
              />
              <MenuItem
                icon="🌶️🌶️"
                label="激辛"
                disabled
              />
              <MenuItem
                icon="🌶️🌶️🌶️"
                label="地獄"
                disabled
              />
            </div>
          </SidePanelSection>

          <div className="flex-1" />

          <SidePanelSection className="border-t border-ramen-gold/20">
            <div className="text-center">
              <motion.div
                className="text-3xl"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                🍜
              </motion.div>
              <p className="text-ramen-gold/70 text-xs mt-2">
                湯切りの達人を目指せ！
              </p>
            </div>
          </SidePanelSection>
        </SidePanel>
      </div>

      {/* 湯気エフェクト */}
      <SteamEffect />
    </div>
  );
};
