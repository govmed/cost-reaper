/** Shared Tailwind preset for cost-reaper web surfaces. */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          fg: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
