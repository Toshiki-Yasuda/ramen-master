import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SidePanelProps {
  children: ReactNode;
  position?: 'left' | 'right';
  className?: string;
}

// サイドパネル本体
export const SidePanel = ({
  children,
  position = 'left',
  className = '',
}: SidePanelProps) => {
  const borderClass =
    position === 'left'
      ? 'border-r-2 border-ramen-gold/40'
      : 'border-l-2 border-ramen-gold/40';

  return (
    <motion.aside
      className={`hidden lg:flex lg:w-52 xl:w-60 2xl:w-72 flex-col ${borderClass}
                  bg-gradient-to-b from-ramen-dark/80 via-ramen-dark/70 to-ramen-dark/80
                  backdrop-blur-xl shadow-2xl ${className}`}
      initial={{ opacity: 0, x: position === 'left' ? -60 : 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 内側のグロー効果 */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          position === 'left'
            ? 'bg-gradient-to-r from-ramen-gold/5 to-transparent'
            : 'bg-gradient-to-l from-ramen-gold/5 to-transparent'
        }`}
      />
      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </motion.aside>
  );
};

// パネル内のセクション
interface SidePanelSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export const SidePanelSection = ({
  title,
  children,
  className = '',
}: SidePanelSectionProps) => {
  return (
    <motion.div
      className={`p-4 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {title && (
        <h3 className="text-ramen-gold text-xs font-bold mb-4 tracking-widest uppercase flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-ramen-gold to-ramen-orange rounded-full" />
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  );
};

// メニューアイテム
interface MenuItemProps {
  icon?: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

export const MenuItem = ({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: MenuItemProps) => {
  return (
    <motion.button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                  ${active
                    ? 'bg-gradient-to-r from-ramen-gold/25 to-ramen-orange/15 text-ramen-gold border border-ramen-gold/50 shadow-lg shadow-ramen-gold/10'
                    : 'text-ramen-cream/80 hover:bg-ramen-gold/10 hover:text-ramen-gold border border-transparent'}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      whileHover={!disabled ? { scale: 1.02, x: 6 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && <span className="text-xl drop-shadow-sm">{icon}</span>}
      <span className="font-medium tracking-wide">{label}</span>
      {active && (
        <motion.div
          className="ml-auto w-2 h-2 rounded-full bg-ramen-gold"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

// 情報表示アイテム
interface InfoItemProps {
  label: string;
  value: string | number;
  icon?: string;
}

export const InfoItem = ({ label, value, icon }: InfoItemProps) => {
  return (
    <motion.div
      className="flex items-center justify-between py-2.5 border-b border-ramen-gold/15 last:border-0"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-ramen-cream/70 text-sm flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        {label}
      </span>
      <span className="text-ramen-gold font-bold text-lg tracking-wider">{value}</span>
    </motion.div>
  );
};

// 装飾的な提灯
export const LanternDecoration = () => {
  return (
    <div className="relative py-6">
      {/* 提灯の紐 */}
      <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-gradient-to-b from-ramen-gold/50 to-transparent -translate-x-1/2" />

      <motion.div
        className="text-5xl text-center"
        animate={{
          rotate: [-4, 4, -4],
          y: [0, 2, 0],
        }}
        transition={{
          rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          filter: 'drop-shadow(0 0 15px rgba(255, 152, 0, 0.6))',
        }}
      >
        🏮
      </motion.div>

      {/* 提灯の光 */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-ramen-orange/20 to-transparent pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};
