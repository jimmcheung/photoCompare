import { create } from 'zustand';

export type AnnotationType = 'rect' | 'ellipse' | 'pen' | 'text' | 'move';

export interface Annotation {
  id: string;
  type: AnnotationType;
  points: number[]; // rect/ellipse: [x1, y1, x2, y2]，pen: [x1, y1, x2, y2, ...]，text: [x, y]
  color: string;
  strokeWidth: number;
  text?: string; // 仅text类型有
  fontSize?: number; // 仅text类型有
}

export interface AnnotationToolbarState {
  visible: boolean;
  position: { x: number; y: number };
}

export interface AnnotationStore {
  isAnnotateMode: boolean;
  setAnnotateMode: (v: boolean) => void;
  annotationToolbar: AnnotationToolbarState;
  setToolbarVisible: (v: boolean) => void;
  setToolbarPosition: (pos: { x: number; y: number }) => void;
  annotationTool: AnnotationType;
  setAnnotationTool: (t: AnnotationType) => void;
  annotationStrokeWidth: number;
  setStrokeWidth: (w: number) => void;
  annotationColor: string;
  setAnnotationColor: (c: string) => void;
  annotationFontSize: number;
  setAnnotationFontSize: (size: number) => void;
  annotations: Record<string, Annotation[]>; // imageId -> Annotation[]
  addAnnotation: (imageId: string, ann: Annotation) => void;
  setAnnotations: (imageId: string, anns: Annotation[]) => void;
  clearAnnotations: (imageId: string) => void;
  selectedAnnotationId: Record<string, string | null>; // imageId -> annotationId
  setSelectedAnnotationId: (imageId: string, id: string | null) => void;
  moveAnnotation: (imageId: string, annotationId: string, dx: number, dy: number) => void;
  deleteAnnotation: (imageId: string, annotationId: string) => void;
  undoStack: Record<string, Annotation[][]>;
  redoStack: Record<string, Annotation[][]>;
  pushUndo: (imageId: string, anns: Annotation[]) => void;
  undo: (imageId: string) => void;
  redo: (imageId: string) => void;
  drawing: null | {
    type: AnnotationType;
    start: [number, number];
    points: number[];
    imageId: string;
  };
  setDrawing: (drawing: AnnotationStore['drawing']) => void;
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  isAnnotateMode: false,
  setAnnotateMode: (v) => set({ isAnnotateMode: v }),
  annotationToolbar: { visible: false, position: { x: 100, y: 100 } },
  setToolbarVisible: (v) => set((s) => ({ annotationToolbar: { ...s.annotationToolbar, visible: v } })),
  setToolbarPosition: (pos) => set((s) => ({ annotationToolbar: { ...s.annotationToolbar, position: pos } })),
  annotationTool: 'rect',
  setAnnotationTool: (t) => set({ annotationTool: t }),
  annotationStrokeWidth: 2,
  setStrokeWidth: (w) => set({ annotationStrokeWidth: w }),
  annotationColor: '#FF0000',
  setAnnotationColor: (c) => set({ annotationColor: c }),
  annotationFontSize: 18,
  setAnnotationFontSize: (size) => set({ annotationFontSize: size }),
  annotations: {},
  addAnnotation: (imageId, ann) => set((s) => ({
    annotations: {
      ...s.annotations,
      [imageId]: [...(s.annotations[imageId] || []), ann],
    },
  })),
  setAnnotations: (imageId, anns) => set((s) => ({
    annotations: {
      ...s.annotations,
      [imageId]: anns,
    },
  })),
  clearAnnotations: (imageId) => set((s) => ({
    annotations: {
      ...s.annotations,
      [imageId]: [],
    },
  })),
  selectedAnnotationId: {},
  setSelectedAnnotationId: (imageId, id) => set((s) => ({
    selectedAnnotationId: { ...s.selectedAnnotationId, [imageId]: id },
  })),
  moveAnnotation: (imageId, annotationId, dx, dy) => set((s) => {
    const anns = s.annotations[imageId] || [];
    const idx = anns.findIndex(a => a.id === annotationId);
    if (idx === -1) return {};
    const ann = anns[idx];
    let newPoints = ann.points;
    if (ann.type === 'rect' || ann.type === 'ellipse') {
      newPoints = [ann.points[0]+dx, ann.points[1]+dy, ann.points[2]+dx, ann.points[3]+dy];
    } else if (ann.type === 'pen') {
      newPoints = ann.points.map((v,i) => i%2===0 ? v+dx : v+dy);
    } else if (ann.type === 'text') {
      newPoints = [ann.points[0]+dx, ann.points[1]+dy];
    }
    // 移除pushUndo，交由外部控制
    const newAnns = [...anns];
    newAnns[idx] = { ...ann, points: newPoints };
    return {
      annotations: { ...s.annotations, [imageId]: newAnns },
    };
  }),
  deleteAnnotation: (imageId, annotationId) => set((s) => {
    const anns = s.annotations[imageId] || [];
    const idx = anns.findIndex(a => a.id === annotationId);
    if (idx === -1) return {};
    // 撤销栈
    get().pushUndo(imageId, anns);
    const newAnns = anns.filter(a => a.id !== annotationId);
    return {
      annotations: { ...s.annotations, [imageId]: newAnns },
      selectedAnnotationId: { ...s.selectedAnnotationId, [imageId]: null },
    };
  }),
  undoStack: {},
  redoStack: {},
  pushUndo: (imageId, anns) => set((s) => ({
    undoStack: {
      ...s.undoStack,
      [imageId]: [...(s.undoStack[imageId] || []), JSON.parse(JSON.stringify(anns))],
    },
    redoStack: {
      ...s.redoStack,
      [imageId]: [],
    },
  })),
  undo: (imageId) => set((s) => {
    const stack = s.undoStack[imageId] || [];
    if (stack.length === 0) return {};
    const redoStack = s.redoStack[imageId] || [];
    const prev = stack[stack.length - 1];
    return {
      annotations: {
        ...s.annotations,
        [imageId]: prev,
      },
      undoStack: {
        ...s.undoStack,
        [imageId]: stack.slice(0, -1),
      },
      redoStack: {
        ...s.redoStack,
        [imageId]: [...redoStack, s.annotations[imageId] || []],
      },
    };
  }),
  redo: (imageId) => set((s) => {
    const stack = s.redoStack[imageId] || [];
    if (stack.length === 0) return {};
    const undoStack = s.undoStack[imageId] || [];
    const next = stack[stack.length - 1];
    return {
      annotations: {
        ...s.annotations,
        [imageId]: next,
      },
      redoStack: {
        ...s.redoStack,
        [imageId]: stack.slice(0, -1),
      },
      undoStack: {
        ...s.undoStack,
        [imageId]: [...undoStack, s.annotations[imageId] || []],
      },
    };
  }),
  drawing: null,
  setDrawing: (drawing) => set({ drawing }),
  editingTextId: null,
  setEditingTextId: (id) => set({ editingTextId: id }),
})); 