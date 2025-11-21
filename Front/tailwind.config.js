/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'gov-blue': '#1e3a8a',
                'gov-blue-dark': '#1e40af',
                'gov-blue-light': '#3b82f6',
                'gov-gray': '#64748b',
                'gov-gray-light': '#f1f5f9',
                'gov-gray-dark': '#334155',
            },
        },
    },
    plugins: [],
}

