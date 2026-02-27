/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors (Spec §1.4)
        'navy-deep': '#0A1628',
        'ice-white': '#E2E8F0',
        'muted-blue': '#8B9DC3',
        'faded-blue': '#4A5A7A',
        'baldur-blue': '#3B82F6',

        // Signal Colors (Spec §1.4)
        'signal-green': '#22C55E',
        'signal-yellow': '#EAB308',
        'signal-orange': '#F97316',
        'signal-red': '#EF4444',

        // Glass surfaces
        'glass-surface': 'rgba(255,255,255,0.05)',
        'glass-surface-hover': 'rgba(255,255,255,0.08)',
        'glass-border': 'rgba(255,255,255,0.10)',
        'glass-primary': 'rgba(255,255,255,0.07)',
        'glass-primary-border': 'rgba(255,255,255,0.12)',
        'glass-secondary': 'rgba(255,255,255,0.03)',
        'glass-secondary-border': 'rgba(255,255,255,0.07)',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Spec §1.5 Typography Hierarchy
        'page-title': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        'page-title-desktop': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'card-title': ['18px', { lineHeight: '1.3', fontWeight: '600' }],
        'section-title': ['16px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'data-large': ['28px', { lineHeight: '1.1', fontWeight: '600' }],
        'data-medium': ['18px', { lineHeight: '1.2', fontWeight: '500' }],
        'data-small': ['14px', { lineHeight: '1.3', fontWeight: '500' }],
        'label': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        'card': '16px',
        'input': '12px',
      },
      spacing: {
        'card-mobile': '16px',
        'card-desktop': '20px',
        'card-primary-mobile': '20px',
        'card-primary-desktop': '24px',
        'card-secondary-mobile': '14px',
        'card-secondary-desktop': '18px',
        'card-gap-mobile': '12px',
        'card-gap-desktop': '16px',
      },
      zIndex: {
        'cards': '10',
        'circles': '20',
        'timestamp': '30',
        'topbar': '40',
        'bubble': '45',
        'panel': '50',
        'toast': '60',
        'stale': '70',
        'splash': '80',
        'auth': '90',
      },
      maxWidth: {
        'app': '1200px',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2000ms ease-in-out infinite',
        'bubble-pulse': 'bubble-pulse 600ms ease-out',
        'spin-logo': 'spin 1s linear infinite',
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 300ms ease-out',
        'slide-down': 'slide-down 200ms ease-in',
        'slide-right': 'slide-right 300ms ease-out',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        'bubble-pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
