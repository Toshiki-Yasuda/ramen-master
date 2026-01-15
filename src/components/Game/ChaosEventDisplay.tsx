import { motion, AnimatePresence } from 'framer-motion';

interface ChaosEventDisplayProps {
  eventType: string | null;
  isActive: boolean;
}

const CHAOS_EVENTS = {
  wink: {
    emoji: '😏',
    name: 'ウインク',
    duration: 0.8,
    animation: 'wink',
  },
  tornado: {
    emoji: '🌪️',
    name: '猫の竜巻旋風脚',
    duration: 1.5,
    animation: 'spin',
  },
  ojisan: {
    emoji: '🧔',
    name: '謎のおじさん乱入',
    duration: 2,
    animation: 'slide',
  },
  space: {
    emoji: '👨‍🚀',
    name: '宇宙服着用',
    duration: 2,
    animation: 'float',
  },
  bowl: {
    emoji: '🍜',
    name: '丼の中に入る',
    duration: 2.5,
    animation: 'sink',
  },
  air_conditioner: {
    emoji: '💨',
    name: '空調が強くなる',
    duration: 1.2,
    animation: 'shake',
  },
} as const;

const animationVariants = {
  wink: {
    initial: { scale: 0, opacity: 0, rotateZ: -20 },
    animate: { scale: 1, opacity: 1, rotateZ: 0 },
    exit: { scale: 0, opacity: 0, rotateZ: 20 },
    transition: { duration: 0.4 },
  },
  spin: {
    initial: { x: -100, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      rotate: [0, 360, 360],
    },
    exit: { x: 100, opacity: 0 },
    transition: { duration: 1.5, rotate: { duration: 1.5 } },
  },
  slide: {
    initial: { x: 200, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -200, opacity: 0 },
    transition: { duration: 0.5 },
  },
  float: {
    initial: { y: 100, opacity: 0 },
    animate: {
      y: [0, -20, 0],
      opacity: 1,
    },
    exit: { y: 100, opacity: 0 },
    transition: { duration: 2, y: { duration: 2, repeat: Infinity } },
  },
  sink: {
    initial: { y: -100, scale: 2, opacity: 0 },
    animate: {
      y: [0, 50],
      scale: [2, 0.5],
      opacity: [1, 0],
    },
    exit: { opacity: 0 },
    transition: { duration: 2 },
  },
  shake: {
    initial: { opacity: 0 },
    animate: {
      x: [-10, 10, -10, 10, 0],
      opacity: 1,
    },
    exit: { opacity: 0 },
    transition: { duration: 1.2, x: { duration: 1.2 } },
  },
};

export const ChaosEventDisplay: React.FC<ChaosEventDisplayProps> = ({
  eventType,
  isActive,
}) => {
  if (!eventType || !isActive) return null;

  const event = CHAOS_EVENTS[eventType as keyof typeof CHAOS_EVENTS];
  if (!event) return null;

  const variant = animationVariants[event.animation as keyof typeof animationVariants];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* メインイベント表示 */}
          <motion.div
            className="flex flex-col items-center gap-4"
            {...variant}
          >
            <div className="text-9xl drop-shadow-2xl">
              {event.emoji}
            </div>
            <motion.div
              className="text-3xl font-heading font-bold text-ramen-gold drop-shadow-lg bg-black/50 px-6 py-3 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {event.name}
            </motion.div>
          </motion.div>

          {/* 背景エフェクト */}
          {event.animation === 'shake' && (
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundColor: ['rgba(255, 200, 0, 0)', 'rgba(255, 200, 0, 0.1)', 'rgba(255, 200, 0, 0)'],
              }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
