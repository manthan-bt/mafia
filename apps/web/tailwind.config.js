/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
                michroma: ['Michroma', 'sans-serif'],
                orbitron: ['Orbitron', 'sans-serif'],
            },
            colors: {
                dark: {
                    900: '#080810',
                    800: '#0E0E1C',
                    700: '#161627',
                    600: '#1E1E30',
                },
                // Proper blood red palette
                'blood': {
                    50: '#FFF0F1',
                    100: '#FFDADD',
                    200: '#FFB3B9',
                    300: '#FF808A',
                    400: '#FF3D4D',
                    500: '#E8152A',   // True blood red — vivid, saturated
                    600: '#CC0A1E',   // Core brand blood red
                    700: '#A80818',
                    800: '#8B0614',
                    900: '#5C0510',
                },
                // Keep legacy names pointing to new values
                'red-primary': '#CC0A1E',
                'red-highlight': '#FF1E35',
                'red-secondary': '#8B0614',
                'accent-red': '#CC0A1E',
            },
            boxShadow: {
                'blood': '0 0 30px rgba(204, 10, 30, 0.4)',
                'blood-lg': '0 0 60px rgba(204, 10, 30, 0.35)',
                'blood-glow': '0 0 80px rgba(232, 21, 42, 0.5)',
            },
            backgroundImage: {
                'blood-gradient': 'linear-gradient(135deg, #CC0A1E 0%, #8B0614 100%)',
                'blood-gradient-v': 'linear-gradient(180deg, #E8152A 0%, #A80818 100%)',
            },
        },
        animation: {
            'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'float': 'float 6s ease-in-out infinite',
            'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
            'drift': 'drift 20s linear infinite',
            'fog': 'fog 30s ease-in-out infinite alternate',
            'card-flip': 'cardFlip 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            'subtle-vibrate': 'vibrate 2s linear infinite',
            'scan': 'scan 3s linear infinite',
        },
        keyframes: {
            float: {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-10px)' },
            },
            pulseGlow: {
                '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
                '50%': { opacity: 0.8, transform: 'scale(1.05)' },
            },
            drift: {
                '0%': { transform: 'translateX(-5%) translateY(-5%)' },
                '100%': { transform: 'translateX(5%) translateY(5%)' },
            },
            fog: {
                '0%': { opacity: 0.1, transform: 'scale(1)' },
                '100%': { opacity: 0.3, transform: 'scale(1.1)' },
            },
            cardFlip: {
                '0%': { transform: 'rotateY(0deg) scale(0.9)', opacity: 0 },
                '50%': { transform: 'rotateY(90deg) scale(1.1)', opacity: 0.5 },
                '100%': { transform: 'rotateY(180deg) scale(1)', opacity: 1 },
            },
            vibrate: {
                '0%, 100%': { transform: 'translate(0)' },
                '20%': { transform: 'translate(-1px, 1px)' },
                '40%': { transform: 'translate(-1px, -1px)' },
                '60%': { transform: 'translate(1px, 1px)' },
                '80%': { transform: 'translate(1px, -1px)' },
            },
            scan: {
                '0%': { transform: 'translateY(-100%)' },
                '100%': { transform: 'translateY(100vh)' },
            },
        },
    },
    plugins: [],
}
