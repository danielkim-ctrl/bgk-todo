import { AVATAR_COLORS } from "../constants";

export const avColor = (name: string) => {
  const idx = name ? name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
};
export const avColor2 = (name: string) => {
  const idx = name ? name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[(idx+3)%AVATAR_COLORS.length];
};
export const avInitials = (name: string) => name ? name.slice(-2) : "?";
