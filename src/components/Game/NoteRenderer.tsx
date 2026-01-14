/**
 * NoteRenderer - ノーツ描画コンポーネント
 *
 * ノーツを画面上部から判定ラインに向かって落下させる
 * 湯切りザルをイメージしたビジュアル
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Note } from '../../types';
import type { DetailedJudgmentResult } from '../../hooks/useJudgment';

// 内部で使用するノーツ状態の型
interface NoteWithState extends Note {
  isHit?: boolean;
  result?: DetailedJudgmentResult;
}

interface NoteRendererProps {
  notes: NoteWithState[];
  currentTime: number;
  // 画面上に表示される時間範囲（秒）
  lookAhead?: number;
  lookBehind?: number;
  // 判定ライン位置（0-1、0が上、1が下）
  judgmentLinePosition?: number;
}

// ノーツのタイプごとの見た目
const NOTE_STYLES = {
  tap: {
    bg: 'bg-gradient-to-br from-ramen-gold to-ramen-orange',
    border: 'border-ramen-cream',
    shadow: 'shadow-ramen-orange/50',
    size: 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 xl:w-24 xl:h-24',
  },
  hold: {
    bg: 'bg-gradient-to-br from-green-400 to-emerald-500',
    border: 'border-green-200',
    shadow: 'shadow-green-500/50',
    size: 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 xl:w-24 xl:h-24',
  },
  yukigiri_combo: {
    bg: 'bg-gradient-to-br from-purple-400 to-pink-500',
    border: 'border-purple-200',
    shadow: 'shadow-purple-500/50',
    size: 'w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 lg:w-24 lg:h-24 xl:w-28 xl:h-28',
  },
} as const;

// 判定結果に応じたエフェクト
const HIT_EFFECTS = {
  PERFECT: 'scale-150 opacity-0 bg-yellow-400',
  GREAT: 'scale-125 opacity-0 bg-green-400',
  GOOD: 'scale-110 opacity-0 bg-blue-400',
  MISS: 'opacity-0 translate-y-10',
} as const;

export const NoteRenderer = ({
  notes,
  currentTime,
  lookAhead = 2.5,
  lookBehind = 0.3,
  judgmentLinePosition = 0.8,
}: NoteRendererProps) => {
  // 表示すべきノーツをフィルタリング
  const visibleNotes = useMemo(() => {
    return notes.filter((note) => {
      const timeDiff = note.time - currentTime;
      // ヒットしていないノーツ、または最近ヒットしたノーツ
      if (!note.isHit) {
        return timeDiff >= -lookBehind && timeDiff <= lookAhead;
      }
      // ヒット後のエフェクト表示（0.8秒間）
      return timeDiff >= -0.8 && timeDiff <= 0;
    });
  }, [notes, currentTime, lookAhead, lookBehind]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 判定ライン */}
      <div
        className="absolute top-0 bottom-0 w-4 bg-gradient-to-b from-transparent via-ramen-gold to-transparent animate-judgment-pulse"
        style={{ left: `${judgmentLinePosition * 100}%` }}
      >
        {/* 判定ライン中央のハイライト */}
        <div className="absolute top-1/2 -translate-y-1/2 h-24 w-full bg-white/30 blur-sm" />
      </div>

      {/* 判定エリア表示 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-ramen-gold/30 bg-ramen-gold/5"
        style={{
          left: `${judgmentLinePosition * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* レーンガイドライン（3レーン） */}
      {[35, 50, 65].map((lanePercent) => (
        <div
          key={lanePercent}
          className="absolute left-0 right-0 h-px bg-white/10"
          style={{ top: `${lanePercent}%` }}
        />
      ))}

      {/* ノーツ */}
      {visibleNotes.map((note) => {
        const timeDiff = note.time - currentTime;
        // 位置計算: timeDiff = lookAheadのとき右端(100%)、timeDiff = 0のとき判定ライン位置(15%)
        const progress = 1 - timeDiff / lookAhead;
        const rightPercent = 100 - (progress * (100 - judgmentLinePosition * 100));

        // レーン位置計算（3レーン: 35%, 50%, 65%）
        const lanePositions = [35, 50, 65];
        const laneIndex = note.lane ?? 1; // デフォルトは中央レーン
        const topPercent = lanePositions[laneIndex] || 50;

        const style = NOTE_STYLES[note.type] || NOTE_STYLES.tap;
        const isHit = note.isHit;
        const hitEffect = isHit && note.result ? HIT_EFFECTS[note.result.judgment] : '';

        return (
          <motion.div
            key={note.id}
            className={`
              absolute -translate-x-1/2 -translate-y-1/2
              ${style.size} rounded-full
              ${isHit ? hitEffect : `${style.bg} border-2 ${style.border} shadow-lg ${style.shadow}`}
              flex items-center justify-center
              transition-all duration-150
            `}
            style={{
              right: `${Math.min(100, Math.max(0, rightPercent))}%`,
              top: `${topPercent}%`,
            }}
            initial={!isHit ? { scale: 0.8, opacity: 0 } : undefined}
            animate={
              isHit
                ? { scale: 1.5, opacity: 0 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.15 }}
          >
            {/* ノーツ内のアイコン */}
            {!isHit && (
              <div className="text-2xl md:text-3xl">
                {note.type === 'tap' && '🍜'}
                {note.type === 'hold' && '🥢'}
                {note.type === 'yukigiri_combo' && '💫'}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* 中央ガイドライン（薄く表示） */}
      <div
        className="absolute top-1/2 h-0.5 w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 animate-horizontal-flow"
      />
    </div>
  );
};

export default NoteRenderer;
