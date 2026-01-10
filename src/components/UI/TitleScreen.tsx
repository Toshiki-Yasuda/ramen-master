import { motion } from 'framer-motion';
import { fadeIn } from '../../constants/animations';
import {
  Play,
  Settings,
  Trophy,
  HelpCircle,
  Flame,
  Gamepad2,
  Zap,
} from 'lucide-react';
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
                icon={<Play className="w-full h-full" />}
                label="ゲームスタート"
                onClick={onStart}
              />
              <MenuItem
                icon={<Settings className="w-full h-full" />}
                label="設定"
                disabled
              />
              <MenuItem
                icon={<Trophy className="w-full h-full" />}
                label="ランキング"
                disabled
              />
              <MenuItem
                icon={<HelpCircle className="w-full h-full" />}
                label="遊び方"
                disabled
              />
            </div>
          </SidePanelSection>

          <div className="flex-1" />

          <SidePanelSection className="border-t border-ramen-gold/20">
            <div className="text-center text-ramen-cream/50 text-xs font-heading">
              <p className="tracking-wider">湯切りますたー</p>
              <p className="mt-1 text-ramen-gold/40">ver 0.1.0</p>
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
            className="relative z-10 ticket-button ticket-button-red text-xl md:text-2xl lg:hidden font-heading"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onClick={onStart}
          >
            <Play className="w-5 h-5 inline mr-2" />
            ゲームスタート
          </motion.button>

          {/* 開発中メッセージ */}
          <motion.p
            className="relative z-10 mt-6 text-white/80 text-xs md:text-sm text-center max-w-md px-4 drop-shadow-lg font-heading"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1 }}
          >
            ※ 現在開発中です
          </motion.p>

          {/* 画面下部の装飾 */}
          <motion.div
            className="relative z-10 mt-4 flex gap-4 opacity-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.2 }}
          >
            <Flame className="w-5 h-5 text-ramen-orange" />
            <Zap className="w-5 h-5 text-ramen-gold" />
            <Trophy className="w-5 h-5 text-ramen-gold" />
            <Zap className="w-5 h-5 text-ramen-gold" />
            <Flame className="w-5 h-5 text-ramen-orange" />
          </motion.div>
        </main>

        {/* 右サイドパネル */}
        <SidePanel position="right">
          <LanternDecoration />

          <SidePanelSection title="ゲーム情報">
            <div className="space-y-1">
              <InfoItem label="最高スコア" value="---" icon={<Trophy className="w-full h-full" />} />
              <InfoItem label="プレイ回数" value="0" icon={<Gamepad2 className="w-full h-full" />} />
              <InfoItem label="最大コンボ" value="---" icon={<Zap className="w-full h-full" />} />
            </div>
          </SidePanelSection>

          <SidePanelSection title="難易度">
            <div className="space-y-2">
              <MenuItem
                icon={<Flame className="w-full h-full" />}
                label="ピリ辛"
                active
              />
              <MenuItem
                icon={<><Flame className="w-3 h-3" /><Flame className="w-3 h-3" /></>}
                label="激辛"
                disabled
              />
              <MenuItem
                icon={<><Flame className="w-3 h-3" /><Flame className="w-3 h-3" /><Flame className="w-3 h-3" /></>}
                label="地獄"
                disabled
              />
            </div>
          </SidePanelSection>

          <div className="flex-1" />

          <SidePanelSection className="border-t border-ramen-gold/20">
            <div className="text-center">
              <motion.div
                className="flex justify-center"
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Zap className="w-8 h-8 text-ramen-gold" />
              </motion.div>
              <p className="text-ramen-gold/70 text-xs mt-2 font-heading tracking-wide">
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
