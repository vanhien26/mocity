import type { Config } from "tailwindcss";

/** Chuỗi monospace dự phòng cho font pixel. */
const monospaceStack = 'ui-monospace, monospace';

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        momo: {
          50: "#FFF0F8",
          100: "#FFD6EE",
          400: "#F472B6",
          500: "#EB2F96",
          600: "#C22181",
        },
      },
      fontFamily: {
        /*
         * Oswald: grotesque bó hẹp, đúng chất chữ kẻ tay trên biển hiệu và
         * băng rôn thời bao cấp. Thay Baloo 2 / Comfortaa / Nunito - ba font
         * geometric sans bo tròn thiết kế cho cảm giác thân thiện đương đại,
         * thứ nói "không retro" to nhất mà mắt không ý thức được.
         */
        sans: ['Oswald', '"Arial Narrow"', 'Arial', 'sans-serif'],
        /** Bevan: slab nặng, dùng cho biển hiệu và tiêu đề. */
        display: ['Bevan', 'Oswald', 'Georgia', 'serif'],
        /**
         * VT323 cho DÃY SỐ trên HUD.
         *
         * Đây là font pixel DUY NHẤT trên Google Fonts có bộ Vietnamese.
         * Press Start 2P, Silkscreen và Pixelify Sans đều không có dấu, nên
         * không dùng được cho giao diện tiếng Việt. Chỉ áp cho số để tránh
         * chữ có dấu rơi vào font thiếu glyph.
         */
        pixel: ['VT323', '"Courier New"', monospaceStack],
      },

      /*
       * BO TRÒN: ép toàn bộ thang về 0-4px.
       *
       * Repo có 267 chỗ bo tròn lớn (rounded-xl 87, rounded-full 86,
       * rounded-2xl 57). Sửa ở tầng theme đổi hết cùng lúc thay vì đi tay
       * từng chỗ. Giữ `full` cho huy hiệu tròn và chấm chỉ báo.
       */
      borderRadius: {
        none: '0px',
        sm: '1px',
        DEFAULT: '2px',
        md: '2px',
        lg: '3px',
        xl: '3px',
        '2xl': '4px',
        '3xl': '4px',
      },

      /*
       * ĐỔ BÓNG: bóng cứng lệch một hướng, không mờ.
       *
       * Bóng mềm toả đều là quy ước hậu-2015. In offset và đồ hoạ thời kỳ
       * dùng bóng cứng hoặc viền khắc hai tông.
       */
      boxShadow: {
        sm: '1px 1px 0 rgba(43,36,32,0.35)',
        DEFAULT: '2px 2px 0 rgba(43,36,32,0.35)',
        md: '2px 2px 0 rgba(43,36,32,0.4)',
        lg: '3px 3px 0 rgba(43,36,32,0.45)',
        xl: '4px 4px 0 rgba(43,36,32,0.45)',
        '2xl': '5px 5px 0 rgba(43,36,32,0.5)',
        inner: 'inset 1px 1px 0 rgba(255,245,220,0.35), inset -1px -1px 0 rgba(43,36,32,0.3)',
        none: 'none',
      },
    },
  },
  plugins: [],
};

export default config;
