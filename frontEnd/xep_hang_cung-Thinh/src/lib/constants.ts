// Color Tokens
export const COLORS = {
  primary: "#0059BB",
  primaryLight: "rgba(0, 89, 187, 0.1)",
  primarySelected: "rgba(0, 123, 255, 0.1)",
  secondary: "#FD8B00",
  secondaryLight: "rgba(253, 139, 0, 0.1)",
  text: {
    primary: "#1A1C1E",
    secondary: "#414754",
  },
  border: {
    default: "rgba(193, 198, 215, 0.8)",
  },
  background: {
    primary: "#FFFFFF",
    secondary: "#F9F9FC",
  },
} as const;

// Spacing Tokens
export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  modal: "24px",
  gapDefault: "16px",
} as const;

// Border Radius
export const RADIUS = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  modal: "24px",
} as const;

// Typography
export const TYPOGRAPHY = {
  heading: {
    fontFamily: "Inter",
    fontWeight: "bold",
    fontSize: "20px",
    lineHeight: "28px",
  },
  body: {
    fontFamily: "Inter",
    fontWeight: "normal",
    fontSize: "16px",
    lineHeight: "24px",
  },
  small: {
    fontFamily: "Inter",
    fontWeight: "normal",
    fontSize: "14px",
    lineHeight: "20px",
  },
  button: {
    fontFamily: "Inter",
    fontWeight: "bold",
    fontSize: "14px",
    lineHeight: "16px",
  },
} as const;

// User Roles
export const USER_ROLES = {
  MEMBER: "member",
  GUEST: "guest",
} as const;

// Item limits
export const LIMITS = {
  guestMaxItems: 50,
  memberMaxItems: Infinity,
} as const;

// Optimization levels
export const OPTIMIZATION_LEVELS = {
  FAST: "fast",
  DEEP: "deep",
} as const;
