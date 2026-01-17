import type { Beatmap, Note, JudgmentType, ScoreData, JudgmentCounts } from '../types';
import { JUDGMENT_WINDOWS, SCORE_VALUES } from '../types';

/**
 * NoteManager - ノーツの管理と判定処理
 */
export class NoteManager {
  private notes: Note[] = [];

  // スコア追跡
  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private judgments: JudgmentCounts = {
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
  };

  /**
   * 譜面を読み込み
   */
  loadBeatmap(beatmap: Beatmap): void {
    // ノーツをディープコピー（元データを変更しないため）
    this.notes = beatmap.notes.map((note) => ({
      t: note.t,
      hit: false,
      judgment: undefined,
    }));
    // 時刻順にソート
    this.notes.sort((a, b) => a.t - b.t);
    this.reset();
  }

  /**
   * 状態をリセット
   */
  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.judgments = {
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
    };

    // ノーツの判定状態をリセット
    this.notes.forEach((note) => {
      note.hit = false;
      note.judgment = undefined;
    });
  }

  /**
   * ノーツ配列を取得
   */
  getNotes(): Note[] {
    return this.notes;
  }

  /**
   * プレイヤー入力に対する判定を行う
   * @param currentTime 現在のゲーム時刻（秒）
   * @returns 判定結果（該当ノーツがなければnull）
   */
  judge(currentTime: number): JudgmentType | null {
    // 判定可能なノーツを探す（時刻順に最も近いもの）
    let closestNote: Note | null = null;
    let closestDiff = Infinity;

    for (const note of this.notes) {
      if (note.hit) continue;

      const diff = Math.abs(note.t - currentTime) * 1000; // ミリ秒に変換

      // 判定ウィンドウ外は無視
      if (diff > JUDGMENT_WINDOWS.GOOD) continue;

      if (diff < closestDiff) {
        closestDiff = diff;
        closestNote = note;
      }
    }

    if (!closestNote) return null;

    // 判定を決定
    let judgment: JudgmentType;
    if (closestDiff <= JUDGMENT_WINDOWS.PERFECT) {
      judgment = 'PERFECT';
    } else if (closestDiff <= JUDGMENT_WINDOWS.GREAT) {
      judgment = 'GREAT';
    } else {
      judgment = 'GOOD';
    }

    // ノーツを判定済みにする
    closestNote.hit = true;
    closestNote.judgment = judgment;

    // スコア更新
    this.addJudgment(judgment);

    return judgment;
  }

  /**
   * 見逃したノーツをチェック
   * @param currentTime 現在のゲーム時刻（秒）
   * @returns 見逃したノーツの配列
   */
  checkMissedNotes(currentTime: number): Note[] {
    const missedNotes: Note[] = [];

    for (const note of this.notes) {
      if (note.hit) continue;

      // 判定ウィンドウを過ぎたらMISS
      const diff = (currentTime - note.t) * 1000;
      if (diff > JUDGMENT_WINDOWS.GOOD) {
        note.hit = true;
        note.judgment = 'MISS';
        missedNotes.push(note);
        this.addJudgment('MISS');
      }
    }

    return missedNotes;
  }

  /**
   * 判定をスコアに反映
   */
  private addJudgment(judgment: JudgmentType): void {
    this.score += SCORE_VALUES[judgment];

    const key = judgment.toLowerCase() as keyof JudgmentCounts;
    this.judgments[key]++;

    if (judgment === 'MISS') {
      this.combo = 0;
    } else {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    }
  }

  /**
   * 全ノーツが処理済みかチェック
   */
  isAllNotesProcessed(): boolean {
    return this.notes.every((note) => note.hit);
  }

  /**
   * 現在のスコアを取得
   */
  getScore(): number {
    return this.score;
  }

  /**
   * 現在のコンボを取得
   */
  getCombo(): number {
    return this.combo;
  }

  /**
   * スコアデータを取得
   */
  getScoreData(): ScoreData {
    return {
      score: this.score,
      maxCombo: this.maxCombo,
      judgments: { ...this.judgments },
    };
  }
}
