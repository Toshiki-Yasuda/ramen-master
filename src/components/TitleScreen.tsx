import type { HighScoreData } from '../types';

interface TitleScreenProps {
  onStart: () => void;
  highScore?: HighScoreData | null;
}

export function TitleScreen({ onStart, highScore }: TitleScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#1a0f0a] overflow-hidden px-4">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2d1f15] to-[#1a0f0a]" />

      {/* 装飾：暖かいグロー */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[450px] md:w-[600px] h-[150px] sm:h-[225px] md:h-[300px] bg-[#c94a4a]/10 rounded-full blur-3xl" />

      {/* 縦線の装飾 */}
      <div className="absolute inset-0 flex justify-around opacity-[0.03] pointer-events-none">
        <div className="w-px h-full bg-[#fff8e7]" />
        <div className="w-px h-full bg-[#fff8e7]" />
        <div className="w-px h-full bg-[#fff8e7]" />
      </div>

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* タイトル画像 */}
        <div className="mb-4 sm:mb-6">
          <img
            src="/ramen-master/images/title.png"
            alt="湯切りますたー"
            className="w-48 sm:w-72 md:w-96 h-auto drop-shadow-2xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* タイトルテキスト */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#fff8e7] mb-2 sm:mb-3 tracking-wider text-center"
            style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}>
          湯切りますたー
        </h1>

        {/* サブタイトル */}
        <p className="text-[#d4af37] mb-4 sm:mb-6 text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase text-center">
          Rhythm of Ramen Master
        </p>

        {/* ハイスコア */}
        {highScore && (
          <div className="mb-6 sm:mb-10 md:mb-12 text-center">
            <p className="text-[10px] sm:text-xs text-[#d4af37]/60 tracking-[0.15em] mb-1">HIGH SCORE</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-light text-[#fff8e7] tracking-wider">
              {highScore.score.toLocaleString()}
            </p>
          </div>
        )}

        {/* ハイスコアがない場合のスペーサー */}
        {!highScore && <div className="mb-4 sm:mb-6 md:mb-8" />}

        {/* スタートボタン */}
        <button
          onClick={onStart}
          className="group relative px-8 sm:px-12 md:px-16 py-3 sm:py-4 overflow-hidden active:scale-95 transition-transform"
        >
          {/* ボタン背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8972e] rounded-sm" />
          <div className="absolute inset-[2px] bg-[#1a0f0a] rounded-sm group-hover:bg-[#2d1f15] transition-colors" />

          {/* ボタンテキスト */}
          <span className="relative text-base sm:text-lg md:text-xl font-medium text-[#d4af37] tracking-[0.15em] sm:tracking-[0.2em]"
                style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}>
            はじめる
          </span>
        </button>

        {/* 操作説明 */}
        <div className="mt-10 sm:mt-16 md:mt-20 text-[#fff8e7]/40 text-[10px] sm:text-xs tracking-wider text-center">
          <p className="hidden sm:block">SPACE KEY / TAP TO PLAY</p>
          <p className="sm:hidden">TAP TO PLAY</p>
        </div>
      </div>

      {/* 湯気エフェクト */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 md:h-40 pointer-events-none overflow-hidden">
        <div className="steam-effect opacity-20" />
      </div>
    </div>
  );
}
