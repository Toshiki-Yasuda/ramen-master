interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-900 to-amber-950">
      {/* タイトル画像 */}
      <div className="mb-8">
        <img
          src="/ramen-master/images/title.png"
          alt="湯切りますたー"
          className="w-80 h-auto drop-shadow-lg"
          onError={(e) => {
            // 画像がない場合はテキストで代用
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* タイトルテキスト（画像がない場合のフォールバック） */}
      <h1 className="text-5xl font-bold text-amber-200 mb-4 drop-shadow-lg font-serif">
        湯切りますたー
      </h1>

      <p className="text-amber-300/80 mb-12 text-lg">
        リズムに合わせて湯切りせよ！
      </p>

      {/* スタートボタン */}
      <button
        onClick={onStart}
        className="px-12 py-4 text-2xl font-bold text-amber-900 bg-amber-200 rounded-lg
                   hover:bg-amber-100 hover:scale-105 active:scale-95
                   transition-all duration-150 shadow-lg"
      >
        はじめる
      </button>

      {/* 操作説明 */}
      <div className="mt-12 text-amber-300/60 text-sm">
        <p>スペースキー または タップで湯切り</p>
      </div>

      {/* 湯気エフェクト（シンプルなCSS版） */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none overflow-hidden">
        <div className="steam-effect" />
      </div>
    </div>
  );
}
