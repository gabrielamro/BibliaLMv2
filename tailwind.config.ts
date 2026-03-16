import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './views/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['var(--font-lora)', 'Merriweather', 'serif'],
                sans: ['var(--font-inter)', 'sans-serif'],
                cursive: ['var(--font-great-vibes)', 'cursive'],
                display: ['var(--font-oswald)', 'sans-serif'],
                epic: ['var(--font-cinzel)', 'serif'],
                elegant: ['var(--font-playfair)', 'serif'],
            },
            colors: {
                bible: {
                    paper: '#fdfbf7',
                    ink: '#2d2a26',
                    gold: '#c5a059',
                    leather: '#5d4037',
                    highlight: '#fff9c4',
                    darkPaper: '#1a1a1a',
                    darkInk: '#e0e0e0',
                }
            },
            lineHeight: {
                'extra-loose': '2.2',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};

export default config;
