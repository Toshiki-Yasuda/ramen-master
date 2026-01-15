import { useState, useCallback, useEffect, useRef } from 'react';

type ChaosEventType = 'wink' | 'tornado' | 'ojisan' | 'space' | 'bowl' | 'air_conditioner';

interface ChaosEventTrigger {
  minScore: number;
  probability: number; // 0 ~ 1
  types: ChaosEventType[];
}

const CHAOS_THRESHOLDS: ChaosEventTrigger[] = [
  {
    minScore: 1000,
    probability: 0.1,
    types: ['wink'],
  },
  {
    minScore: 3000,
    probability: 0.2,
    types: ['wink', 'tornado', 'air_conditioner'],
  },
  {
    minScore: 5000,
    probability: 0.35,
    types: ['wink', 'tornado', 'ojisan', 'air_conditioner'],
  },
  {
    minScore: 8000,
    probability: 0.35,
    types: ['tornado', 'ojisan', 'space'],
  },
  {
    minScore: 10000,
    probability: 0.5,
    types: ['space', 'bowl'],
  },
];

export const useChaosEventTrigger = () => {
  const [currentEvent, setCurrentEvent] = useState<ChaosEventType | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [eventTimestamp, setEventTimestamp] = useState<number | null>(null);
  const lastTriggeredScoreRef = useRef<number>(0);
  const eventDurationsRef = useRef<Record<ChaosEventType, number>>({
    wink: 0.8,
    tornado: 1.5,
    ojisan: 2,
    space: 2,
    bowl: 2.5,
    air_conditioner: 1.2,
  });

  // スコアに応じてカオスイベントをトリガー
  const checkAndTriggerEvent = useCallback((score: number) => {
    // 既に表示中のイベントがある場合はスキップ
    if (isActive) return;

    // 同じスコアレベルでは複数回トリガーしない
    if (lastTriggeredScoreRef.current === score) return;

    // スコアが前のスコアより低い場合（リトライなど）はリセット
    if (score < lastTriggeredScoreRef.current) {
      lastTriggeredScoreRef.current = 0;
    }

    // スコアの増加に応じてイベントをトリガー
    let triggered = false;

    for (let i = CHAOS_THRESHOLDS.length - 1; i >= 0; i--) {
      const threshold = CHAOS_THRESHOLDS[i];
      if (score >= threshold.minScore && score > lastTriggeredScoreRef.current) {
        // 確率判定
        if (Math.random() < threshold.probability) {
          const eventType = threshold.types[Math.floor(Math.random() * threshold.types.length)];
          setCurrentEvent(eventType);
          setIsActive(true);
          setEventTimestamp(Date.now());
          lastTriggeredScoreRef.current = score;
          triggered = true;
          break;
        }
      }
    }

    return triggered;
  }, [isActive]);

  // イベント終了処理
  useEffect(() => {
    if (!isActive || !currentEvent || !eventTimestamp) return;

    const duration = eventDurationsRef.current[currentEvent];
    const elapsedTime = (Date.now() - eventTimestamp) / 1000;

    if (elapsedTime >= duration) {
      setIsActive(false);
      setCurrentEvent(null);
      setEventTimestamp(null);
    }

    const timer = setTimeout(() => {
      setIsActive(false);
      setCurrentEvent(null);
      setEventTimestamp(null);
    }, (duration - elapsedTime) * 1000);

    return () => clearTimeout(timer);
  }, [isActive, currentEvent, eventTimestamp]);

  // リセット
  const reset = useCallback(() => {
    setCurrentEvent(null);
    setIsActive(false);
    setEventTimestamp(null);
    lastTriggeredScoreRef.current = 0;
  }, []);

  return {
    currentEvent,
    isActive,
    checkAndTriggerEvent,
    reset,
  };
};
