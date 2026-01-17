interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#1a0f0a] overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2d1f15] to-[#1a0f0a]" />

      {/* 装飾：暖かいグロー */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c94a4a]/10 rounded-full blur-3xl" />

      {/* 縦線の装飾 */}
      <div className="absolute inset-0 flex justify-around opacity-[0.03] pointer-events-none">
        <div className="w-px h-full bg-[#fff8e7]" />
        <div className="w-px h-full bg-[#fff8e7]" />
        <div className="w-px h-full bg-[#fff8e7]" />
      </div>

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col items-center">
        {/* タイトル画像 */}
        <div className="mb-6">
          <img
            src="/ramen-master/images/title.png"
            alt="湯切りますたー"
            className="w-96 h-auto drop-shadow-2xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* タイトルテキスト */}
        <h1 className="text-5xl font-bold text-[#fff8e7] mb-3 tracking-wider"
            style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}>
          湯切りますたー
        </h1>

        {/* サブタイトル */}
        <p className="text-[#d4af37] mb-16 text-sm tracking-[0.3em] uppercase">
          Rhythm of Ramen Master
        </p>

        {/* スタートボタン */}
        <button
          onClick={onStart}
          className="group relative px-16 py-4 overflow-hidden"
        >
          {/* ボタン背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#b8972e] rounded-sm" />
          <div className="absolute inset-[2px] bg-[#1a0f0a] rounded-sm group-hover:bg-[#2d1f15] transition-colors" />

          {/* ボタンテキスト */}
          <span className="relative text-xl font-medium text-[#d4af37] tracking-[0.2em]"
                style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}>
            はじめる
          </span>
        </button>

        {/* 操作説明 */}
        <div className="mt-20 text-[#fff8e7]/40 text-xs tracking-wider">
          <p>SPACE KEY / TAP TO PLAY</p>
        </div>
      </div>

      {/* 湯気エフェクト */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none overflow-hidden">
        <div className="steam-effect opacity-20" />
      </div>
    </div>
  );
}
