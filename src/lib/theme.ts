import { createContext, useContext } from "react";

export type Mode = "light" | "dark";

const LIGHT = {
  accent: "#111111",
  onAccent: "#FFFFFF",
  accentSoft: "#2F6FDB",
  sky: "#D6E9FB",
  skyLine: "#8DB9EC",
  bg: "#FFFFFF",
  card: "#F3F5F9",
  cardHi: "#E8ECF3",
  text: "#111111",
  muted: "#6B6D73",
  faint: "#A3A6AD",
  line: "#2B2B2B",
  hair: "#E3E3E8",
  danger: "#E5484D",
  whop: "#111111",
};

const DARK: typeof LIGHT = {
  accent: "#FFFFFF",
  onAccent: "#0B0B0D",
  accentSoft: "#9DB8F0",
  sky: "#14263A",
  skyLine: "#2E5784",
  bg: "#0B0B0D",
  card: "#16171A",
  cardHi: "#202125",
  text: "#FFFFFF",
  muted: "#9A9CA3",
  faint: "#5A5C63",
  line: "#3A3B41",
  hair: "#26272C",
  danger: "#FF6B70",
  whop: "#FFFFFF",
};

export const C = { ...LIGHT };

let version = 0;

export function setTheme(mode: Mode) {
  Object.assign(C, mode === "dark" ? DARK : LIGHT);
  version++;
}

export function themed<T extends object>(make: () => T): T {
  let seen = -1;
  let cache = {} as T;
  return new Proxy({} as T, {
    get(_, key) {
      if (seen !== version) {
        cache = make();
        seen = version;
      }
      return (cache as any)[key];
    },
  });
}

export const ThemeContext = createContext<{ mode: Mode; toggle: () => void }>({ mode: "light", toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export const F = {
  sans: "InstrumentSans_400Regular",
  sansMedium: "InstrumentSans_500Medium",
  sansBold: "InstrumentSans_600SemiBold",
  serif: "Newsreader_400Regular",
  serifItalic: "Newsreader_400Regular_Italic",
};

export const R = { card: 32, tile: 12 };
