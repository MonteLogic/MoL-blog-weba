import colors from 'tailwindcss/colors';
import { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: colors.slate,
        // Warm light mode palette
        cream: {
          50: '#FEFDFB',
          100: '#FAF9F6',
          200: '#F5F3EE',
          300: '#EBE8E0',
          400: '#DED9CD',
        },
        charcoal: {
          DEFAULT: '#2D3748',
          light: '#4A5568',
          muted: '#718096',
        },
        accent: {
          purple: '#805AD5',
          teal: '#319795',
          indigo: '#5A67D8',
        },
        vercel: {
          pink: '#FF0080',
          blue: '#0070F3',
          cyan: '#50E3C2',
          orange: '#F5A623',
          violet: '#7928CA',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      backgroundImage: ({ theme }) => ({
        'vc-border-gradient': `radial-gradient(at left top, ${theme(
          'colors.cream.200',
        )}, 50px, ${theme('colors.cream.100')} 50%)`,
      }),
      keyframes: ({ theme }) => ({
        rerender: {
          '0%': {
            borderColor: theme('colors.vercel.pink'),
          },
          '40%': {
            borderColor: theme('colors.vercel.pink'),
          },
        },
        highlight: {
          '0%': {
            background: theme('colors.vercel.pink'),
            color: theme('colors.gray.1000'),
          },
          '40%': {
            background: theme('colors.vercel.pink'),
            color: theme('colors.gray.1000'),
          },
        },
        loading: {
          '0%': {
            opacity: '.2',
          },
          '20%': {
            opacity: '1',
            transform: 'translateX(1px)',
          },
          to: {
            opacity: '.2',
          },
        },
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        translateXReset: {
          '100%': {
            transform: 'translateX(0)',
          },
        },
        fadeToTransparent: {
          '0%': {
            opacity: '1',
          },
          '40%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
} satisfies Config;
