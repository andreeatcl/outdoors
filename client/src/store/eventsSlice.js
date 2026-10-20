import { createSlice } from "@reduxjs/toolkit";
import { EVENT_TYPES } from "../constants/EVENT_TYPES";

const ALL_TYPES = EVENT_TYPES.map((t) => t.value);

const eventsSlice = createSlice({
  name: "events",
  initialState: {
    list: [],
    selected: null,
    filters: {
      types: ALL_TYPES,
      timeRange: null,
      distanceKm: null,
    },
    userLocation: null,
    showListView: false,
    createCoords: null,
    loading: false,
  },
  reducers: {
    setEvents(state, action) {
      state.list = action.payload;
      state.loading = false;
    },
    setEventsLoading(state, action) {
      state.loading = action.payload;
    },
    setSelected(state, action) {
      state.selected = action.payload;
    },
    clearSelected(state) {
      state.selected = null;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setUserLocation(state, action) {
      state.userLocation = action.payload;
    },
    toggleListView(state) {
      state.showListView = !state.showListView;
    },
    setCreateCoords(state, action) {
      state.createCoords = action.payload;
    },
    clearCreateCoords(state) {
      state.createCoords = null;
    },
    addEvent(state, action) {
      state.list.push(action.payload);
    },
    updateEventInList(state, action) {
      const idx = state.list.findIndex(
        (e) => e.event_id === action.payload.event_id,
      );
      if (idx !== -1)
        state.list[idx] = { ...state.list[idx], ...action.payload };
      if (state.selected?.event_id === action.payload.event_id) {
        state.selected = { ...state.selected, ...action.payload };
      }
    },
    removeEventFromList(state, action) {
      state.list = state.list.filter((e) => e.event_id !== action.payload);
      if (state.selected?.event_id === action.payload) state.selected = null;
    },
    joinEvent(state, action) {
      const { eventId, user } = action.payload;
      const ev = state.list.find((e) => e.event_id === eventId);
      if (ev) {
        ev.is_joined = true;
        ev.participants_count += 1;
        if (user && !ev.participants?.some((p) => p.user_id === user.user_id)) {
          ev.participants = [...(ev.participants ?? []), user];
        }
      }
      if (state.selected?.event_id === eventId) {
        state.selected.is_joined = true;
        state.selected.participants_count += 1;
        if (
          user &&
          !state.selected.participants?.some((p) => p.user_id === user.user_id)
        ) {
          state.selected.participants = [
            ...(state.selected.participants ?? []),
            user,
          ];
        }
      }
    },
    leaveEvent(state, action) {
      const { eventId, userId } = action.payload;
      const ev = state.list.find((e) => e.event_id === eventId);
      if (ev) {
        ev.is_joined = false;
        ev.participants_count -= 1;
        ev.participants = ev.participants?.filter((p) => p.user_id !== userId);
      }
      if (state.selected?.event_id === eventId) {
        state.selected.is_joined = false;
        state.selected.participants_count -= 1;
        state.selected.participants = state.selected.participants?.filter(
          (p) => p.user_id !== userId,
        );
      }
    },
    checkInEvent(state, action) {
      const ev = state.list.find((e) => e.event_id === action.payload);
      if (ev) ev.is_checked_in = true;
      if (state.selected?.event_id === action.payload)
        state.selected.is_checked_in = true;
    },
  },
});

export const {
  setEvents,
  setEventsLoading,
  setSelected,
  clearSelected,
  setFilters,
  setUserLocation,
  toggleListView,
  setCreateCoords,
  clearCreateCoords,
  addEvent,
  updateEventInList,
  removeEventFromList,
  joinEvent,
  leaveEvent,
  checkInEvent,
} = eventsSlice.actions;
export default eventsSlice.reducer;
