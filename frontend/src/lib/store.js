import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/lib/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login({ email, password });
          localStorage.setItem('sc_token', data.token);
          localStorage.setItem('sc_refresh_token', data.refreshToken);
          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true, role: data.user.role };
        } catch (err) {
          set({ isLoading: false });
          throw new Error(err.response?.data?.message || 'Login failed');
        }
      },

      logout: async () => {
        try { await authAPI.logout(); } catch {}
        localStorage.removeItem('sc_token');
        localStorage.removeItem('sc_refresh_token');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'sc-auth',
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
