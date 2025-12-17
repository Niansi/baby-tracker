/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 自定义断点，更精确地适配不同设备
      screens: {
        'xs': '375px',   // iPhone SE/8
        'sm': '640px',   // 大屏手机
        'md': '768px',   // iPad 竖屏
        'lg': '1024px',  // iPad 横屏 / 小桌面
        'xl': '1280px',  // 桌面
        '2xl': '1536px', // 大桌面
        // 设备特定断点
        'iphone': {'min': '375px', 'max': '430px'},  // iPhone 范围
        'ipad': {'min': '768px', 'max': '1024px'},   // iPad 范围
        'desktop': {'min': '1024px'},                 // 桌面及以上
      },
    },
  },
  plugins: [],
}