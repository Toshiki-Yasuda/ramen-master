/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ラーメン屋のテーマカラー
        ramen: {
          broth: '#E8C872', // 豚骨スープ色
          noodle: '#F5E6B3', // 麺色
          nori: '#2D4A3E', // 海苔色
          egg: '#FFD93D', // 卵黄色
          chashu: '#8B4513', // チャーシュー色
        }
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 0.5s infinite',
        'shake': 'shake 0.3s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        }
      }
    },
  },
  plugins: [],
}
