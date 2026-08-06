/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
        'amiri-quran': ['Amiri Quran', 'serif'],
        'sura-names': ['SuraNames', 'serif'],
      },
    },
  },
  plugins: [],
  // Safelist for dynamic classes used in template literals
  safelist: [
    // Opacity
    'opacity-0', 'opacity-40', 'opacity-60', 'opacity-90', 'opacity-100',
    // Scale
    'scale-90', 'scale-95', 'scale-110', 'scale-125',
    // Pointer events
    'pointer-events-none', 'pointer-events-auto',
    // Animation
    'animate-pulse',
    // Rotate
    'rotate-180',
    // Max width
    'max-w-0', 'max-w-[100px]',
    // Justify
    'justify-end', 'justify-start',
    // Cursor
    'cursor-pointer', 'cursor-not-allowed',
    // Font weight
    'font-black', 'font-medium',
    // Colors used dynamically
    'text-[#2b1a10]', 'text-[#7f6a55]', 'text-[#b88a4f]', 'text-[#deab65]',
    'text-[#7f6a55]/60', 'text-red-500',
    'bg-[#b88a4f]', 'bg-[#e6dccf]', 'bg-[#ece7de]', 'bg-[#fdfcfb]',
    'bg-[#f7f2ea]', 'bg-white',
    'bg-[#b88a4f]/10', 'bg-[#e6dccf]/20', 'bg-white/10',
    'border-white', 'border-white/10', 'border-[#e6dccf]',
    // Ring
    'ring-2', 'ring-[#fdfcfb]',
  ],
}
