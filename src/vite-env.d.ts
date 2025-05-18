/// <reference types="vite/client" />

declare module 'react-zoom-pan-pinch' {
  import { ComponentType, ReactNode } from 'react';

  interface TransformWrapperProps {
    children: ReactNode;
    ref?: any;
    onTransform?: (state: { scale: number; positionX: number; positionY: number }) => void;
    centerOnInit?: boolean;
    minScale?: number;
    maxScale?: number;
  }

  interface TransformComponentProps {
    children: ReactNode;
    wrapperClass?: string;
  }

  export const TransformWrapper: ComponentType<TransformWrapperProps>;
  export const TransformComponent: ComponentType<TransformComponentProps>;
}

// 占位图片
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
} 