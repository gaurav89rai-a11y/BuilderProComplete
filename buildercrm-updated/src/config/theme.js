export const themes = {
  dark: {
    bg:"#070C1A", side:"#080D1E", card:"#0D1528", raise:"#141E35",
    bord:"#1A2840", gold:"#C9A843", goldL:"#E5C870", blue:"#4B8CF5",
    teal:"#0EC8A4", red:"#FF4F4F", amb:"#FF9F43", txt:"#ECF0FF",
    sub:"#7B91B8", mute:"#2E3F60",
  },
  light: {
    bg:"#F4F6FA", side:"#FFFFFF", card:"#FFFFFF", raise:"#F0F2F6",
    bord:"#D1D6E2", gold:"#A3831A", goldL:"#B5962E", blue:"#2563EB",
    teal:"#059669", red:"#DC2626", amb:"#D97706", txt:"#1E293B",
    sub:"#5A6A85", mute:"#8A9BB5",
  }
};

export const getInitialTheme = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  }
  return "dark";
};

export const initialTheme = getInitialTheme();
export let C = { ...themes[initialTheme] };
