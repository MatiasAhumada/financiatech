const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-out-to-bottom": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "slide-out-to-bottom": "slide-out-to-bottom 0.3s ease-in",
      },
      colors: {
        /* Deep Teal - Fondo base */
        onyx: {
          DEFAULT: "#032831",
          100: "#010d10",
          200: "#021a20",
          300: "#032831",
          400: "#053a47",
          500: "#074d5e",
          600: "#0a6176",
          700: "#0d7a91",
          800: "#1094ad",
          900: "#13afc9",
        },
        /* Variantes del Deep Teal para fondos secundarios */
        carbon_black: {
          DEFAULT: "#05242c",
          100: "#01090c",
          200: "#021318",
          300: "#031d24",
          400: "#042730",
          500: "#05242c",
          600: "#0a3d4a",
          700: "#0f5768",
          800: "#147186",
          900: "#198ba4",
        },
        /* Blue Primary - Color principal */
        mahogany_red: {
          DEFAULT: "#4583FA",
          100: "#0d1a33",
          200: "#1a3466",
          300: "#274f99",
          400: "#3469cc",
          500: "#4583FA",
          600: "#6a9dfb",
          700: "#8fb7fc",
          800: "#b4d1fd",
          900: "#d9ebfe",
        },
        /* Variante oscura del Blue Primary */
        dark_garnet: {
          DEFAULT: "#1a5fd4",
          100: "#05142b",
          200: "#0a2955",
          300: "#0f3d80",
          400: "#1452aa",
          500: "#1a5fd4",
          600: "#4580dc",
          700: "#70a1e4",
          800: "#9bc2ec",
          900: "#c6e3f4",
        },
        /* Variante clara del Blue Primary */
        strawberry_red: {
          DEFAULT: "#7aaafb",
          100: "#0f1a33",
          200: "#1e3466",
          300: "#2d4f99",
          400: "#3c69cc",
          500: "#7aaafb",
          600: "#95bcfc",
          700: "#b0cefd",
          800: "#cbe0fe",
          900: "#e6f2ff",
        },
        /* Texto muted con leve ajuste frío */
        silver: {
          DEFAULT: "#a8b5c0",
          100: "#1f2428",
          200: "#3f4951",
          300: "#5e6d79",
          400: "#7e92a2",
          500: "#a8b5c0",
          600: "#b9c4cd",
          700: "#cad3da",
          800: "#dbe2e7",
          900: "#ecf1f4",
        },
        dust_grey: {
          DEFAULT: "#c5d0d8",
          100: "#1f2a30",
          200: "#3f5460",
          300: "#5e7e8f",
          400: "#7ea9bf",
          500: "#c5d0d8",
          600: "#d4dbe0",
          700: "#e2e6e9",
          800: "#f0f2f4",
          900: "#fbfcfd",
        },
        /* Blanco puro para fondos claros */
        white_smoke: {
          DEFAULT: "#FFFFFF",
          100: "#2a3035",
          200: "#55606a",
          300: "#80909f",
          400: "#aac0d4",
          500: "#FFFFFF",
          600: "#ffffff",
          700: "#ffffff",
          800: "#ffffff",
          900: "#ffffff",
        },
        /* Mint Green - Success */
        success: {
          DEFAULT: "#3DE3B1",
          dark: "#1fb88a",
        },
        warning: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
        },
        /* Coral Red - Destructive actions */
        destructive: {
          DEFAULT: "#FF6B6B",
          dark: "#EE5A5A",
        },
      },
    },
  },
};

export default config;
