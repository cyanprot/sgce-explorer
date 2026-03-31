/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sgce: {
          extra: "#3b82f6",
          tm: "#f59e0b",
          cyto: "#8b5cf6",
          mutant: "#ef4444",
          dna: "#6366f1",
          mrna: "#14b8a6",
          ribosome: "#d946ef",
        },
      },
    },
  },
  plugins: [],
};
