import { create } from 'zustand';
import { Settings } from '../types';

interface ExifSettings {
  FileName: boolean;
  Resolution: boolean;
  Make: boolean;
  Model: boolean;
  LensModel: boolean;
  FocalLength: boolean;
  FNumber: boolean;
  ExposureTime: boolean;
  ISO: boolean;
  DateTimeOriginal: boolean;
}

interface SettingsStore extends Settings {
  darkMode: boolean;
  syncZoom: boolean;
  syncDraw: boolean;
  presentationMode: boolean;
  visibleExifFields: string[];
  demoMode: boolean;
  exifSettings: ExifSettings;
  toggleDarkMode: () => void;
  toggleSyncZoom: () => void;
  toggleSyncDraw: () => void;
  togglePresentationMode: () => void;
  toggleDemoMode: () => void;
  toggleExifSetting: (key: keyof ExifSettings) => void;
  toggleExifField: (field: string) => void;
  toggleAllExifSettings: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  syncZoom: true,
  syncDraw: false,
  presentationMode: false,
  visibleExifFields: ['Make', 'Model', 'ISO', 'FNumber', 'ExposureTime', 'FocalLength', 'LensModel', 'DateTimeOriginal'],
  demoMode: false,
  exifSettings: {
    FileName: false,
    Resolution: true,
    Make: true,
    Model: true,
    LensModel: false,
    FocalLength: true,
    FNumber: true,
    ExposureTime: true,
    ISO: false,
    DateTimeOriginal: false,
  },
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSyncZoom: () => set((state) => ({ syncZoom: !state.syncZoom })),
  toggleSyncDraw: () => set((state) => ({ syncDraw: !state.syncDraw })),
  togglePresentationMode: () => set((state) => ({ presentationMode: !state.presentationMode })),
  toggleDemoMode: () => set((state) => ({ demoMode: !state.demoMode })),
  toggleExifSetting: (key) => set((state) => ({
    exifSettings: {
      ...state.exifSettings,
      [key]: !state.exifSettings[key],
    },
  })),
  toggleExifField: (field) => set((state) => ({
    visibleExifFields: state.visibleExifFields.includes(field)
      ? state.visibleExifFields.filter(f => f !== field)
      : [...state.visibleExifFields, field]
  })),
  toggleAllExifSettings: (value) => set((state) => {
    const newSettings = { ...state.exifSettings };
    Object.keys(newSettings).forEach(key => {
      newSettings[key as keyof ExifSettings] = value;
    });
    return { exifSettings: newSettings };
  }),
})); 