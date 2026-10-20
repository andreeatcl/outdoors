import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    messages: {},
    hasMoreOlder: {},
    activeConversation: null,
  },
  reducers: {
    setConversations(state, action) {
      state.conversations = action.payload;
    },
    setMessages(state, action) {
      const { convId, messages, hasMore } = action.payload;
      state.messages[convId] = messages;
      state.hasMoreOlder[convId] = hasMore ?? false;
    },
    prependOlderMessages(state, action) {
      const { convId, messages, hasMore } = action.payload;
      const existing = state.messages[convId] ?? [];
      const existingIds = new Set(existing.map((m) => m.message_id));
      const older = messages.filter((m) => !existingIds.has(m.message_id));
      state.messages[convId] = [...older, ...existing];
      state.hasMoreOlder[convId] = hasMore;
    },
    setActiveConversation(state, action) {
      state.activeConversation = action.payload;
      const conv = state.conversations.find((c) => c.id === action.payload);
      if (conv) conv.unread = 0;
    },
    sendMessage(state, action) {
      const { convId, message } = action.payload;
      if (!state.messages[convId]) state.messages[convId] = [];
      state.messages[convId].push(message);
      const conv = state.conversations.find((c) => c.id === convId);
      if (conv)
        conv.last_message = {
          content: message.content,
          created_at: message.created_at,
          sender_id: message.sender_id,
          sender_name: message.sender?.first_name,
        };
    },
    receiveMessage(state, action) {
      const { convId, message } = action.payload;
      if (!state.messages[convId]) state.messages[convId] = [];
      const exists = state.messages[convId].some(
        (m) => m.message_id === message.message_id,
      );
      if (!exists) {
        state.messages[convId].push(message);
        const conv = state.conversations.find((c) => c.id === convId);
        if (conv) {
          conv.last_message = {
            content: message.content,
            created_at: message.created_at,
            sender_id: message.sender_id,
            sender_name: message.sender?.first_name,
          };
          if (convId !== state.activeConversation)
            conv.unread = (conv.unread ?? 0) + 1;
        }
      }
    },
    updateConversationStatus(state, action) {
      const { convId, updates } = action.payload;
      const conv = state.conversations.find((c) => c.id === convId);
      if (conv) Object.assign(conv, updates);
    },
    clearMessages(state) {
      state.messages = {};
      state.hasMoreOlder = {};
    },
    clearChat(state) {
      state.conversations = [];
      state.messages = {};
      state.hasMoreOlder = {};
      state.activeConversation = null;
    },
  },
});

export const {
  setConversations,
  setMessages,
  prependOlderMessages,
  setActiveConversation,
  sendMessage,
  receiveMessage,
  updateConversationStatus,
  clearMessages,
  clearChat,
} = chatSlice.actions;
export default chatSlice.reducer;
