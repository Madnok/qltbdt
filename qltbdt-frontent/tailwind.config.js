module.exports = {
  content: [
      "./src/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
      extend: {
          colors: {
              primary: {
                  DEFAULT: "#0D6EFD",
                  foreground: "#FFFFFF"
              },
              secondary: {
                  DEFAULT: "#F0F1F3",
                  foreground: "#020817"
              },
              accent: {
                  DEFAULT: "#6D7074",
                  foreground: "#020817"
              },
              background: "#FAFAFB",
              foreground: "#020817",
              card: {
                  DEFAULT: "#FFFFFF",
                  foreground: "#020817"
              },
              popover: {
                  DEFAULT: "#FFFFFF",
                  foreground: "#020817"
              },
              muted: {
                  DEFAULT: "#F0F1F3",
                  foreground: "#6D7074"
              },
              destructive: {
                  DEFAULT: "#FF4C4C",
                  foreground: "#FFFFFF"
              },
              border: "#E0E0E0",
              input: "#E0E0E0",
              ring: "#0D6EFD",
              chart: {
                  1: "#FF6F61",
                  2: "#4CAF50",
                  3: "#03A9F4",
                  4: "#FFC107",
                  5: "#8E44AD"
              },
          },
          borderRadius: {
              sm: '0.125rem'
          },
          boxShadow: {
              sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          },
          fontFamily: {
              inter: ['Inter', 'sans-serif']
          },
          fontSize: {
              heading: '36px',
              body: '14px'
          },
          fontWeight: {
              heading: '700',
              body: '600'
          }
      },
  },
  plugins: [],
  }