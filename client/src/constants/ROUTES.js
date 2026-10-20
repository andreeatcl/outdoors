export const ROUTES = {
  WELCOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  HOME: "/home",
  CHAT: "/chat",
  PROFILE: "/profile/:id",
  SETTINGS: "/settings",
};

export const profilePath = (id) => `/profile/${id}`;
