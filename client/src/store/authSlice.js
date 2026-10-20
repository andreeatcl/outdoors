import { createSlice } from "@reduxjs/toolkit";

const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("user");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken ?? null,
    isLoggedIn: !!savedToken,
    isGuest: false,
    loading: true,
    error: null,
  },
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoggedIn = true;
      state.isGuest = false;
      state.loading = false;
      state.error = null;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    continueAsGuest(state) {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.isGuest = true;
      state.loading = false;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.isGuest = false;
      state.loading = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { loginSuccess, continueAsGuest, logout, updateUser, setLoading } =
  authSlice.actions;
export default authSlice.reducer;
