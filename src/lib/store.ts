import { create } from 'zustand'

interface UIState {
  isChatOpen: boolean;
  activeChatId: string | null;
  toggleChat: () => void;
  setActiveChat: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isChatOpen: false,
  activeChatId: null,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setActiveChat: (id) => set({ activeChatId: id, isChatOpen: true }),
}))
