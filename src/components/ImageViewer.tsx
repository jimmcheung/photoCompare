import React, { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import ExifPanel from './ExifPanel';
import { ImageInfo, useImageStore } from '../stores/imageStore';
import { processImageFile } from '../utils/imageProcessing';

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface Props {
  images?: ImageInfo[];
}

const ImageViewer: React.FC<Props> = ({ images = [] }) => {
  const { darkMode, syncZoom, demoMode } = useSettingsStore();
  const { removeImage, addImages } = useImageStore();
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [transforms, setTransforms] = useState<Transform[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 处理文件上传
  const handleFiles = async (files: FileList) => {
    if (!files.length) return;
    
    setIsProcessing(true);
    try {
      const processedImages = await Promise.all(
        Array.from(files)
          .filter(file => file.type.startsWith('image/'))
          .map(processImageFile)
      );
      addImages(processedImages);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('部分图片处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 初始化 transforms
  useEffect(() => {
    setTransforms(Array(images.length).fill({ scale: 1, x: 0, y: 0 }));
  }, [images.length]);

  // 拖动状态
  const dragState = useRef({
    isDragging: false,
    currentIndex: -1,
    startX: 0,
    startY: 0
  });

  useEffect(() => {
    containerRefs.current = containerRefs.current.slice(0, images.length);
    imageRefs.current = imageRefs.current.slice(0, images.length);
  }, [images.length]);

  useEffect(() => {
    const containers = containerRefs.current;

    const updateTransform = (index: number, newTransform: Transform) => {
      setTransforms(prev => {
        const newTransforms = [...prev];
        if (syncZoom) {
          // 如果开启同步，则更新所有图片的变换
          return prev.map(() => ({ ...newTransform }));
        } else {
          // 如果未开启同步，则只更新当前图片
          newTransforms[index] = newTransform;
          return newTransforms;
        }
      });
    };

    const handleWheel = (e: WheelEvent, index: number) => {
      e.preventDefault();
      const currentTransform = transforms[index] || { scale: 1, x: 0, y: 0 };
      const delta = e.deltaY * -0.01;
      const newScale = Math.max(0.1, Math.min(10, currentTransform.scale + delta));

      updateTransform(index, {
        ...currentTransform,
        scale: newScale,
      });
    };

    const handleMouseDown = (e: MouseEvent, index: number) => {
      // 仅在点击图片时才开始拖动
      if ((e.target as HTMLElement).tagName !== 'IMG') return;
      
      const currentTransform = transforms[index] || { scale: 1, x: 0, y: 0 };
      dragState.current = {
        isDragging: true,
        currentIndex: index,
        startX: e.clientX - currentTransform.x,
        startY: e.clientY - currentTransform.y
      };
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return;
      const { currentIndex, startX, startY } = dragState.current;
      const currentTransform = transforms[currentIndex] || { scale: 1, x: 0, y: 0 };

      const newTransform = {
        ...currentTransform,
        x: e.clientX - startX,
        y: e.clientY - startY,
      };

      updateTransform(currentIndex, newTransform);
    };

    const handleMouseUp = () => {
      dragState.current.isDragging = false;
    };

    containers.forEach((container, index) => {
      if (!container) return;
      
      container.addEventListener('wheel', (e) => handleWheel(e, index), { passive: false });
      container.addEventListener('mousedown', (e) => handleMouseDown(e, index));
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseUp);
    });

    return () => {
      containers.forEach((container) => {
        if (!container) return;
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseUp);
      });
    };
  }, [transforms, syncZoom]);

  if (images.length === 0) {
    // 当没有图片时，重置 hasViewedImages 状态并返回 null
    useImageStore.setState({ hasViewedImages: false });
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {images.length === 1 ? (
        <div className="w-full max-w-[800px] h-[80vh] px-4 flex items-center justify-center">
          <div 
            key={images[0].id} 
            className="relative w-full h-full flex items-center justify-center"
          >
            <div
              ref={el => containerRefs.current[0] = el}
              className={`w-full h-full ${
                darkMode ? 'bg-black' : 'bg-white'
              } rounded-lg shadow-lg overflow-hidden relative group`}
            >
              {!demoMode && (
                <button
                  onClick={() => {
                    removeImage(images[0].id);
                  }}
                  className={`absolute top-2 right-2 z-50 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100
                    ${darkMode 
                      ? 'bg-gray-800/90 text-gray-100 hover:bg-gray-700' 
                      : 'bg-white/80 text-gray-700 hover:bg-white'}`}
                  title="删除图片"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              )}
              <img
                ref={el => imageRefs.current[0] = el}
                src={images[0].url}
                alt={images[0].exif.FileName}
                className="w-full h-full object-contain select-none"
                style={{
                  transform: `translate(${transforms[0]?.x || 0}px, ${transforms[0]?.y || 0}px) scale(${transforms[0]?.scale || 1})`,
                  transition: dragState.current.isDragging ? 'none' : 'transform 0.1s',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                draggable={false}
              />
              <ExifPanel imageInfo={images[0]} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 w-full h-full items-center justify-center px-4 max-w-screen-2xl mx-auto" style={{
          gridTemplateColumns: `repeat(${images.length}, minmax(0, 1fr))`
        }}>
          {images.map((image, index) => (
            <div key={image.id} className="relative w-full h-full flex items-center justify-center">
              <div
                ref={el => containerRefs.current[index] = el}
                className={`w-full h-[80vh] ${
                  darkMode ? 'bg-black' : 'bg-white'
                } rounded-lg shadow-lg overflow-hidden relative group`}
              >
                {!demoMode && (
                  <button
                    onClick={() => {
                      removeImage(image.id);
                    }}
                    className={`absolute top-2 right-2 z-50 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100
                      ${darkMode 
                        ? 'bg-gray-800/90 text-gray-100 hover:bg-gray-700' 
                        : 'bg-white/80 text-gray-700 hover:bg-white'}`}
                    title="删除图片"
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                )}
                <img
                  ref={el => imageRefs.current[index] = el}
                  src={image.url}
                  alt={image.exif.FileName}
                  className="w-full h-full object-contain select-none"
                  style={{
                    transform: `translate(${transforms[index]?.x || 0}px, ${transforms[index]?.y || 0}px) scale(${transforms[index]?.scale || 1})`,
                    transition: dragState.current.isDragging ? 'none' : 'transform 0.1s',
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                  draggable={false}
                />
                <ExifPanel imageInfo={image} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageViewer; 