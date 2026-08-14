import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Monokrom + krem, senada sama nuansa wordmark ECCO (hitam di atas krem/putih)
        primary: {
          DEFAULT: '#1C1B19',
          dark: '#0E0D0C',
          light: '#F3EFE7',
        },
        cream: {
          DEFAULT: '#F6F2EA',
          dark: '#EDE6D8',
        },
        ink: '#1C1B19',
        // Aksen brass/leather tipis -- satu-satunya warna "hidup" di UI, dipakai
        // sangat terbatas (garis bawah tab aktif, fokus input, aksen kecil lain).
        // Nyambung ke dunia ECCO sebagai brand leather goods, bukan aksen acak.
        accent: {
          DEFAULT: '#A6702F',
          dark: '#8B5E28',
          light: '#F1E4D1',
        },
        // Ganti skala abu-abu default Tailwind (dingin/kebiruan) dengan warm-neutral
        // (stone) biar konsisten sama background krem -- abu dingin di atas krem
        // itu salah satu tanda "template AI" yang paling kelihatan.
        gray: colors.stone,
      },
      fontFamily: {
        // Display/wordmark pakai geometric rounded sans, senada sama logo ECCO asli
        display: ['"Fredoka"', '-apple-system', 'sans-serif'],
        // Sans netral buat isi/UI, biar tetap gampang dibaca & terasa profesional
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      letterSpacing: {
        wordmark: '0.01em',
      },
    },
  },
  plugins: [],
};
