import { motion } from 'framer-motion';
import type { CookingPhase } from '../../types';

interface CookingProgressBarProps {
  currentPhase: CookingPhase;
  phaseProgress: number; // 0 ~ 1
  score: number;
  combo: number;
  accuracy: number;
}

const phases: CookingPhase[] = ['soup', 'oil_cut', 'noodles', 'topping', 'complete'];
const phaseLabels: Record<CookingPhase, string> = {
  soup: 'スープ',
  oil_cut: '油切り',
  noodles: '麺',
  topping: 'トッピング',
  complete: '完成',
};

export const CookingProgressBar: React.FC<CookingProgressBarProps> = ({
  currentPhase,
  phaseProgress,
  score,
  combo,
  accuracy,
}) => {
  const currentPhaseIndex = phases.indexOf(currentPhase);
  const overallProgress = (currentPhaseIndex + phaseProgress) / (phases.length - 1);

  return (
    <div className="w-full space-y-4">
      {/* スコア表示 */}
      <motion.div
        className="text-center"
        animate={{ scale: combo % 10 === 0 && combo > 0 ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-4xl md:text-5xl font-heading font-bold text-ramen-gold">
          {score.toLocaleString()}
        </div>
        <div className="text-sm text-ramen-cream/60">スコア</div>
      </motion.div>

      {/* 調理進捗バー */}
      <div className="space-y-2">
        <div className="relative w-full h-3 bg-ramen-brown/30 rounded-full overflow-hidden border border-ramen-gold/30">
          <motion.div
            className="h-full bg-gradient-to-r from-ramen-gold to-ramen-orange shadow-lg shadow-ramen-gold/50"
            animate={{ width: `${overallProgress * 100}%` }}
            transition={{ duration: 0.3, type: 'tween' }}
          />
        </div>

        {/* フェーズラベル */}
        <div className="flex justify-between text-xs text-ramen-cream/60 px-1">
          {phases.map((phase, idx) => (
            <motion.div
              key={phase}
              animate={{
                color:
                  idx <= currentPhaseIndex
                    ? '#FFD700'
                    : '#D4AF37',
                scale: idx === currentPhaseIndex ? 1.2 : 1,
              }}
              className="font-semibold"
            >
              {phaseLabels[phase]}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ステータスメーター（下部） */}
      <div className="grid grid-cols-3 gap-4 pt-2">
        {/* コンボ */}
        <motion.div
          className="glass-panel-dark px-3 py-2 rounded-lg text-center"
          animate={{
            scale: combo > 0 && combo % 10 === 0 ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs text-ramen-cream/60 font-heading">COMBO</div>
          <div className="text-2xl font-heading font-bold text-ramen-gold">
            {combo}
          </div>
        </motion.div>

        {/* 精度 */}
        <div className="glass-panel-dark px-3 py-2 rounded-lg text-center">
          <div className="text-xs text-ramen-cream/60 font-heading">精度</div>
          <div className="text-2xl font-heading text-ramen-cream">
            {accuracy.toFixed(1)}%
          </div>
        </div>

        {/* フェーズ */}
        <div className="glass-panel-dark px-3 py-2 rounded-lg text-center">
          <div className="text-xs text-ramen-cream/60 font-heading">段階</div>
          <div className="text-lg font-heading text-ramen-orange">
            {phaseLabels[currentPhase]}
          </div>
        </div>
      </div>
    </div>
  );
};
