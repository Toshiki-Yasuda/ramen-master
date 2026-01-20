import { Application, Container, Graphics, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import { AudioEngine } from './AudioEngine';
import { NoteManager } from './NoteManager';
import type { Beatmap, JudgmentType, ScoreData } from '../types';

// 和風×モダン リッチカラーパレット
const COLORS = {
  // 背景グラデーション
  BG_DARK: 0x0d0705,
  BG_MID: 0x1a0f0a,
  BG_LIGHT: 0x2d1f15,

  // アクセントカラー
  GOLD: 0xd4af37,
  GOLD_LIGHT: 0xffd700,
  VERMILION: 0xc94a4a,
  VERMILION_LIGHT: 0xff6b6b,
  CREAM: 0xfff8e7,

  // ノーツ（麺色）
  NOODLE: 0xffecd2,
  NOODLE_GLOW: 0xffdf9f,
  NOODLE_STROKE: 0xe8d4b8,

  // 箸（判定ライン）
  CHOPSTICK: 0x8b4513,
  CHOPSTICK_HIGHLIGHT: 0xcd853f,
  CHOPSTICK_GLOW: 0xdaa520,

  // 丼
  BOWL_DARK: 0x1a1a2e,
  BOWL_LIGHT: 0x2d2d44,
  BOWL_RIM: 0xd4af37,

  // エフェクト
  STEAM: 0xffffff,
  SPARKLE: 0xffd700,
  SAKURA: 0xffb7c5,
} as const;

// 基準解像度（この解像度を100%としてスケーリング）
const BASE_RESOLUTION = {
  WIDTH: 1280,
  HEIGHT: 720,
} as const;

// ゲーム設定（基準解像度での値）
const BASE_GAME_CONFIG = {
  JUDGE_LINE_X: 150,          // 判定ライン位置（左端寄り）
  NOTE_SPEED: 350,            // ノーツ速度
  NOTE_SIZE: 50,              // ノーツサイズ（正方形）
  CHOPSTICK_WIDTH: 10,        // 箸の幅
  CHOPSTICK_GAP: 60,          // 箸の間隔
  LANE_HEIGHT: 80,            // レーンの高さ
  LANE_BOTTOM_MARGIN: 80,     // レーンの下端からの余白
  GLOW_UPDATE_INTERVAL: 3,    // フレーム間隔
} as const;

// スケール係数を計算してゲーム設定を返す
function getScaledConfig(screenWidth: number, screenHeight: number) {
  // 画面サイズに応じたスケール係数（高さベース + 幅の最小値）
  const scaleY = screenHeight / BASE_RESOLUTION.HEIGHT;
  const scaleX = screenWidth / BASE_RESOLUTION.WIDTH;
  const scale = Math.min(scaleX, scaleY, 1.5); // 最大1.5倍まで
  const minScale = Math.max(scale, 0.5); // 最小0.5倍まで

  return {
    JUDGE_LINE_X: Math.max(80, BASE_GAME_CONFIG.JUDGE_LINE_X * scaleX),
    NOTE_SPEED: BASE_GAME_CONFIG.NOTE_SPEED * scaleX,
    NOTE_WIDTH: Math.max(30, BASE_GAME_CONFIG.NOTE_SIZE * minScale),
    NOTE_HEIGHT: Math.max(30, BASE_GAME_CONFIG.NOTE_SIZE * minScale),
    CHOPSTICK_WIDTH: Math.max(6, BASE_GAME_CONFIG.CHOPSTICK_WIDTH * minScale),
    CHOPSTICK_GAP: Math.max(40, BASE_GAME_CONFIG.CHOPSTICK_GAP * minScale),
    LANE_HEIGHT: Math.max(60, BASE_GAME_CONFIG.LANE_HEIGHT * minScale),
    LANE_BOTTOM_MARGIN: Math.max(40, BASE_GAME_CONFIG.LANE_BOTTOM_MARGIN * minScale),
    GLOW_UPDATE_INTERVAL: BASE_GAME_CONFIG.GLOW_UPDATE_INTERVAL,
    SCALE: minScale,  // UIスケール用
  };
}

// 型定義
type GameConfig = ReturnType<typeof getScaledConfig>;

// デフォルト設定（初期化前のフォールバック用）
const DEFAULT_GAME_CONFIG: GameConfig = getScaledConfig(BASE_RESOLUTION.WIDTH, BASE_RESOLUTION.HEIGHT);

// パーティクル設定
const PARTICLE_CONFIG = {
  STEAM: {
    DECAY: 0.008,
    SPAWN_CHANCE: 0.2,
    ALPHA_DECAY: 0.99,
    SCALE_GROW: 1.01,
  },
  HIT: {
    DECAY: 0.025,
    GRAVITY: 0.12,
    RING_SCALE_GROW: 1.15,
    PARTICLE_SCALE_SHRINK: 0.98,
  },
  AMBIENT: {
    DECAY: 0.002,
    SPAWN_CHANCE: 0.02,
    WAVE_AMPLITUDE: 0.2,
    WAVE_FREQUENCY: 50,
  },
  GLOW: {
    PHASE_INCREMENT: 0.05,
    BASE_ALPHA: 0.1,
    AMPLITUDE: 0.05,
  },
} as const;

// アニメーション設定
const ANIMATION_CONFIG = {
  SCREEN_SHAKE_DECAY: 0.9,
  HIT_FLASH_DECAY: 0.85,
  JUDGMENT_FADE_SPEED: 0.035,
  JUDGMENT_SCALE_SHRINK: 0.96,
  GAME_END_DELAY: 500,
  JUDGMENT_DISPLAY_DURATION: 100,
} as const;

// 判定エフェクトの色
const JUDGMENT_COLORS: Record<JudgmentType, number> = {
  PERFECT: 0xffd700,
  GREAT: 0x7cfc00,
  GOOD: 0x87ceeb,
  MISS: 0xff6b6b,
};

// 判定の日本語表記
const JUDGMENT_TEXT: Record<JudgmentType, string> = {
  PERFECT: '極',
  GREAT: '良',
  GOOD: '可',
  MISS: '失',
};

// パーティクル
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
  life: number;
  rotation?: number;
  rotationSpeed?: number;
  graphic: Graphics;
}

/**
 * GameEngine - 和風×モダン リッチ版 PixiJSゲームエンジン
 */
export class GameEngine {
  private app: Application | null = null;
  private audioEngine: AudioEngine;
  private noteManager: NoteManager;

  // 画面サイズに応じた動的設定
  private config: GameConfig = DEFAULT_GAME_CONFIG;

  // PixiJS コンテナ
  private gameContainer: Container | null = null;
  private bgContainer: Container | null = null;
  private laneContainer: Container | null = null;  // レーン（ノーツが流れる道）
  private chefContainer: Container | null = null;  // 店主キャラクター
  private bowlContainer: Container | null = null;
  private notesContainer: Container | null = null;
  private effectsContainer: Container | null = null;
  private uiContainer: Container | null = null;

  // 店主スプライト
  private chefSprites: Map<string, Sprite> = new Map();
  private currentChefState: string = 'taste';

  // UI要素
  private chopsticks: Graphics | null = null;
  private chopsticksGlow: Graphics | null = null;
  private judgmentText: Text | null = null;
  private judgmentSubText: Text | null = null;
  private scoreText: Text | null = null;
  private comboText: Text | null = null;
  private comboLabel: Text | null = null;
  private progressBar: Graphics | null = null;
  private progressFill: Graphics | null = null;

  // パーティクルシステム
  private steamParticles: Particle[] = [];
  private hitParticles: Particle[] = [];
  private ambientParticles: Particle[] = [];

  // アニメーション状態
  private glowPhase: number = 0;
  private hitFlashAlpha: number = 0;
  private screenShake: { x: number; y: number } = { x: 0, y: 0 };
  private frameCount: number = 0;

  // タイマー・アニメーションフレーム管理
  private activeTimers: Set<number> = new Set();
  private activeAnimationFrames: Set<number> = new Set();

  // キャッシュ（パフォーマンス最適化）
  private cachedHitFlash: Graphics | null = null;

  // ゲーム状態
  private isRunning: boolean = false;
  private isEndingAnimation: boolean = false;
  private beatmap: Beatmap | null = null;
  private noteGraphics: Map<number, Container> = new Map();

  // コールバック
  private onScoreUpdate: ((judgment: JudgmentType) => void) | null = null;
  private onGameEnd: (() => void) | null = null;

  constructor() {
    this.audioEngine = new AudioEngine();
    this.noteManager = new NoteManager();
  }

  /**
   * ゲームエンジンを初期化
   */
  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      backgroundColor: COLORS.BG_DARK,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    // 画面サイズに応じてスケール設定を計算
    this.config = getScaledConfig(this.app.screen.width, this.app.screen.height);
    console.log(`画面サイズ: ${this.app.screen.width}x${this.app.screen.height}, スケール: ${this.config.SCALE.toFixed(2)}`);

    await this.audioEngine.init();
    this.setupContainers();
    this.setupBackground();
    this.setupLane();
    this.loadChefSprites(); // 店主画像を非同期で読み込み
    this.setupBowl();
    this.setupUI();
    this.setupAmbientParticles();
  }

  /**
   * コンテナをセットアップ
   */
  private setupContainers(): void {
    if (!this.app) return;

    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);

    this.bgContainer = new Container();
    this.gameContainer.addChild(this.bgContainer);

    this.laneContainer = new Container();
    this.gameContainer.addChild(this.laneContainer);

    this.chefContainer = new Container();
    this.gameContainer.addChild(this.chefContainer);

    this.bowlContainer = new Container();
    this.gameContainer.addChild(this.bowlContainer);

    this.notesContainer = new Container();
    this.gameContainer.addChild(this.notesContainer);

    this.effectsContainer = new Container();
    this.gameContainer.addChild(this.effectsContainer);

    this.uiContainer = new Container();
    this.gameContainer.addChild(this.uiContainer);
  }

  /**
   * リッチな背景をセットアップ（厨房画像使用）
   */
  private setupBackground(): void {
    if (!this.app || !this.bgContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // フォールバック用のベース背景
    const fallbackBg = new Graphics();
    fallbackBg.rect(0, 0, width, height).fill(COLORS.BG_DARK);
    this.bgContainer.addChild(fallbackBg);

    // 背景画像を非同期で読み込み
    this.loadBackgroundImage(width, height);

    // ダークオーバーレイ（ゲーム要素を見やすくしつつ背景も見せる）
    const overlay = new Graphics();
    overlay.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.35 });
    this.bgContainer.addChild(overlay);

    // ビネット効果（控えめに）
    const vignette = new Graphics();
    const vignetteSteps = 15;
    for (let i = 0; i < vignetteSteps; i++) {
      const t = i / vignetteSteps;
      const alpha = t * t * 0.5;
      const offset = i * 20;
      vignette.rect(0, 0, offset, height).fill({ color: 0x000000, alpha });
      vignette.rect(width - offset, 0, offset, height).fill({ color: 0x000000, alpha });
      vignette.rect(0, 0, width, offset * 0.5).fill({ color: 0x000000, alpha: alpha * 0.3 });
      vignette.rect(0, height - offset * 0.5, width, offset * 0.5).fill({ color: 0x000000, alpha: alpha * 0.5 });
    }
    this.bgContainer.addChild(vignette);
  }

  /**
   * 背景画像を読み込み
   */
  private async loadBackgroundImage(width: number, height: number): Promise<void> {
    if (!this.bgContainer) return;

    try {
      const texture = await Assets.load('/ramen-master/images/bg-kitchen.jpg');
      const bgSprite = new Sprite(texture);

      // 元の寸法を保存（スケール適用前）
      const originalWidth = texture.width;
      const originalHeight = texture.height;

      // 画面をカバーするようにスケール（cover方式）
      const scaleX = width / originalWidth;
      const scaleY = height / originalHeight;
      const scale = Math.max(scaleX, scaleY);

      bgSprite.scale.set(scale);

      // 中央に配置
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;
      bgSprite.x = (width - scaledWidth) / 2;
      bgSprite.y = (height - scaledHeight) / 2;

      // フォールバック背景の直後に挿入
      this.bgContainer.addChildAt(bgSprite, 1);
    } catch (e) {
      console.warn('背景画像の読み込みに失敗:', e);
    }
  }

  /**
   * 店主画像を読み込み
   */
  private async loadChefSprites(): Promise<void> {
    if (!this.app || !this.chefContainer) return;

    const chefImages: Record<string, string> = {
      taste: '/ramen-master/images/chef/taste.png',    // 待機：味見
      yukiri: '/ramen-master/images/chef/yukiri.png',  // 湯切り中
      happy: '/ramen-master/images/chef/happy.png',    // GREAT
      perfect: '/ramen-master/images/chef/perfect.png', // PERFECT
      serve: '/ramen-master/images/chef/serve.png',    // 完成（リザルト用）
      thanks: '/ramen-master/images/chef/thanks.png',  // エンディング：ありがとうございました
    };

    const height = this.app.screen.height;
    const targetHeight = height * 0.7; // 画面の70%

    for (const [key, path] of Object.entries(chefImages)) {
      try {
        const texture = await Assets.load(path);
        const sprite = new Sprite(texture);

        // 高さに合わせてスケール
        const scale = targetHeight / sprite.height;
        sprite.scale.set(scale);

        // 右下に配置
        sprite.anchor.set(1, 1);
        sprite.x = this.app.screen.width - 20;
        sprite.y = this.app.screen.height - 10;

        // 最初は非表示
        sprite.visible = key === 'taste';
        sprite.alpha = 0.9;

        this.chefSprites.set(key, sprite);
        this.chefContainer.addChild(sprite);
      } catch (e) {
        console.warn(`店主画像の読み込みに失敗: ${key}`, e);
      }
    }

    this.currentChefState = 'taste';
  }

  /**
   * 店主画像を切り替え
   */
  private setChefState(state: string): void {
    if (this.currentChefState === state) return;

    // 全て非表示
    this.chefSprites.forEach((sprite) => {
      sprite.visible = false;
    });

    // 指定状態を表示
    const sprite = this.chefSprites.get(state);
    if (sprite) {
      sprite.visible = true;
      sprite.scale.set(sprite.scale.x * 1.05); // ポップ効果
      this.currentChefState = state;

      // スケールを元に戻す
      this.safeSetTimeout(() => {
        if (sprite && this.app) {
          const targetHeight = this.app.screen.height * 0.7;
          const originalScale = targetHeight / (sprite.texture.height);
          sprite.scale.set(originalScale);
        }
      }, 100);
    }
  }

  /**
   * レーン（ノーツが流れる道）を描画
   */
  private setupLane(): void {
    if (!this.app || !this.laneContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const laneHeight = this.config.LANE_HEIGHT;
    // レーンを画面下部に配置
    const laneY = height - this.config.LANE_BOTTOM_MARGIN - laneHeight / 2;

    // レーン背景（暗いストライプ）
    const laneBg = new Graphics();
    laneBg.rect(0, laneY - laneHeight / 2, width, laneHeight)
      .fill({ color: 0x000000, alpha: 0.4 });
    this.laneContainer.addChild(laneBg);

    // レーン上端のライン
    const topLine = new Graphics();
    topLine.rect(0, laneY - laneHeight / 2, width, 2)
      .fill({ color: COLORS.GOLD, alpha: 0.4 });
    this.laneContainer.addChild(topLine);

    // レーン下端のライン
    const bottomLine = new Graphics();
    bottomLine.rect(0, laneY + laneHeight / 2 - 2, width, 2)
      .fill({ color: COLORS.GOLD, alpha: 0.4 });
    this.laneContainer.addChild(bottomLine);

    // レーン内のグリッドライン（リズムガイド）
    for (let i = 1; i <= 8; i++) {
      const gridLine = new Graphics();
      const x = (width / 8) * i;
      gridLine.rect(x, laneY - laneHeight / 2, 1, laneHeight)
        .fill({ color: COLORS.CREAM, alpha: 0.08 });
      this.laneContainer.addChild(gridLine);
    }

    // 判定エリアハイライト（左端）
    const judgeArea = new Graphics();
    judgeArea.rect(0, laneY - laneHeight / 2, this.config.JUDGE_LINE_X + 50, laneHeight)
      .fill({ color: COLORS.VERMILION, alpha: 0.1 });
    this.laneContainer.addChild(judgeArea);

    // 判定ライン強調
    const judgeLine = new Graphics();
    judgeLine.rect(this.config.JUDGE_LINE_X - 2, laneY - laneHeight / 2, 4, laneHeight)
      .fill({ color: COLORS.GOLD, alpha: 0.6 });
    this.laneContainer.addChild(judgeLine);
  }

  /**
   * ラーメン丼を描画
   */
  private setupBowl(): void {
    if (!this.app || !this.bowlContainer) return;

    const height = this.app.screen.height;
    const bowlCenterX = this.config.JUDGE_LINE_X;
    const bowlY = height - 80;

    // 丼本体
    const bowl = new Graphics();

    // 丼の影
    bowl.ellipse(bowlCenterX, bowlY + 30, 80, 20).fill({ color: 0x000000, alpha: 0.3 });

    // 丼本体（グラデーション風）
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const y = bowlY - 30 + i * 6;
      const rx = 70 - i * 2;
      const ry = 25 - i * 1;
      const color = this.lerpColor(COLORS.BOWL_LIGHT, COLORS.BOWL_DARK, t);
      bowl.ellipse(bowlCenterX, y, rx, ry).fill(color);
    }

    // 丼の縁（金色のリム）
    bowl.ellipse(bowlCenterX, bowlY - 30, 72, 26).stroke({ color: COLORS.BOWL_RIM, width: 3 });
    bowl.ellipse(bowlCenterX, bowlY - 30, 68, 24).fill({ color: COLORS.VERMILION, alpha: 0.3 });

    // 丼の模様（波紋）
    for (let i = 0; i < 3; i++) {
      const y = bowlY - 10 + i * 12;
      bowl.ellipse(bowlCenterX, y, 60 - i * 5, 18 - i * 2)
        .stroke({ color: COLORS.GOLD, width: 1, alpha: 0.2 });
    }

    this.bowlContainer.addChild(bowl);

    // スープ面
    const soup = new Graphics();
    soup.ellipse(bowlCenterX, bowlY - 25, 55, 18).fill({ color: 0x8b4513, alpha: 0.6 });
    soup.ellipse(bowlCenterX, bowlY - 27, 50, 15).fill({ color: 0xcd853f, alpha: 0.4 });
    this.bowlContainer.addChild(soup);
  }

  /**
   * UI要素をセットアップ
   */
  private setupUI(): void {
    if (!this.app || !this.uiContainer || !this.effectsContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // 箸のグロー（背景）
    this.chopsticksGlow = new Graphics();
    this.uiContainer.addChild(this.chopsticksGlow);

    // 箸（判定ライン）
    this.chopsticks = new Graphics();
    this.drawChopsticks();
    this.uiContainer.addChild(this.chopsticks);

    // ヒットフラッシュ用オーバーレイ（キャッシュに保存）
    this.cachedHitFlash = new Graphics();
    this.cachedHitFlash.rect(0, 0, width, height).fill({ color: COLORS.GOLD, alpha: 0 });
    this.effectsContainer.addChild(this.cachedHitFlash);

    // 判定テキスト（日本語）- スケール対応
    const judgmentFontSize = Math.max(48, 96 * this.config.SCALE);
    const judgmentStyle = new TextStyle({
      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", "Shippori Mincho", serif',
      fontSize: judgmentFontSize,
      fontWeight: 'bold',
      fill: COLORS.GOLD,
      stroke: { color: 0x000000, width: Math.max(2, 4 * this.config.SCALE) },
      dropShadow: {
        color: COLORS.GOLD,
        blur: 20 * this.config.SCALE,
        distance: 0,
        alpha: 0.8,
      },
    });
    // レーンのY座標（判定テキスト配置用）
    const laneY = height - this.config.LANE_BOTTOM_MARGIN - this.config.LANE_HEIGHT / 2;

    this.judgmentText = new Text({ text: '', style: judgmentStyle });
    this.judgmentText.anchor.set(0.5);
    this.judgmentText.x = width / 3;  // 左寄り（店主と被らない）
    this.judgmentText.y = laneY - 100;  // レーンの上
    this.judgmentText.alpha = 0;
    this.effectsContainer.addChild(this.judgmentText);

    // 判定サブテキスト - スケール対応
    const subFontSize = Math.max(10, 16 * this.config.SCALE);
    const subStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: subFontSize,
      fontWeight: '300',
      fill: COLORS.CREAM,
      letterSpacing: 6 * this.config.SCALE,
    });
    this.judgmentSubText = new Text({ text: '', style: subStyle });
    this.judgmentSubText.anchor.set(0.5);
    this.judgmentSubText.x = width / 3;
    this.judgmentSubText.y = laneY - 40 * this.config.SCALE;  // 判定テキストの下
    this.judgmentSubText.alpha = 0;
    this.effectsContainer.addChild(this.judgmentSubText);

    // スコア表示エリア（背景付き）- スケール対応
    const boxWidth = Math.max(120, 180 * this.config.SCALE);
    const boxHeight = Math.max(50, 70 * this.config.SCALE);
    const boxX = 20 * this.config.SCALE;
    const boxY = 10 * this.config.SCALE;
    const scoreBox = new Graphics();
    scoreBox.roundRect(boxX, boxY, boxWidth, boxHeight, 8 * this.config.SCALE).fill({ color: 0x000000, alpha: 0.4 });
    scoreBox.roundRect(boxX, boxY, boxWidth, boxHeight, 8 * this.config.SCALE).stroke({ color: COLORS.GOLD, width: 1, alpha: 0.3 });
    this.uiContainer.addChild(scoreBox);

    // スコアラベル - スケール対応
    const labelFontSize = Math.max(8, 10 * this.config.SCALE);
    const labelStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: labelFontSize,
      fontWeight: '600',
      fill: COLORS.GOLD,
      letterSpacing: 4 * this.config.SCALE,
    });
    const scoreLabel = new Text({ text: 'SCORE', style: labelStyle });
    scoreLabel.x = boxX + 15 * this.config.SCALE;
    scoreLabel.y = boxY + 10 * this.config.SCALE;
    this.uiContainer.addChild(scoreLabel);

    // スコアテキスト - スケール対応
    const scoreFontSize = Math.max(18, 32 * this.config.SCALE);
    const scoreStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: scoreFontSize,
      fontWeight: '200',
      fill: COLORS.CREAM,
      letterSpacing: 2,
    });
    this.scoreText = new Text({ text: '0', style: scoreStyle });
    this.scoreText.x = boxX + 15 * this.config.SCALE;
    this.scoreText.y = boxY + 28 * this.config.SCALE;
    this.uiContainer.addChild(this.scoreText);

    // コンボ表示 - スケール対応
    const comboFontSize = Math.max(32, 64 * this.config.SCALE);
    const comboStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: comboFontSize,
      fontWeight: '100',
      fill: COLORS.GOLD_LIGHT,
      dropShadow: {
        color: COLORS.GOLD,
        blur: 15 * this.config.SCALE,
        distance: 0,
        alpha: 0.5,
      },
    });
    this.comboText = new Text({ text: '', style: comboStyle });
    this.comboText.anchor.set(0.5);
    this.comboText.x = width / 2;
    this.comboText.y = height - 100 * this.config.SCALE;
    this.uiContainer.addChild(this.comboText);

    // コンボラベル - スケール対応
    const comboLabelFontSize = Math.max(8, 12 * this.config.SCALE);
    const comboLabelStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: comboLabelFontSize,
      fontWeight: '400',
      fill: COLORS.GOLD,
      letterSpacing: 4 * this.config.SCALE,
    });
    this.comboLabel = new Text({ text: 'COMBO', style: comboLabelStyle });
    this.comboLabel.anchor.set(0.5);
    this.comboLabel.x = width / 2;
    this.comboLabel.y = height - 55 * this.config.SCALE;
    this.comboLabel.alpha = 0;
    this.uiContainer.addChild(this.comboLabel);

    // プログレスバー背景 - スケール対応
    const progressWidth = Math.min(300, width * 0.4);
    const progressHeight = Math.max(4, 6 * this.config.SCALE);
    this.progressBar = new Graphics();
    this.progressBar.roundRect(width / 2 - progressWidth / 2, 15 * this.config.SCALE, progressWidth, progressHeight, 3).fill({ color: 0x000000, alpha: 0.5 });
    this.progressBar.roundRect(width / 2 - progressWidth / 2, 15 * this.config.SCALE, progressWidth, progressHeight, 3).stroke({ color: COLORS.GOLD, width: 1, alpha: 0.3 });
    this.uiContainer.addChild(this.progressBar);

    // プログレスバー本体
    this.progressFill = new Graphics();
    this.uiContainer.addChild(this.progressFill);

    // 曲タイトル - スケール対応
    const titleFontSize = Math.max(10, 14 * this.config.SCALE);
    const titleStyle = new TextStyle({
      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
      fontSize: titleFontSize,
      fontWeight: '400',
      fill: COLORS.CREAM,
    });
    const titleText = new Text({ text: '', style: titleStyle });
    titleText.anchor.set(0.5, 0);
    titleText.x = width / 2;
    titleText.y = 28 * this.config.SCALE;
    titleText.alpha = 0.6;
    titleText.name = 'titleText';
    this.uiContainer.addChild(titleText);
  }

  /**
   * 箸を描画（グロー付き）
   */
  private drawChopsticks(): void {
    if (!this.chopsticks || !this.chopsticksGlow || !this.app) return;

    const screenHeight = this.app.screen.height;
    const x = this.config.JUDGE_LINE_X;
    const gap = this.config.CHOPSTICK_GAP;
    const w = this.config.CHOPSTICK_WIDTH;

    // レーンの位置に合わせた箸の高さ
    const laneY = screenHeight - this.config.LANE_BOTTOM_MARGIN - this.config.LANE_HEIGHT / 2;
    const chopstickTop = laneY - this.config.LANE_HEIGHT / 2 - 20;
    const chopstickHeight = this.config.LANE_HEIGHT + 40;

    this.chopsticks.clear();
    this.chopsticksGlow.clear();

    // グロー効果
    const glowAlpha = 0.1 + Math.sin(this.glowPhase) * 0.05;
    this.chopsticksGlow.roundRect(x - gap / 2 - w - 10, chopstickTop, w + 20, chopstickHeight, w)
      .fill({ color: COLORS.CHOPSTICK_GLOW, alpha: glowAlpha });
    this.chopsticksGlow.roundRect(x + gap / 2 - 10, chopstickTop, w + 20, chopstickHeight, w)
      .fill({ color: COLORS.CHOPSTICK_GLOW, alpha: glowAlpha });

    // 左の箸
    this.chopsticks.roundRect(x - gap / 2 - w, chopstickTop, w, chopstickHeight, w / 2).fill(COLORS.CHOPSTICK);
    // ハイライト
    this.chopsticks.roundRect(x - gap / 2 - w + 1, chopstickTop, 3, chopstickHeight, 1)
      .fill({ color: COLORS.CHOPSTICK_HIGHLIGHT, alpha: 0.7 });

    // 右の箸
    this.chopsticks.roundRect(x + gap / 2, chopstickTop, w, chopstickHeight, w / 2).fill(COLORS.CHOPSTICK);
    // ハイライト
    this.chopsticks.roundRect(x + gap / 2 + 1, chopstickTop, 3, chopstickHeight, 1)
      .fill({ color: COLORS.CHOPSTICK_HIGHLIGHT, alpha: 0.7 });

    // 装飾（箸の上部に金のライン）
    this.chopsticks.roundRect(x - gap / 2 - w, chopstickTop + 10, w, 20, 2)
      .fill({ color: COLORS.GOLD, alpha: 0.4 });
    this.chopsticks.roundRect(x + gap / 2, chopstickTop + 10, w, 20, 2)
      .fill({ color: COLORS.GOLD, alpha: 0.4 });
  }

  /**
   * 環境パーティクル（キラキラ・浮遊）
   */
  private setupAmbientParticles(): void {
    if (!this.app || !this.effectsContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // 初期パーティクル
    for (let i = 0; i < 20; i++) {
      this.spawnAmbientParticle(Math.random() * width, Math.random() * height);
    }
  }

  private spawnAmbientParticle(x?: number, y?: number): void {
    if (!this.app || !this.effectsContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    const g = new Graphics();
    const size = 1 + Math.random() * 2;
    g.circle(0, 0, size).fill({ color: COLORS.SPARKLE, alpha: 0.3 + Math.random() * 0.3 });

    this.effectsContainer.addChild(g);

    this.ambientParticles.push({
      x: x ?? Math.random() * width,
      y: y ?? height + 20,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.2 - Math.random() * 0.3,
      alpha: 0.3 + Math.random() * 0.4,
      scale: 0.5 + Math.random() * 0.5,
      life: 1,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      graphic: g,
    });
  }

  /**
   * 譜面を読み込み
   */
  async loadBeatmap(beatmap: Beatmap): Promise<void> {
    this.beatmap = beatmap;
    this.noteManager.loadBeatmap(beatmap);

    // タイトル表示
    if (this.uiContainer) {
      const titleText = this.uiContainer.children.find(c => c.name === 'titleText') as Text;
      if (titleText) {
        titleText.text = beatmap.meta.title;
      }
    }

    const bgmUrl = `/ramen-master${beatmap.audio.bgm}`;
    await this.audioEngine.loadBGM(bgmUrl);
  }

  /**
   * ゲーム開始
   */
  start(): void {
    if (!this.app || !this.beatmap) return;

    this.isRunning = true;
    this.noteManager.reset();
    this.noteGraphics.clear();
    this.steamParticles = [];
    this.hitParticles = [];
    this.glowPhase = 0;
    this.hitFlashAlpha = 0;
    this.screenShake = { x: 0, y: 0 };

    if (this.notesContainer) {
      this.notesContainer.removeChildren();
    }

    this.audioEngine.play(this.beatmap.meta.offset);
    this.app.ticker.add(this.gameLoop);
  }

  /**
   * ゲーム停止
   */
  stop(): void {
    this.isRunning = false;
    this.audioEngine.stop();

    if (this.app?.ticker) {
      this.app.ticker.remove(this.gameLoop);
    }
  }

  /**
   * メインゲームループ
   */
  private gameLoop = (): void => {
    if (!this.isRunning || !this.app) return;

    const currentTime = this.audioEngine.getCurrentTime();
    this.frameCount++;

    // アニメーション更新（グロー更新頻度を最適化）
    this.glowPhase += PARTICLE_CONFIG.GLOW.PHASE_INCREMENT;
    if (this.frameCount % this.config.GLOW_UPDATE_INTERVAL === 0) {
      this.drawChopsticks();
    }

    // 画面シェイク減衰
    this.screenShake.x *= ANIMATION_CONFIG.SCREEN_SHAKE_DECAY;
    this.screenShake.y *= ANIMATION_CONFIG.SCREEN_SHAKE_DECAY;
    if (this.gameContainer) {
      this.gameContainer.x = this.screenShake.x;
      this.gameContainer.y = this.screenShake.y;
    }

    // ヒットフラッシュ減衰（キャッシュを使用）
    if (this.hitFlashAlpha > 0) {
      this.hitFlashAlpha *= ANIMATION_CONFIG.HIT_FLASH_DECAY;
      if (this.cachedHitFlash) {
        this.cachedHitFlash.clear();
        this.cachedHitFlash.rect(0, 0, this.app.screen.width, this.app.screen.height)
          .fill({ color: COLORS.GOLD, alpha: this.hitFlashAlpha });
      }
    }

    this.updateNotes(currentTime);
    this.updateParticles();
    this.updateProgress(currentTime);
    this.spawnSteamParticle();
    if (Math.random() < PARTICLE_CONFIG.AMBIENT.SPAWN_CHANCE) {
      this.spawnAmbientParticle();
    }
    this.checkMissedNotes(currentTime);
    this.checkGameEnd(currentTime);
  };

  /**
   * プログレスバー更新
   */
  private updateProgress(currentTime: number): void {
    if (!this.progressFill || !this.beatmap || !this.app) return;

    const lastNote = this.beatmap.notes[this.beatmap.notes.length - 1];
    const totalTime = lastNote ? lastNote.t + 2 : 1;
    const progress = Math.min(currentTime / totalTime, 1);

    const width = this.app.screen.width;
    const progressWidth = Math.min(300, width * 0.4);
    const progressHeight = Math.max(2, 4 * this.config.SCALE);
    const progressY = 17 * this.config.SCALE;
    this.progressFill.clear();
    this.progressFill.roundRect(width / 2 - progressWidth / 2 + 2, progressY, (progressWidth - 4) * progress, progressHeight, 1)
      .fill(COLORS.GOLD);
  }

  /**
   * ノーツ更新
   */
  private updateNotes(currentTime: number): void {
    if (!this.notesContainer || !this.app) return;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    // レーンと同じ位置（画面下部）
    const laneY = screenHeight - this.config.LANE_BOTTOM_MARGIN - this.config.LANE_HEIGHT / 2;
    const noteY = laneY - this.config.NOTE_HEIGHT / 2;

    this.noteManager.getNotes().forEach((note, index) => {
      if (note.hit) {
        const container = this.noteGraphics.get(index);
        if (container) container.visible = false;
        return;
      }

      const timeDiff = note.t - currentTime;
      const noteX = this.config.JUDGE_LINE_X + timeDiff * this.config.NOTE_SPEED;

      if (noteX > screenWidth + this.config.NOTE_WIDTH || noteX < -this.config.NOTE_WIDTH) {
        const container = this.noteGraphics.get(index);
        if (container) container.visible = false;
        return;
      }

      let container = this.noteGraphics.get(index);
      if (!container && this.notesContainer) {
        container = this.createNoteGraphic();
        this.notesContainer.addChild(container);
        this.noteGraphics.set(index, container);
      }

      if (!container) return;

      container.visible = true;
      container.x = noteX - this.config.NOTE_WIDTH / 2;
      container.y = noteY;

      // 判定ラインに近づくほど光る
      const distance = Math.abs(noteX - this.config.JUDGE_LINE_X);
      const glowIntensity = Math.max(0, 1 - distance / 200);

      // children: [0]=glow, [1]=shadow, [2]=note
      const glowGraphic = container.children[0] as Graphics;
      const noteGraphic = container.children[2] as Graphics;

      if (glowGraphic) glowGraphic.alpha = glowIntensity * 0.7;
      if (noteGraphic) noteGraphic.alpha = 0.85 + glowIntensity * 0.15;
    });
  }

  /**
   * リッチなノーツ作成（円形）
   */
  private createNoteGraphic(): Container {
    const container = new Container();
    const size = this.config.NOTE_WIDTH;
    const radius = size / 2;

    // グロー（背景）
    const glow = new Graphics();
    glow.circle(radius, radius, radius + 10).fill({ color: COLORS.NOODLE_GLOW, alpha: 0 });
    container.addChild(glow);

    // 影
    const shadow = new Graphics();
    shadow.circle(radius + 3, radius + 4, radius).fill({ color: 0x000000, alpha: 0.3 });
    container.addChild(shadow);

    // メインノーツ（円形・丼のイメージ）
    const note = new Graphics();
    // ベース色（温かみのある色）
    note.circle(radius, radius, radius).fill(COLORS.NOODLE);
    // 外枠（金色）
    note.circle(radius, radius, radius).stroke({ color: COLORS.GOLD, width: 3 });
    // 内側の円（丼の縁をイメージ）
    note.circle(radius, radius, radius * 0.7).stroke({ color: COLORS.GOLD, width: 1.5, alpha: 0.5 });
    // 上部ハイライト（立体感）
    note.ellipse(radius, radius * 0.6, radius * 0.6, radius * 0.3).fill({ color: 0xffffff, alpha: 0.4 });
    // 中央の光点
    note.circle(radius * 0.7, radius * 0.5, radius * 0.15).fill({ color: 0xffffff, alpha: 0.7 });
    container.addChild(note);

    return container;
  }

  /**
   * 湯気パーティクル
   */
  private spawnSteamParticle(): void {
    if (!this.app || !this.effectsContainer || Math.random() > 0.2) return;

    const height = this.app.screen.height;
    const bowlX = this.config.JUDGE_LINE_X;

    const g = new Graphics();
    const size = 4 + Math.random() * 6;
    g.circle(0, 0, size).fill({ color: COLORS.STEAM, alpha: 0.08 });
    this.effectsContainer.addChild(g);

    this.steamParticles.push({
      x: bowlX + (Math.random() - 0.5) * 60,
      y: height - 100,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -1.5 - Math.random() * 1,
      alpha: 0.08 + Math.random() * 0.05,
      scale: 0.8 + Math.random() * 0.4,
      life: 1,
      graphic: g,
    });
  }

  /**
   * ヒットパーティクル
   */
  private spawnHitParticles(x: number, y: number, color: number, count: number = 16): void {
    if (!this.effectsContainer) return;

    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      const size = 2 + Math.random() * 4;
      g.circle(0, 0, size).fill({ color, alpha: 0.9 });
      this.effectsContainer.addChild(g);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 4 + Math.random() * 6;

      this.hitParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        scale: 1,
        life: 1,
        graphic: g,
      });
    }

    // リング効果
    const ring = new Graphics();
    ring.circle(x, y, 10).stroke({ color, width: 3, alpha: 0.8 });
    this.effectsContainer.addChild(ring);

    this.hitParticles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      alpha: 0.8,
      scale: 1,
      life: 1,
      graphic: ring,
    });
  }

  /**
   * パーティクル更新（副作用を分離した設計）
   */
  private updateParticles(): void {
    this.steamParticles = this.updateSteamParticles(this.steamParticles);
    this.hitParticles = this.updateHitParticles(this.hitParticles);
    this.ambientParticles = this.updateAmbientParticles(this.ambientParticles);
  }

  /**
   * 湯気パーティクル更新
   */
  private updateSteamParticles(particles: Particle[]): Particle[] {
    const aliveParticles: Particle[] = [];
    const config = PARTICLE_CONFIG.STEAM;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= config.DECAY;
      p.alpha *= config.ALPHA_DECAY;
      p.scale *= config.SCALE_GROW;

      p.graphic.x = p.x;
      p.graphic.y = p.y;
      p.graphic.alpha = p.alpha;
      p.graphic.scale.set(p.scale);

      if (p.life > 0 && p.y >= -50) {
        aliveParticles.push(p);
      } else {
        p.graphic.destroy();
      }
    }
    return aliveParticles;
  }

  /**
   * ヒットエフェクトパーティクル更新
   */
  private updateHitParticles(particles: Particle[]): Particle[] {
    const aliveParticles: Particle[] = [];
    const config = PARTICLE_CONFIG.HIT;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += config.GRAVITY;
      p.life -= config.DECAY;
      p.alpha = p.life;
      // リング（vx===0）か通常パーティクルかで挙動を変える
      p.scale *= (p.vx === 0 ? config.RING_SCALE_GROW : config.PARTICLE_SCALE_SHRINK);

      p.graphic.x = p.x;
      p.graphic.y = p.y;
      p.graphic.alpha = p.alpha;
      p.graphic.scale.set(p.scale);

      if (p.life > 0) {
        aliveParticles.push(p);
      } else {
        p.graphic.destroy();
      }
    }
    return aliveParticles;
  }

  /**
   * 環境パーティクル更新
   */
  private updateAmbientParticles(particles: Particle[]): Particle[] {
    const aliveParticles: Particle[] = [];
    const config = PARTICLE_CONFIG.AMBIENT;

    for (const p of particles) {
      p.x += p.vx + Math.sin(p.y / config.WAVE_FREQUENCY) * config.WAVE_AMPLITUDE;
      p.y += p.vy;
      p.life -= config.DECAY;
      p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);

      p.graphic.x = p.x;
      p.graphic.y = p.y;
      p.graphic.alpha = p.alpha * p.life;
      p.graphic.rotation = p.rotation || 0;

      if (p.life > 0 && p.y >= -20) {
        aliveParticles.push(p);
      } else {
        p.graphic.destroy();
      }
    }
    return aliveParticles;
  }

  /**
   * ミス判定
   */
  private checkMissedNotes(currentTime: number): void {
    const missedNotes = this.noteManager.checkMissedNotes(currentTime);
    missedNotes.forEach(() => {
      this.showJudgment('MISS');
      this.onScoreUpdate?.('MISS');
      // 画面シェイク
      this.screenShake.x = (Math.random() - 0.5) * 8;
      this.screenShake.y = (Math.random() - 0.5) * 8;
    });
  }

  /**
   * ゲーム終了チェック
   */
  private checkGameEnd(currentTime: number): void {
    if (!this.beatmap) return;

    const lastNoteTime = this.beatmap.notes[this.beatmap.notes.length - 1]?.t ?? 0;
    const isAfterLastNote = currentTime > lastNoteTime + 2;
    const allProcessed = this.noteManager.isAllNotesProcessed();

    // デバッグログ
    if (isAfterLastNote && !this.isRunning) {
      console.log('[checkGameEnd] Already stopped');
    }

    if (allProcessed && isAfterLastNote) {
      console.log('[checkGameEnd] Conditions met, isRunning:', this.isRunning);
      if (!this.isRunning) return;
      this.isRunning = false; // 重複呼び出し防止
      console.log('[checkGameEnd] Starting ending sequence...');
      this.safeSetTimeout(() => {
        console.log('[checkGameEnd] safeSetTimeout callback fired');
        this.stop();
        this.playEndingAnimation();
      }, ANIMATION_CONFIG.GAME_END_DELAY);
    }
  }

  /**
   * 終了アニメーション（店主ズームイン + ありがとうございました）
   */
  private async playEndingAnimation(): Promise<void> {
    console.log('[playEndingAnimation] Starting, app:', !!this.app, 'gameContainer:', !!this.gameContainer);
    if (!this.app || !this.gameContainer) {
      console.log('[playEndingAnimation] No app or container, calling onGameEnd directly');
      this.onGameEnd?.();
      return;
    }

    this.isEndingAnimation = true;
    console.log('[playEndingAnimation] isEndingAnimation set to true');

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // 暗転用オーバーレイ
    const overlay = new Graphics();
    overlay.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0 });
    this.app.stage.addChild(overlay);

    // 店主画像（thanks: ありがとうございました）を中央に配置
    const thanksSprite = this.chefSprites.get('thanks');
    let endingSprite: Sprite | null = null;

    if (thanksSprite) {
      // 新しいスプライトを作成（元のは非表示に）
      endingSprite = new Sprite(thanksSprite.texture);
      endingSprite.anchor.set(0.5);
      endingSprite.x = width / 2;
      endingSprite.y = height / 2;
      endingSprite.scale.set(0.3);
      endingSprite.alpha = 0;
      this.app.stage.addChild(endingSprite);
    }

    // アニメーション
    let frame = 0;
    const totalFrames = 60; // 約1秒
    let sePlayed = false;

    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      const easeOut = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      // オーバーレイをフェードイン
      overlay.clear();
      overlay.rect(0, 0, width, height).fill({ color: 0x1a0f0a, alpha: easeOut * 0.85 });

      // 店主画像をズームイン＆フェードイン
      if (endingSprite) {
        endingSprite.alpha = easeOut;
        const targetScale = Math.min(height * 0.85 / endingSprite.texture.height, 1.0);
        endingSprite.scale.set(0.3 + (targetScale - 0.3) * easeOut);
        // 少し上下に揺れる
        endingSprite.y = height / 2 + Math.sin(frame * 0.1) * 3;
      }

      // 画像が表示されたら音声を再生
      if (!sePlayed && progress > 0.3) {
        sePlayed = true;
        this.audioEngine.playSE('/ramen-master/audio/se/thanks.m4a');
      }

      if (frame < totalFrames) {
        this.safeRequestAnimationFrame(animate);
      } else {
        // アニメーション完了後、音声が終わるまで待ってからリザルトへ
        console.log('[playEndingAnimation] Animation complete, waiting 1500ms');
        this.safeSetTimeout(() => {
          console.log('[playEndingAnimation] Final timeout fired, calling onGameEnd');
          // クリーンアップ
          overlay.destroy();
          if (endingSprite) endingSprite.destroy();
          this.isEndingAnimation = false;
          this.onGameEnd?.();
        }, 1500); // 音声再生時間を考慮
      }
    };

    animate();
  }

  /**
   * 入力処理
   */
  handleInput(): void {
    if (!this.isRunning || !this.app) return;

    const currentTime = this.audioEngine.getCurrentTime();
    const judgment = this.noteManager.judge(currentTime);

    if (judgment) {
      this.showJudgment(judgment);
      this.onScoreUpdate?.(judgment);

      if (judgment !== 'MISS') {
        // レーンのY座標でパーティクル発生
        const laneY = this.app.screen.height - this.config.LANE_BOTTOM_MARGIN - this.config.LANE_HEIGHT / 2;
        const particleCount = judgment === 'PERFECT' ? 24 : judgment === 'GREAT' ? 16 : 12;
        this.spawnHitParticles(this.config.JUDGE_LINE_X, laneY, JUDGMENT_COLORS[judgment], particleCount);

        // PERFECTでフラッシュ
        if (judgment === 'PERFECT') {
          this.hitFlashAlpha = 0.15;
        }
      }
    }
  }

  /**
   * 判定表示
   */
  private showJudgment(judgment: JudgmentType): void {
    if (!this.judgmentText || !this.judgmentSubText) return;

    const color = JUDGMENT_COLORS[judgment];

    this.judgmentText.text = JUDGMENT_TEXT[judgment];
    this.judgmentText.style.fill = color;
    // dropShadowの型安全な更新
    const dropShadow = this.judgmentText.style.dropShadow;
    if (dropShadow && typeof dropShadow === 'object') {
      this.judgmentText.style.dropShadow = { ...dropShadow, color };
    }
    this.judgmentText.alpha = 1;
    this.judgmentText.scale.set(1.5);

    this.judgmentSubText.text = judgment;
    this.judgmentSubText.style.fill = color;
    this.judgmentSubText.alpha = 0.9;

    // 店主画像を切り替え
    const chefState = judgment === 'PERFECT' ? 'perfect'
                    : judgment === 'GREAT' ? 'happy'
                    : judgment === 'GOOD' ? 'yukiri'
                    : 'taste'; // MISS時は味見ポーズ
    this.setChefState(chefState);

    // 一定時間後に待機状態に戻す
    this.safeSetTimeout(() => {
      this.setChefState('taste');
    }, 500);

    const fadeOut = () => {
      if (!this.judgmentText || !this.judgmentSubText) return;
      this.judgmentText.alpha -= ANIMATION_CONFIG.JUDGMENT_FADE_SPEED;
      this.judgmentSubText.alpha -= ANIMATION_CONFIG.JUDGMENT_FADE_SPEED;
      this.judgmentText.scale.set(this.judgmentText.scale.x * ANIMATION_CONFIG.JUDGMENT_SCALE_SHRINK);
      if (this.judgmentText.alpha > 0) {
        this.safeRequestAnimationFrame(fadeOut);
      }
    };
    this.safeSetTimeout(fadeOut, ANIMATION_CONFIG.JUDGMENT_DISPLAY_DURATION);
  }

  /**
   * スコア更新
   */
  updateScore(score: number, combo: number): void {
    if (this.scoreText) {
      this.scoreText.text = score.toLocaleString();
    }
    if (this.comboText && this.comboLabel) {
      if (combo > 0) {
        this.comboText.text = `${combo}`;
        this.comboText.scale.set(1 + Math.min(combo, 100) * 0.003);
        this.comboLabel.alpha = 0.7;
      } else {
        this.comboText.text = '';
        this.comboLabel.alpha = 0;
      }
    }
  }

  /**
   * コールバック設定
   */
  setCallbacks(
    onScoreUpdate: (judgment: JudgmentType) => void,
    onGameEnd: () => void
  ): void {
    this.onScoreUpdate = onScoreUpdate;
    this.onGameEnd = onGameEnd;
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.stop();
    this.clearAllTimersAndFrames();
    this.audioEngine.dispose();

    this.steamParticles.forEach((p) => p.graphic.destroy());
    this.hitParticles.forEach((p) => p.graphic.destroy());
    this.ambientParticles.forEach((p) => p.graphic.destroy());
    this.steamParticles = [];
    this.hitParticles = [];
    this.ambientParticles = [];

    const app = this.app;
    this.app = null;
    this.gameContainer = null;
    this.bgContainer = null;
    this.laneContainer = null;
    this.bowlContainer = null;
    this.notesContainer = null;
    this.effectsContainer = null;
    this.uiContainer = null;
    this.chopsticks = null;
    this.chopsticksGlow = null;
    this.judgmentText = null;
    this.judgmentSubText = null;
    this.scoreText = null;
    this.comboText = null;
    this.comboLabel = null;
    this.progressBar = null;
    this.progressFill = null;
    this.cachedHitFlash = null;
    this.noteGraphics.clear();
    this.frameCount = 0;

    if (app) {
      try {
        app.destroy(true);
      } catch (e) {
        console.warn('App already destroyed:', e);
      }
    }
  }

  /**
   * スコアデータ取得
   */
  getScoreData(): ScoreData {
    return this.noteManager.getScoreData();
  }

  /**
   * 安全なsetTimeout（dispose時に自動クリア）
   */
  private safeSetTimeout(callback: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      this.activeTimers.delete(id);
      const canRun = this.isRunning || this.isEndingAnimation || ms === ANIMATION_CONFIG.GAME_END_DELAY;
      console.log(`[safeSetTimeout] ms=${ms}, isRunning=${this.isRunning}, isEndingAnimation=${this.isEndingAnimation}, canRun=${canRun}`);
      if (canRun) {
        callback();
      } else {
        console.log('[safeSetTimeout] Callback NOT executed');
      }
    }, ms);
    this.activeTimers.add(id);
    return id;
  }

  /**
   * 安全なrequestAnimationFrame（dispose時に自動クリア）
   */
  private safeRequestAnimationFrame(callback: () => void): number {
    const id = window.requestAnimationFrame(() => {
      this.activeAnimationFrames.delete(id);
      callback();
    });
    this.activeAnimationFrames.add(id);
    return id;
  }

  /**
   * 全てのタイマーとアニメーションフレームをクリア
   */
  private clearAllTimersAndFrames(): void {
    this.activeTimers.forEach(id => window.clearTimeout(id));
    this.activeTimers.clear();
    this.activeAnimationFrames.forEach(id => window.cancelAnimationFrame(id));
    this.activeAnimationFrames.clear();
  }

  /**
   * 色補間
   */
  private lerpColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }
}
