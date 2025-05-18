import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface ImageInfo {
  id: string;
  url: string;
  name: string;
  exif: {
    FileName: string;
    Make: string;
    Model: string;
    LensModel: string;
    FocalLength: number;
    FNumber: number;
    ExposureTime: string;
    ISO: number;
    DateTimeOriginal: string;
  };
}

interface AppState {
  // 图片相关状态
  images: ImageInfo[];
  lastImageUrl: string | null;
  hasViewedImages: boolean;
  
  // 设置相关状态
  darkMode: boolean;
  demoMode: boolean;
  syncZoom: boolean;
  
  // 图片操作方法
  addImages: (newImages: ImageInfo[]) => void;
  addImage: (image: ImageInfo) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  
  // 设置操作方法
  toggleDarkMode: () => void;
  toggleDemoMode: () => void;
  toggleSyncZoom: () => void;
  
  // 重置状态
  resetState: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      // 初始状态
      images: [],
      lastImageUrl: null,
      hasViewedImages: false,
      darkMode: false,
      demoMode: false,
      syncZoom: true,

      // 图片操作方法
      addImages: (newImages) => set((state) => {
        state.images.push(...newImages);
        state.hasViewedImages = true;
      }),
      
      addImage: (image) => set((state) => {
        state.images.push(image);
        state.hasViewedImages = true;
      }),
      
      removeImage: (id) => set((state) => {
        const removedImage = state.images.find((img: ImageInfo) => img.id === id);
        state.images = state.images.filter((img: ImageInfo) => img.id !== id);
        if (state.images.length === 0 && removedImage) {
          state.lastImageUrl = removedImage.url;
        }
      }),
      
      clearImages: () => set((state) => {
        state.images = [];
      }),

      // 设置操作方法
      toggleDarkMode: () => set((state) => {
        state.darkMode = !state.darkMode;
      }),
      
      toggleDemoMode: () => set((state) => {
        state.demoMode = !state.demoMode;
      }),
      
      toggleSyncZoom: () => set((state) => {
        state.syncZoom = !state.syncZoom;
      }),

      // 重置状态
      resetState: () => set((state) => {
        state.images = [];
        state.lastImageUrl = null;
        state.hasViewedImages = false;
        state.darkMode = false;
        state.demoMode = false;
        state.syncZoom = true;
      }),
    })),
    {
      name: 'photo-compare-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        syncZoom: state.syncZoom,
      }),
    }
  )
); 