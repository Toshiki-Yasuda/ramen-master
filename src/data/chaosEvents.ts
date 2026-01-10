import type { ChaosEvent } from '../types';
import {
  CHAOS_SCORE_THRESHOLDS,
  CHAOS_PROBABILITY,
} from '../constants';

// カオスイベント定義
// スコアに応じて解禁されるイベント
export const CHAOS_EVENTS: ChaosEvent[] = [
  {
    id: 'chef_wink',
    minScore: CHAOS_SCORE_THRESHOLDS.LEVEL_1,
    image: '/images/chef/chef_wink.png',
    duration: 800,
    animation: 'fadeInScale',
  },
  {
    id: 'cat_tatsumaki',
    minScore: CHAOS_SCORE_THRESHOLDS.LEVEL_2,
    image: '/images/chaos/cat_tatsumaki.png',
    duration: 1500,
    animation: 'spinIn',
  },
  {
    id: 'chef_muscle',
    minScore: CHAOS_SCORE_THRESHOLDS.LEVEL_2,
    image: '/images/chef/chef_muscle.png',
    duration: 1200,
    animation: 'bounceIn',
  },
  {
    id: 'mystery_ojisan',
    minScore: CHAOS_SCORE_THRESHOLDS.LEVEL_3,
    image: '/images/chaos/mystery_ojisan.png',
    duration: 2000,
    animation: 'slideInFromRight',
  },
  {
    id: 'chef_clone',
    minScore: CHAOS_SCORE_THRESHOLDS.LEVEL_3,
    image: '/images/chef/chef_clone.png',
    duration: 1500,
    animation: 'fadeInScale',
  },
  {
    id: 'chef_space',
    minScore: CHAOS_SCORE_THRESHOLDS.LEVEL_4,
    image: '/images/chef/chef_space.png',
    duration: 2000,
    animation: 'floatIn',
  },
  {
    id: 'chef_in_bowl',
    minScore: CHAOS_SCORE_THRESHOLDS.LEVEL_5,
    image: '/images/chef/chef_in_bowl.png',
    duration: 2500,
    animation: 'dropIn',
  },
];

// スコアに応じたカオスイベント発生確率を計算
export const getChaosProbability = (score: number): number => {
  if (score < CHAOS_SCORE_THRESHOLDS.LEVEL_1) return CHAOS_PROBABILITY.NONE;
  if (score < CHAOS_SCORE_THRESHOLDS.LEVEL_2) return CHAOS_PROBABILITY.LOW;
  if (score < CHAOS_SCORE_THRESHOLDS.LEVEL_3) return CHAOS_PROBABILITY.MEDIUM;
  if (score < CHAOS_SCORE_THRESHOLDS.LEVEL_4) return CHAOS_PROBABILITY.HIGH;
  return CHAOS_PROBABILITY.MAX;
};

// スコアに応じて利用可能なカオスイベントを取得
export const getAvailableChaosEvents = (score: number): ChaosEvent[] => {
  return CHAOS_EVENTS.filter((event) => score >= event.minScore);
};

// 直前のイベントIDを記録（重複防止用）
let lastEventId: string | null = null;

// ランダムにカオスイベントを選択（重複防止機能付き）
export const selectRandomChaosEvent = (score: number): ChaosEvent | null => {
  const probability = getChaosProbability(score);
  if (Math.random() > probability) return null;

  const availableEvents = getAvailableChaosEvents(score);
  if (availableEvents.length === 0) return null;

  // 重複防止: 直前と同じイベントは選ばない（候補が2つ以上ある場合）
  let candidates = availableEvents;
  if (lastEventId && availableEvents.length > 1) {
    candidates = availableEvents.filter((event) => event.id !== lastEventId);
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  const selectedEvent = candidates[randomIndex];

  // 選択したイベントを記録
  lastEventId = selectedEvent.id;

  return selectedEvent;
};

// 履歴をリセット（ゲーム開始時などに呼ぶ）
export const resetChaosHistory = (): void => {
  lastEventId = null;
};
