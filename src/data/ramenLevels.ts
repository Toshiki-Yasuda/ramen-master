import type { RamenLevel } from '../types';
import { RAMEN_COMBO_THRESHOLDS } from '../constants';

// ラーメン進化レベル定義
// コンボ数に応じてラーメンがグレードアップ
export const RAMEN_LEVELS: RamenLevel[] = [
  {
    level: 1,
    combo: RAMEN_COMBO_THRESHOLDS.LEVEL_1,
    name: '素ラーメン',
    description: '麺とスープだけ...',
    image: '/images/ramen/ramen_1.png',
  },
  {
    level: 2,
    combo: RAMEN_COMBO_THRESHOLDS.LEVEL_2,
    name: 'ネギラーメン',
    description: 'ネギ追加！',
    image: '/images/ramen/ramen_2.png',
  },
  {
    level: 3,
    combo: RAMEN_COMBO_THRESHOLDS.LEVEL_3,
    name: 'チャーシュー麺',
    description: 'チャーシュー1枚！',
    image: '/images/ramen/ramen_3.png',
  },
  {
    level: 4,
    combo: RAMEN_COMBO_THRESHOLDS.LEVEL_4,
    name: '味玉ラーメン',
    description: '味玉登場！',
    image: '/images/ramen/ramen_4.png',
  },
  {
    level: 5,
    combo: RAMEN_COMBO_THRESHOLDS.LEVEL_5,
    name: '背脂ラーメン',
    description: '背脂ドバドバ！',
    image: '/images/ramen/ramen_5.png',
  },
  {
    level: 6,
    combo: RAMEN_COMBO_THRESHOLDS.LEVEL_6,
    name: '全部乗せ',
    description: 'もはや麺が見えない',
    image: '/images/ramen/ramen_6.png',
  },
  {
    level: 7,
    combo: RAMEN_COMBO_THRESHOLDS.LEVEL_7,
    name: '店主スペシャル',
    description: '店主が丼に...',
    image: '/images/ramen/ramen_7.png',
  },
];

// コンボ数に応じた現在のラーメンレベルを取得
export const getCurrentRamenLevel = (combo: number): RamenLevel => {
  // コンボ数以下の最大レベルを返す
  const level = [...RAMEN_LEVELS]
    .reverse()
    .find((level) => combo >= level.combo);

  return level || RAMEN_LEVELS[0];
};

// 次のラーメンレベルを取得（最大レベルならnull）
export const getNextRamenLevel = (combo: number): RamenLevel | null => {
  const currentLevel = getCurrentRamenLevel(combo);
  const currentIndex = RAMEN_LEVELS.findIndex(
    (l) => l.level === currentLevel.level
  );

  if (currentIndex >= RAMEN_LEVELS.length - 1) return null;
  return RAMEN_LEVELS[currentIndex + 1];
};

// 次のレベルまでの残りコンボ数を取得
export const getComboToNextLevel = (combo: number): number | null => {
  const nextLevel = getNextRamenLevel(combo);
  if (!nextLevel) return null;
  return nextLevel.combo - combo;
};
