import { create } from 'zustand';

export interface ImageInfo {
  id: string;
  url: string;
  name: string;
  exif: {
    FileName: string;
    Resolution: string;
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

interface ImageStore {
  images: ImageInfo[];
  lastImageUrl: string | null;
  hasViewedImages: boolean;
  addImages: (newImages: ImageInfo[]) => void;
  addImage: (image: ImageInfo) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  resetState: () => void;
}

export const useImageStore = create<ImageStore>((set, get) => ({
  images: [],
  lastImageUrl: null,
  hasViewedImages: false,
  addImages: (newImages) => set((state) => ({ 
    images: [...state.images, ...newImages], 
    hasViewedImages: true 
  })),
  addImage: (image) => set((state) => ({ 
    images: [...state.images, image], 
    hasViewedImages: true 
  })),
  removeImage: (id) => set((state) => {
    const newImages = state.images.filter((img) => img.id !== id);
    if (newImages.length === 0 && state.images.length > 0) {
      // 保存最后一张图片的URL
      return { 
        images: newImages, 
        lastImageUrl: state.images.find(img => img.id === id)?.url || null 
      };
    }
    return { images: newImages };
  }),
  clearImages: () => set({ images: [] }),
  resetState: () => set({ images: [], lastImageUrl: null, hasViewedImages: false }),
})); 