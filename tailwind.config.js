/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
       colors: {
    brownWedding: "#b78f4a",   // warna coklat elegan (sama seperti gambarnya)
  },
  fontFamily: {
    marwey: ['Mindway', 'serif'],
    forum: ['Romanica', 'serif'],
  }
    },
  },
  plugins: [],
}

