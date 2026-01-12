interface SteamEffectProps {
  /**
   * 湯気の粒子数
   * @default 6
   */
  particleCount?: number;
}

/**
 * 湯気エフェクトコンポーネント
 * ラーメンの雰囲気を演出する湯気アニメーション
 */
export const SteamEffect = ({ particleCount = 6 }: SteamEffectProps) => (
  <div className="steam-container">
    {Array.from({ length: particleCount }).map((_, i) => (
      <div key={i} className="steam" />
    ))}
  </div>
);
