import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        fitness: {
          orange: "hsl(var(--fitness-orange))",
          "orange-light": "hsl(var(--fitness-orange-light))",
          blue: "hsl(var(--fitness-blue))",
          "blue-light": "hsl(var(--fitness-blue-light))",
          gray: "hsl(var(--fitness-gray))",
          "gray-light": "hsl(var(--fitness-gray-light))",
        },
        gym: {
          primary: "hsl(var(--gym-primary))",
          "primary-light": "hsl(var(--gym-primary-light))",
          secondary: "hsl(var(--gym-secondary))",
          accent: "hsl(var(--gym-accent))",
          muted: "hsl(var(--gym-muted))",
          background: "hsl(var(--gym-background))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-up": {
          from: {
            transform: "translateY(100px)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsl(var(--fitness-orange) / 0.3)",
          },
          "50%": {
            boxShadow: "0 0 40px hsl(var(--fitness-orange) / 0.6)",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        "workout-enter": {
          from: {
            opacity: "0",
            transform:  "scale(0.9) translateY(30px)",
          },
          to: {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
        "stat-bounce": {
          from: {
            transform: "scale(0.8)",
            opacity: "0"
          },
          "50%": {
            transform: "scale(1.05)"
          },
          to: {
            transform: "scale(1)",
            opacity: "1"
          },
        },
        "glow-pulse": {
          "0%, 100%": {
            background: "var(--gradient-primary)",
            boxShadow: "0 0 20px hsl(var(--fitness-orange) / 0.4)"
          },
          "50%": {
            background: "var(--gradient-primary)",
            boxShadow: "0 0 40px hsl(var(--fitness-orange) / 0.8), 0 0 60px hsl(var(--fitness-blue) / 0.4)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "workout-enter": "workout-enter 0.6s ease-out forwards",
        "stat-bounce": "stat-bounce 0.5s ease-out",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite"
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-card": "var(--gradient-card)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-workout": "var(--gradient-workout)",
        "gradient-stats": "var(--gradient-stats)",
        "gradient-glow": "var(--gradient-glow)",
        "gradient-gym-primary": "var(--gradient-gym-primary)",
        "gradient-gym-card": "var(--gradient-gym-card)",
        "gradient-gym-hero": "var(--gradient-gym-hero)",
        "gradient-gym-workout": "var(--gradient-gym-workout)",
        "gradient-gym-stats": "var(--gradient-gym-stats)",
        "gradient-gym-glow": "var(--gradient-gym-glow)",
      },
      boxShadow: {
        "glow": "var(--shadow-glow)",
        "card": "var(--shadow-card)",
        "intense": "var(--shadow-intense)",
        "workout": "var(--shadow-workout)",
        "gym-glow": "var(--shadow-gym-glow)",
        "gym-intense": "var(--shadow-gym-intense)",
        "gym-workout": "var(--shadow-gym-workout)",
      },
      transitionTimingFunction: {
        "smooth": "var(--transition-smooth)",
        "bounce": "var(--transition-bounce)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
