import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type Theme = "light" | "dark";
type ModalName = "settings" | "about";

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  modals: {
    settings: boolean;
    about: boolean;
  };
}

const initialState: UIState = {
  theme: "dark",
  sidebarCollapsed: false,
  modals: {
    settings: false,
    about: false,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Toggle between light and dark theme
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },

    // Set specific theme
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },

    // Toggle sidebar collapsed state
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // Open a specific modal
    openModal(state, action: PayloadAction<ModalName>) {
      state.modals[action.payload] = true;
    },

    // Close a specific modal
    closeModal(state, action: PayloadAction<ModalName>) {
      state.modals[action.payload] = false;
    },

    // Close all modals
    closeAllModals(state) {
      state.modals = {
        settings: false,
        about: false,
      };
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  openModal,
  closeModal,
  closeAllModals,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;

export const selectSidebarCollapsed = (state: { ui: UIState }) =>
  state.ui.sidebarCollapsed;

export const selectModals = (state: { ui: UIState }) => state.ui.modals;

export const selectIsModalOpen =
  (modalName: ModalName) => (state: { ui: UIState }) =>
    state.ui.modals[modalName];

export const selectAnyModalOpen = (state: { ui: UIState }) =>
  Object.values(state.ui.modals).some((isOpen) => isOpen);
