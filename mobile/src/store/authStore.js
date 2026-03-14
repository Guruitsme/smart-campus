import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('sc_token');
      const userStr = await SecureStore.getItemAsync('sc_user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true });
      }
    } catch {}
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login({ email, password });
      await SecureStore.setItemAsync('sc_token', data.token);
      await SecureStore.setItemAsync('sc_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  },

  logout: async () => {
    try { await authService.logout(); } catch {}
    await SecureStore.deleteItemAsync('sc_token');
    await SecureStore.deleteItemAsync('sc_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
