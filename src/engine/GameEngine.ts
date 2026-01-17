import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AudioEngine } from './AudioEngine';
import { NoteManager } from './NoteManager';
import type { Beatmap, JudgmentType, ScoreData } from '../types';

// ゲーム設定
const GAME_CONFIG = {
  // 判定ラインのX座標（画面左端からの距離）
  JUDGE_LINE_X: 150,
  // ノーツの移動速度（px/秒）
  NOTE_SPEED: 400,
  // ノーツのサイズ
  NOTE_WIDTH: 60,
  NOTE_HEIGHT: 20,
  // 判定ラインの見た目
  JUDGE_LINE_WIDTH: 8,
  JUDGE_LINE_COLOR: 0xffcc00,
  // 背景色
  BG_COLOR: 0x1a0a00,
} as const;

// 判定エフェクトの色
const JUDGMENT_COLORS: Record<JudgmentType, number> = {
  PERFECT: 0xffd700,
  GREAT: 0x00ff00,
  GOOD: 0x00bfff,
  MISS: 0xff0000,
};

/**
 * GameEngine - PixiJSを使用したゲーム描画エンジン
 */
export class GameEngine {
  private app: Application | null = null;
  private audioEngine: AudioEngine;
  private noteManager: NoteManager;

  // PixiJS コンテナ・グラフィックス
  private gameContainer: Container | null = null;
  private notesContainer: Container | null = null;
  private judgeLine: Graphics | null = null;
  private judgmentText: Text | null = null;
  private scoreText: Text | null = null;
  private comboText: Text | null = null;

  // ゲーム状態
  private isRunning: boolean = false;
  private beatmap: Beatmap | null = null;
  private noteGraphics: Map<number, Graphics> = new Map();

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
    // PixiJS Application作成
    this.app = new Application();
    await this.app.init({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      backgroundColor: GAME_CONFIG.BG_COLOR,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // AudioEngine初期化
    await this.audioEngine.init();

    // ゲームコンテナ作成
    this.setupContainers();
    this.setupUI();
  }

  /**
   * コンテナをセットアップ
   */
  private setupContainers(): void {
    if (!this.app) return;

    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);

    this.notesContainer = new Container();
    this.gameContainer.addChild(this.notesContainer);
  }

  /**
   * UI要素をセットアップ
   */
  private setupUI(): void {
    if (!this.app || !this.gameContainer) return;

    const height = this.app.screen.height;

    // 判定ライン
    this.judgeLine = new Graphics();
    this.judgeLine
      .rect(
        GAME_CONFIG.JUDGE_LINE_X - GAME_CONFIG.JUDGE_LINE_WIDTH / 2,
        0,
        GAME_CONFIG.JUDGE_LINE_WIDTH,
        height
      )
      .fill(GAME_CONFIG.JUDGE_LINE_COLOR);
    this.gameContainer.addChild(this.judgeLine);

    // 判定テキスト
    const judgmentStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 4 },
    });
    this.judgmentText = new Text({ text: '', style: judgmentStyle });
    this.judgmentText.anchor.set(0.5);
    this.judgmentText.x = this.app.screen.width / 2;
    this.judgmentText.y = this.app.screen.height / 2;
    this.judgmentText.alpha = 0;
    this.gameContainer.addChild(this.judgmentText);

    // スコアテキスト
    const scoreStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    this.scoreText = new Text({ text: 'SCORE: 0', style: scoreStyle });
    this.scoreText.x = 20;
    this.scoreText.y = 20;
    this.gameContainer.addChild(this.scoreText);

    // コンボテキスト
    const comboStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0xffcc00,
    });
    this.comboText = new Text({ text: '', style: comboStyle });
    this.comboText.anchor.set(0.5);
    this.comboText.x = this.app.screen.width / 2;
    this.comboText.y = this.app.screen.height - 60;
    this.gameContainer.addChild(this.comboText);
  }

  /**
   * 譜面を読み込んでゲームを準備
   */
  async loadBeatmap(beatmap: Beatmap): Promise<void> {
    this.beatmap = beatmap;
    this.noteManager.loadBeatmap(beatmap);

    // BGMを読み込み（存在しない場合は無視）
    const bgmUrl = `/ramen-master${beatmap.audio.bgm}`;
    await this.audioEngine.loadBGM(bgmUrl);
  }

  /**
   * ゲームを開始
   */
  start(): void {
    if (!this.app || !this.beatmap) return;

    this.isRunning = true;
    this.noteManager.reset();
    this.noteGraphics.clear();

    // ノーツのグラフィックスをクリア
    if (this.notesContainer) {
      this.notesContainer.removeChildren();
    }

    // 音楽再生開始
    this.audioEngine.play(this.beatmap.meta.offset);

    // ゲームループ開始
    this.app.ticker.add(this.gameLoop);
  }

  /**
   * ゲームを停止
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
    this.updateNotes(currentTime);
    this.checkMissedNotes(currentTime);
    this.checkGameEnd(currentTime);
  };

  /**
   * ノーツの位置を更新・描画
   */
  private updateNotes(currentTime: number): void {
    if (!this.notesContainer || !this.app) return;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const noteY = screenHeight / 2 - GAME_CONFIG.NOTE_HEIGHT / 2;

    // 各ノーツを更新
    this.noteManager.getNotes().forEach((note, index) => {
      // 判定済みのノーツはスキップ
      if (note.hit) {
        const graphic = this.noteGraphics.get(index);
        if (graphic) {
          graphic.visible = false;
        }
        return;
      }

      // ノーツのX座標を計算
      // 時刻がnote.tの時に判定ライン上に来るように
      const timeDiff = note.t - currentTime;
      const noteX = GAME_CONFIG.JUDGE_LINE_X + timeDiff * GAME_CONFIG.NOTE_SPEED;

      // 画面外のノーツは描画しない
      if (noteX > screenWidth + GAME_CONFIG.NOTE_WIDTH || noteX < -GAME_CONFIG.NOTE_WIDTH) {
        const graphic = this.noteGraphics.get(index);
        if (graphic) {
          graphic.visible = false;
        }
        return;
      }

      // グラフィックスを取得または作成
      let graphic = this.noteGraphics.get(index);
      if (!graphic && this.notesContainer) {
        graphic = new Graphics();
        graphic
          .roundRect(0, 0, GAME_CONFIG.NOTE_WIDTH, GAME_CONFIG.NOTE_HEIGHT, 6)
          .fill(0xff6b00)
          .stroke({ color: 0xffffff, width: 2 });
        this.notesContainer.addChild(graphic);
        this.noteGraphics.set(index, graphic);
      }

      if (!graphic) return;

      graphic.visible = true;
      graphic.x = noteX - GAME_CONFIG.NOTE_WIDTH / 2;
      graphic.y = noteY;
    });
  }

  /**
   * 見逃したノーツをチェック
   */
  private checkMissedNotes(currentTime: number): void {
    const missedNotes = this.noteManager.checkMissedNotes(currentTime);
    missedNotes.forEach(() => {
      this.showJudgment('MISS');
      this.onScoreUpdate?.('MISS');
    });
  }

  /**
   * ゲーム終了をチェック
   */
  private checkGameEnd(currentTime: number): void {
    if (!this.beatmap) return;

    // 全ノーツ処理済み、かつ最後のノーツから2秒経過したら終了
    const lastNoteTime = this.beatmap.notes[this.beatmap.notes.length - 1]?.t ?? 0;
    const isAfterLastNote = currentTime > lastNoteTime + 2;

    if (this.noteManager.isAllNotesProcessed() && isAfterLastNote) {
      // 二重呼び出し防止
      if (!this.isRunning) return;

      // 少し待ってから終了
      setTimeout(() => {
        this.stop();
        this.onGameEnd?.();
      }, 500);
    }
  }

  /**
   * プレイヤー入力を処理
   */
  handleInput(): void {
    if (!this.isRunning) return;

    const currentTime = this.audioEngine.getCurrentTime();
    const judgment = this.noteManager.judge(currentTime);

    if (judgment) {
      this.showJudgment(judgment);
      this.onScoreUpdate?.(judgment);
    }
  }

  /**
   * 判定エフェクトを表示
   */
  private showJudgment(judgment: JudgmentType): void {
    if (!this.judgmentText) return;

    this.judgmentText.text = judgment;
    this.judgmentText.style.fill = JUDGMENT_COLORS[judgment];
    this.judgmentText.alpha = 1;
    this.judgmentText.scale.set(1.2);

    // フェードアウトアニメーション
    const fadeOut = () => {
      if (!this.judgmentText) return;
      this.judgmentText.alpha -= 0.05;
      this.judgmentText.scale.set(this.judgmentText.scale.x * 0.98);
      if (this.judgmentText.alpha > 0) {
        requestAnimationFrame(fadeOut);
      }
    };
    setTimeout(fadeOut, 200);
  }

  /**
   * スコア表示を更新
   */
  updateScore(score: number, combo: number): void {
    if (this.scoreText) {
      this.scoreText.text = `SCORE: ${score.toLocaleString()}`;
    }
    if (this.comboText) {
      this.comboText.text = combo > 0 ? `${combo} COMBO` : '';
    }
  }

  /**
   * コールバックを設定
   */
  setCallbacks(
    onScoreUpdate: (judgment: JudgmentType) => void,
    onGameEnd: () => void
  ): void {
    this.onScoreUpdate = onScoreUpdate;
    this.onGameEnd = onGameEnd;
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.stop();
    this.audioEngine.dispose();

    // appの参照を先にクリアしてから破棄
    const app = this.app;
    this.app = null;
    this.gameContainer = null;
    this.notesContainer = null;
    this.judgeLine = null;
    this.judgmentText = null;
    this.scoreText = null;
    this.comboText = null;
    this.noteGraphics.clear();

    if (app) {
      try {
        app.destroy(true);
      } catch (e) {
        // 既に破棄されている場合は無視
        console.warn('App already destroyed:', e);
      }
    }
  }

  /**
   * スコアデータを取得
   */
  getScoreData(): ScoreData {
    return this.noteManager.getScoreData();
  }
}
