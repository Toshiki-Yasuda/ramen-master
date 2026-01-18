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
      {/* スコア表示 - 強化版 */}
      <motion.div
        className="text-center relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* コンボ達成時の背景グロー */}
        {combo % 10 === 0 && combo > 0 && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-ramen-gold/20 to-ramen-orange/20 blur-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 0.3 }}
          />
        )}

        <motion.div
          className="relative z-10"
          animate={{
            scale: combo % 10 === 0 && combo > 0 ? [1, 1.15, 1.05, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="text-4xl md:text-5xl font-heading font-bold text-ramen-gold">
            {score.toLocaleString()}
          </div>
          <div className="text-sm text-ramen-cream/60">スコア</div>
        </motion.div>
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
        {/* コンボ - 強化版 */}
        <motion.div
          className="glass-panel-dark px-3 py-2 rounded-lg text-center relative overflow-hidden"
          animate={{
            scale: combo > 0 && combo % 10 === 0 ? [1, 1.1, 1.05, 1.08, 1] : 1,
            boxShadow:
              combo > 0 && combo % 10 === 0
                ? [
                    '0 0 0px rgba(255,215,0,0)',
                    '0 0 15px rgba(255,215,0,0.6)',
                    '0 0 10px rgba(255,215,0,0.3)',
                  ]
                : '0 0 0px rgba(255,215,0,0)',
          }}
          transition={{
            duration: 0.4,
            boxShadow: { duration: 0.4 },
          }}
        >
          {/* コンボ達成時のビジュアルエフェクト */}
          {combo > 0 && combo % 10 === 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-ramen-gold/30 to-transparent"
              initial={{ x: -100 }}
              animate={{ x: 100 }}
              transition={{ duration: 0.6, repeat: 0 }}
            />
          )}

          <div className="relative z-10">
            <div className="text-xs text-ramen-cream/60 font-heading">COMBO</div>
            <div className="text-2xl font-heading font-bold text-ramen-gold">
              {combo}
            </div>
          </div>
        </motion.div>

        {/* 精度 */}
        <motion.div
          className="glass-panel-dark px-3 py-2 rounded-lg text-center"
          animate={{
            scale: accuracy > 90 ? [1, 1.02, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs text-ramen-cream/60 font-heading">精度</div>
          <motion.div
            className="text-2xl font-heading"
            animate={{
              color: accuracy > 95 ? '#FFD700' : accuracy > 85 ? '#FFD700' : '#FFFFFF',
            }}
          >
            {accuracy.toFixed(1)}%
          </motion.div>
        </motion.div>

        {/* フェーズ - 強化版 */}
        <motion.div
          className="glass-panel-dark px-3 py-2 rounded-lg text-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs text-ramen-cream/60 font-heading">段階</div>
          <motion.div
            className="text-lg font-heading font-bold"
            animate={{
              color:
                currentPhase === 'complete'
                  ? ['#FFD700', '#FF8C00', '#FFD700']
                  : currentPhase === 'oil_cut'
                    ? '#FF8C00'
                    : '#FFD700',
            }}
            transition={{
              duration: currentPhase === 'complete' ? 0.8 : 1,
              repeat: currentPhase === 'complete' ? Infinity : 0,
            }}
          >
            {phaseLabels[currentPhase]}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
