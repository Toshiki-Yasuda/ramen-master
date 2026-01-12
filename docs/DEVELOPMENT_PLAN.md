# 湯切りますたー 開発計画

## 現状サマリー

### 実装済み
- 型定義（GameState, Judgment, Note, Beatmap等）
- UI基盤（タイトル画面、ローディング画面）
- ゲーム設定・定数（判定ウィンドウ、カオスイベント、ラーメン進化）
- Framer Motionアニメーション定義

### 未実装（コア機能）
- Tone.jsオーディオ管理
- ゲームループ
- ノーツ判定システム
- ゲーム画面UI
- 入力処理

---

## 開発フェーズ

### Phase 1: オーディオ基盤 (優先度: 最高)
> 音ゲーの心臓部。すべてのタイミングはここから始まる

#### 1.1 useAudioManager Hook
```
目的: Tone.jsを使った音声再生・同期管理
機能:
  - BGM読み込み・再生・停止
  - SE再生（タップ音、判定音）
  - 現在の再生時刻取得（高精度）
  - オフセット調整機能
```

#### 1.2 Tone.Transport連携
```
目的: ゲーム全体の時間管理
機能:
  - BPMベースのタイミング管理
  - 一時停止/再開
  - シーク機能
```

**成果物:**
- `src/hooks/useAudioManager.ts`
- `src/hooks/useToneTransport.ts`

---

### Phase 2: ゲームエンジン (優先度: 高)
> 判定ロジックとゲームループ

#### 2.1 useGameLoop Hook
```
目的: requestAnimationFrameベースのゲームループ
機能:
  - delta time計算
  - 音声時刻との同期
  - フレームレート非依存の更新
```

#### 2.2 useJudgment Hook
```
目的: ノーツ判定ロジック
機能:
  - 入力タイムスタンプと音声時刻の比較
  - PERFECT/GREAT/GOOD/MISS判定
  - FAST/SLOW判定
  - 判定結果の記録
```

#### 2.3 useGameState Hook
```
目的: ゲーム状態管理
機能:
  - スコア、コンボ管理
  - ノーツキュー管理
  - ゲーム進行状態
```

**成果物:**
- `src/hooks/useGameLoop.ts`
- `src/hooks/useJudgment.ts`
- `src/hooks/useGameState.ts`

---

### Phase 3: ゲーム画面UI (優先度: 高)
> プレイヤーが操作する画面

#### 3.1 GameScreen コンポーネント
```
構成:
  - 背景（ラーメン屋）
  - 店主キャラクター（中央）
  - ノーツレーン
  - 判定ライン
  - スコア/コンボ表示
  - プログレスバー
```

#### 3.2 NoteRenderer コンポーネント
```
目的: ノーツの描画
機能:
  - 流れてくるノーツの表示
  - ノーツ種類による見た目変更
  - タイミングに応じた位置計算
```

#### 3.3 JudgmentDisplay コンポーネント
```
目的: 判定結果の表示
機能:
  - PERFECT/GREAT/GOOD/MISS表示
  - FAST/SLOW表示
  - アニメーション付き
```

**成果物:**
- `src/components/Game/GameScreen.tsx`
- `src/components/Game/NoteRenderer.tsx`
- `src/components/Game/JudgmentDisplay.tsx`
- `src/components/Game/ScoreDisplay.tsx`

---

### Phase 4: 入力システム (優先度: 高)
> プレイヤーの操作を受け付ける

#### 4.1 useInput Hook
```
目的: タッチ/キーボード入力処理
機能:
  - タイムスタンプ付き入力イベント
  - マルチタッチ対応
  - キーボードフォールバック
```

**成果物:**
- `src/hooks/useInput.ts`

---

### Phase 5: 演出・フィードバック (優先度: 中)
> ゲームを楽しくする要素

#### 5.1 Chef コンポーネント
```
目的: 店主キャラクターの表示
機能:
  - 判定に応じた表情変化
  - 湯切りアニメーション
  - カオスイベント時の特殊演出
```

#### 5.2 ChaosEvent コンポーネント
```
目的: カオスイベントの発動
機能:
  - スコアに応じた発動判定
  - 各種演出表示
```

#### 5.3 RamenEvolution コンポーネント
```
目的: ラーメン進化表示
機能:
  - コンボに応じた進化
  - 進化時のエフェクト
```

**成果物:**
- `src/components/Chef/ChefCharacter.tsx`
- `src/components/Chaos/ChaosEvent.tsx`
- `src/components/Ramen/RamenEvolution.tsx`

---

### Phase 6: 結果・設定画面 (優先度: 中)
> ゲーム体験の完成

#### 6.1 ResultScreen
```
機能:
  - 最終スコア表示
  - 判定内訳
  - 最大コンボ
  - リトライ/タイトルへ戻る
```

#### 6.2 CalibrationScreen
```
機能:
  - 音声オフセット調整
  - 映像オフセット調整
  - 自動キャリブレーション
```

**成果物:**
- `src/components/UI/ResultScreen.tsx`
- `src/components/UI/CalibrationScreen.tsx`

---

### Phase 7: 譜面・コンテンツ (優先度: 低)
> 実際のゲームコンテンツ

#### 7.1 譜面データ作成
```
形式: JSON
内容:
  - 曲情報（BPM、オフセット）
  - ノーツ配置
  - カオスイベントタイミング
```

#### 7.2 譜面エディタ（将来）
```
機能:
  - 曲を聴きながらノーツ配置
  - プレビュー機能
```

---

## 実装順序（推奨）

```
Week 1: Phase 1 (オーディオ基盤)
  └─ useAudioManager, useToneTransport

Week 2: Phase 2 (ゲームエンジン)
  └─ useGameLoop, useJudgment, useGameState

Week 3: Phase 3-4 (ゲーム画面 + 入力)
  └─ GameScreen, NoteRenderer, useInput

Week 4: Phase 5-6 (演出 + 結果画面)
  └─ Chef, ChaosEvent, ResultScreen

継続: Phase 7 (コンテンツ)
  └─ 譜面データ、楽曲
```

---

## 技術的注意点

### 1. タイミング精度
```javascript
// ❌ 避けるべき
const now = Date.now();
const now = performance.now();

// ✅ 使うべき
const now = Tone.Transport.seconds;
const now = audioContext.currentTime;
```

### 2. 描画と音声の分離
```javascript
// 音声スケジューリング（別スレッド）
Tone.Transport.schedule((time) => {
  synth.triggerAttackRelease("C4", "8n", time);
}, "0:0:0");

// 描画（メインスレッド、Tone.Draw経由）
Tone.Draw.schedule(() => {
  updateVisuals();
}, time);
```

### 3. 入力のタイムスタンプ
```javascript
// イベント発生時刻を使用
element.addEventListener('pointerdown', (e) => {
  const inputTime = e.timeStamp / 1000; // 秒に変換
  handleInput(inputTime);
});
```

### 4. フレームレート非依存
```javascript
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // deltaTimeを使って更新
  update(deltaTime);
  requestAnimationFrame(gameLoop);
}
```

---

## ファイル構成（最終形）

```
src/
├── hooks/
│   ├── useAudioManager.ts    # Phase 1
│   ├── useToneTransport.ts   # Phase 1
│   ├── useGameLoop.ts        # Phase 2
│   ├── useJudgment.ts        # Phase 2
│   ├── useGameState.ts       # Phase 2
│   └── useInput.ts           # Phase 4
├── components/
│   ├── Game/
│   │   ├── GameScreen.tsx    # Phase 3
│   │   ├── NoteRenderer.tsx  # Phase 3
│   │   ├── JudgmentDisplay.tsx # Phase 3
│   │   └── ScoreDisplay.tsx  # Phase 3
│   ├── Chef/
│   │   └── ChefCharacter.tsx # Phase 5
│   ├── Chaos/
│   │   └── ChaosEvent.tsx    # Phase 5
│   ├── Ramen/
│   │   └── RamenEvolution.tsx # Phase 5
│   └── UI/
│       ├── ResultScreen.tsx  # Phase 6
│       └── CalibrationScreen.tsx # Phase 6
└── public/
    └── beatmaps/
        └── sample.json       # Phase 7
```

---

## 最初のマイルストーン

### MVP（最小実用製品）
以下が動作すれば基本的な音ゲーとしてプレイ可能：

1. ✅ BGMが再生される
2. ✅ ノーツが流れてくる
3. ✅ タップで判定される
4. ✅ スコアが表示される
5. ✅ 曲が終わったら結果が出る

**推定工数: Phase 1-4 完了時点**
