import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import eventsReducer from "./eventsSlice";
import chatReducer from "./chatSlice";
import notificationsReducer from "./notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    chat: chatReducer,
    notifications: notificationsReducer,
  },
});
