/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "var(--background)",
          primary: "#FFFFFF",
          secondary: "#F9F9FC",
          selected: "rgba(0, 123, 255, 0.1)",
        },
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          light: "rgba(0, 89, 187, 0.1)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
          light: "rgba(253, 139, 0, 0.1)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
          hover: "var(--muted-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          hover: "var(--accent-hover)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        warning: {
          50: "var(--warning-50)",
          300: "var(--warning-300)",
          600: "var(--warning-600)",
          700: "var(--warning-700)",
        },
        success: {
          50: "var(--success-50)",
          100: "var(--success-100)",
          300: "var(--success-300)",
          600: "var(--success-600)",
          700: "var(--success-700)",
        },
        info: {
          50: "var(--info-50)",
          100: "var(--info-100)",
          300: "var(--info-300)",
          700: "var(--info-700)",
          800: "var(--info-800)",
        },
        border: {
          DEFAULT: "var(--border)",
          default: "rgba(193, 198, 215, 0.8)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        text: {
          primary: "#1A1C1E",
          secondary: "#414754",
        },
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        "be-vietnam": ["Be Vietnam Pro", "sans-serif"],
      },
      spacing: {
        modal: "24px",
        "gap-default": "16px",
      },
      borderRadius: {
        modal: "24px",
      },
      boxShadow: {
        modal: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
        button: "0px 1px 1px rgba(0, 0, 0, 0.05)",
        selected: "0px 4px 12px 0px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
