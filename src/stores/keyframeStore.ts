import { create } from 'zustand';
import type { Keyframe } from '../types/keyframe';

interface KeyframeState {
  enabled: boolean;
  keyframes: Keyframe[];
  currentIdx: number;
  playing: boolean;
  frameDuration: number;
  transitionDuration: number;
  transitionEasing: 'linear' | 'ease-in-out' | 'ease-in';
  setEnabled: (v: boolean) => void;
  setKeyframe: (idx: number, kf: Keyframe) => void;
  setCurrentIdx: (idx: number) => void;
  setPlaying: (v: boolean) => void;
  setFrameDuration: (v: number) => void;
  setTransitionDuration: (v: number) => void;
  setTransitionEasing: (v: 'linear' | 'ease-in-out' | 'ease-in') => void;
  reset: () => void;
}

const defaultKeyframes: Keyframe[] = [
  { scale: 1, offsetX: 0, offsetY: 0 },
  { scale: 1, offsetX: 0, offsetY: 0 },
  { scale: 1, offsetX: 0, offsetY: 0 },
  { scale: 1, offsetX: 0, offsetY: 0 },
  { scale: 1, offsetX: 0, offsetY: 0 },
];

export const useKeyframeStore = create<KeyframeState>((set) => ({
  enabled: false,
  keyframes: defaultKeyframes,
  currentIdx: 0,
  playing: false,
  frameDuration: 3000,
  transitionDuration: 2000,
  transitionEasing: 'ease-in-out',
  setEnabled: (v) => set({ enabled: v }),
  setKeyframe: (idx, kf) => set(state => {
    const arr = [...state.keyframes];
    arr[idx] = kf;
    return { keyframes: arr };
  }),
  setCurrentIdx: (idx) => set({ currentIdx: idx }),
  setPlaying: (v) => set({ playing: v }),
  setFrameDuration: (v) => set({ frameDuration: v }),
  setTransitionDuration: (v) => set({ transitionDuration: v }),
  setTransitionEasing: (v) => set({ transitionEasing: v }),
  reset: () => set({ keyframes: defaultKeyframes, currentIdx: 0, playing: false }),
}));

export default useKeyframeStore; 