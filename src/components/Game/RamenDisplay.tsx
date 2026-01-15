import { motion } from 'framer-motion';

interface RamenDisplayProps {
  level: number; // 0-6
  maxCombo: number;
}

const RAMEN_STAGES = [
  { level: 0, name: '素ラーメン', emoji: '🍜', description: 'スープのみ' },
  { level: 1, name: 'ネギラーメン', emoji: '🍜', description: 'ネギ追加' },
  { level: 2, name: 'チャーシュー麺', emoji: '🥚', description: 'チャーシュー乗せ' },
  { level: 3, name: '味玉ラーメン', emoji: '🥚', description: '味玉追加' },
  { level: 4, name: '背脂ラーメン', emoji: '🥢', description: '背脂ドリズル' },
  { level: 5, name: '全部乗せ', emoji: '🥢', description: '全トッピング完成' },
  { level: 6, name: '店主スペシャル', emoji: '👨‍🍳', description: '最高傑作' },
];

export const RamenDisplay: React.FC<RamenDisplayProps> = ({
  level,
  maxCombo,
}) => {
  const currentStage = RAMEN_STAGES[Math.min(level, 6)];
  const nextStage = level < 6 ? RAMEN_STAGES[level + 1] : null;

  // コンボしきい値
  const comboThresholds = [0, 10, 20, 30, 50, 70, 100];
  const currentThreshold = comboThresholds[level];
  const nextThreshold = level < 6 ? comboThresholds[level + 1] : 100;

  // 進捗率
  const progressToNext = nextThreshold > currentThreshold
    ? Math.min(1, (maxCombo - currentThreshold) / (nextThreshold - currentThreshold))
    : 1;

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* メインラーメン表示 */}
      <motion.div
        className="text-8xl md:text-9xl"
        animate={{
          scale: [1, 1.05, 1],
          filter: level > 0 ? ['drop-shadow(0 0 0px gold)', 'drop-shadow(0 0 20px gold)', 'drop-shadow(0 0 0px gold)'] : 'drop-shadow(0 0 0px)',
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {currentStage.emoji}
      </motion.div>

      {/* ラーメン名とコンボ情報 */}
      <div className="text-center">
        <motion.h3
          className="text-2xl md:text-3xl font-heading font-bold text-ramen-gold"
          animate={{ scale: level > 0 ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Lv.{level + 1} {currentStage.name}
        </motion.h3>
        <p className="text-sm text-ramen-cream/70 mt-1">{currentStage.description}</p>
      </div>

      {/* 進捗バー */}
      <div className="w-full max-w-xs">
        <div className="text-xs text-ramen-cream/60 mb-1 flex justify-between">
          <span>コンボ進捗</span>
          <span>{maxCombo}/{nextThreshold}</span>
        </div>
        <div className="relative h-3 bg-ramen-brown/30 rounded-full overflow-hidden border border-ramen-gold/30">
          <motion.div
            className="h-full bg-gradient-to-r from-ramen-gold to-ramen-orange shadow-lg shadow-ramen-gold/50"
            animate={{ width: `${progressToNext * 100}%` }}
            transition={{ duration: 0.3, type: 'tween' }}
          />
        </div>
      </div>

      {/* 次のレベルプレビュー */}
      {nextStage && (
        <motion.div
          className="text-center text-sm text-ramen-cream/60 mt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2">
            <span>次: {nextStage.emoji}</span>
            <span>{nextStage.name}</span>
            <span className="text-ramen-orange">+{nextThreshold - maxCombo}コンボで進化</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
