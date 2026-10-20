import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [],
    unread: 0,
  },
  reducers: {
    setNotifications(state, action) {
      state.list = action.payload;
      state.unread = action.payload.filter((n) => !n.is_read).length;
    },
    markRead(state, action) {
      const n = state.list.find((x) => x.notification_id === action.payload);
      if (n && !n.is_read) {
        n.is_read = true;
        state.unread = Math.max(0, state.unread - 1);
      }
    },
    markAllRead(state) {
      state.list.forEach((n) => {
        n.is_read = true;
      });
      state.unread = 0;
    },
    markConversationRead(state, action) {
      const { type, refId, refType } = action.payload;
      state.list.forEach((n) => {
        if (
          n.type === type &&
          n.ref_id === refId &&
          n.ref_type === refType &&
          !n.is_read
        ) {
          n.is_read = true;
          state.unread = Math.max(0, state.unread - 1);
        }
      });
    },
    addNotification(state, action) {
      state.list.unshift(action.payload);
      if (!action.payload.is_read) state.unread += 1;
    },
    clearNotifications(state) {
      state.list = [];
      state.unread = 0;
    },
  },
});

export const {
  setNotifications,
  markRead,
  markAllRead,
  markConversationRead,
  addNotification,
  clearNotifications,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
