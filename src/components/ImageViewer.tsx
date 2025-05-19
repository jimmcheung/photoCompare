import React, { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import ExifPanel from './ExifPanel';
import { ImageInfo, useImageStore } from '../stores/imageStore';
import { processImageFile } from '../utils/imageProcessing';
import { useAnnotationStore, AnnotationType } from '../stores/annotationStore';

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
  const {
    isAnnotateMode, annotationTool, annotationColor, annotationStrokeWidth, annotations, addAnnotation, setAnnotations, undo, redo,
    selectedAnnotationId, setSelectedAnnotationId, drawing, setDrawing, editingTextId, setEditingTextId, deleteAnnotation
  } = useAnnotationStore();
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [transforms, setTransforms] = useState<Transform[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 标注拖动相关状态
  const [draggingAnn, setDraggingAnn] = useState<null | {
    imgIdx: number;
    annId: string;
    start: [number, number];
    last: [number, number];
  }>(null);

  // 新增：单图模式下图片原始宽高
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  // 新增：viewBox状态
  const [viewBox, setViewBox] = useState<[number, number, number, number] | null>(null);

  // 解析图片分辨率，初始化imgSize和viewBox
  useEffect(() => {
    if (images.length === 1) {
      const res = images[0].exif?.Resolution || '';
      const match = res.match(/(\d+)\s*[×x]\s*(\d+)/);
      if (match) {
        const width = parseInt(match[1], 10);
        const height = parseInt(match[2], 10);
        setImgSize({ width, height });
        setViewBox([0, 0, width, height]);
      }
    }
  }, [images]);

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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
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
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    };

    containers.forEach((container, index) => {
      if (!container) return;
      container.addEventListener('wheel', (e) => handleWheel(e, index), { passive: false });
      container.addEventListener('mousedown', (e) => handleMouseDown(e, index));
    });

    return () => {
      containers.forEach((container) => {
        if (!container) return;
        // 只需移除wheel和mousedown，mousemove/mouseup在window上移除
        container.removeEventListener('wheel', (e) => handleWheel(e, 0));
        container.removeEventListener('mousedown', (e) => handleMouseDown(e, 0));
      });
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [transforms, syncZoom]);

  // 处理SVG绘制事件（仅用于新建标注）
  const getSvgPoint = (e: React.PointerEvent) => {
    const svg = e.currentTarget as SVGSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return [0, 0] as [number, number];
    const svgPt = pt.matrixTransform(ctm.inverse());
    return [svgPt.x, svgPt.y] as [number, number];
  };

  const handleSvgPointerDown = (e: React.PointerEvent, imgIdx: number) => {
    if (!isAnnotateMode) return;
    if (draggingAnn) return;
    if (drawing && drawing.imageId !== images[imgIdx].id) return;
    const [x, y] = getSvgPoint(e);
    if (annotationTool === 'move') {
      // move模式下，点击标注可选中
      const anns = annotations[images[imgIdx].id] || [];
      let found = false;
      for (let i = anns.length - 1; i >= 0; i--) {
        const ann = anns[i];
        // 简单包围盒判断
        if (ann.type === 'rect' || ann.type === 'ellipse') {
          const [x1, y1, x2, y2] = ann.points;
          if (x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(y1, y2) && y <= Math.max(y1, y2)) {
            setSelectedAnnotationId(images[imgIdx].id, ann.id);
            found = true;
            break;
          }
        } else if (ann.type === 'pen') {
          // 粗略判断
          for (let j = 0; j < ann.points.length; j += 2) {
            if (Math.abs(ann.points[j] - x) < 8 && Math.abs(ann.points[j+1] - y) < 8) {
              setSelectedAnnotationId(images[imgIdx].id, ann.id);
              found = true;
              break;
            }
          }
        } else if (ann.type === 'text') {
          const [tx, ty] = ann.points;
          if (Math.abs(tx - x) < 40 && Math.abs(ty - y) < 24) {
            setSelectedAnnotationId(images[imgIdx].id, ann.id);
            found = true;
            break;
          }
        }
      }
      if (!found) setSelectedAnnotationId(images[imgIdx].id, null);
      return;
    }
    if (annotationTool === 'text') {
      // 新建文字标注
      const newAnn = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: 'text' as AnnotationType,
        points: [x, y],
        color: annotationColor,
        strokeWidth: annotationStrokeWidth,
        text: '',
        fontSize: 18,
      };
      addAnnotation(images[imgIdx].id, newAnn);
      setSelectedAnnotationId(images[imgIdx].id, newAnn.id);
      setEditingTextId?.(newAnn.id);
      return;
    }
    // 其他类型绘制逻辑
    if (annotationTool === 'pen') {
      setDrawing({ type: 'pen', start: [x, y], points: [x, y], imageId: images[imgIdx].id });
    } else {
      setDrawing({ type: annotationTool, start: [x, y], points: [x, y, x, y], imageId: images[imgIdx].id });
    }
  };

  const handleSvgPointerMove = (e: React.PointerEvent, imgIdx: number) => {
    if (!isAnnotateMode) return;
    if (!drawing || drawing.imageId !== images[imgIdx].id) return;
    if (draggingAnn && images[imgIdx].id === drawing.imageId) {
      const [x, y] = getSvgPoint(e);
      const dx = draggingAnn ? x - draggingAnn.last[0] : 0;
      const dy = draggingAnn ? y - draggingAnn.last[1] : 0;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        if (syncZoom) {
          images.forEach(img => {
            if (selectedAnnotationId[img.id]) {
              useAnnotationStore.getState().moveAnnotation(img.id, selectedAnnotationId[img.id]!, dx, dy);
            }
          });
        } else {
          useAnnotationStore.getState().moveAnnotation(images[imgIdx].id, draggingAnn.annId, dx, dy);
        }
        if (draggingAnn) setDraggingAnn({ ...draggingAnn, last: [x, y] });
      }
      return;
    }
    const [x, y] = getSvgPoint(e);
    if (drawing && drawing.type === 'pen') {
      setDrawing({ ...drawing, points: [...drawing.points, x, y] });
    } else if (drawing) {
      setDrawing({ ...drawing, points: [drawing.start[0], drawing.start[1], x, y] });
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent, imgIdx: number) => {
    if (!isAnnotateMode) return;
    if (!drawing || drawing.imageId !== images[imgIdx].id) return;
    if (draggingAnn) {
      setDraggingAnn(null);
      return;
    }
    const ann = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: drawing.type,
      points: drawing.points,
      color: annotationColor,
      strokeWidth: annotationStrokeWidth,
    };
    if (syncZoom) {
      images.forEach(img => addAnnotation(img.id, ann));
    } else {
      addAnnotation(images[imgIdx].id, ann);
    }
    setDrawing(null);
  };

  // 撤销/重做快捷键
  useEffect(() => {
    if (!isAnnotateMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        // 撤销当前图片
        if (images.length > 0) undo(images[0].id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        // 重做当前图片
        if (images.length > 0) redo(images[0].id);
      }
      // 删除选中标注
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (syncZoom) {
          images.forEach(img => {
            const annId = selectedAnnotationId[img.id];
            if (annId) {
              useAnnotationStore.getState().deleteAnnotation(img.id, annId);
            }
          });
        } else {
          // 仅删除当前图片的选中标注
          images.forEach(img => {
            const annId = selectedAnnotationId[img.id];
            if (annId) {
              useAnnotationStore.getState().deleteAnnotation(img.id, annId);
            }
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnnotateMode, images, undo, redo, selectedAnnotationId, syncZoom]);

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
              {/* 回退：恢复原img标签和transform缩放方式 */}
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
              {/*
              // viewBox方案保留为注释，便于后续再次尝试
              {viewBox && imgSize.width > 0 && imgSize.height > 0 ? (
                <svg
                  className="absolute inset-0 w-full h-full z-20"
                  viewBox={`${viewBox[0]} ${viewBox[1]} ${viewBox[2]} ${viewBox[3]}`}
                  style={{
                    pointerEvents: isAnnotateMode ? 'auto' : 'none',
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                  onPointerDown={isAnnotateMode ? (e => handleSvgPointerDown(e, 0)) : undefined}
                  onPointerMove={isAnnotateMode ? (e => handleSvgPointerMove(e, 0)) : undefined}
                  onPointerUp={isAnnotateMode ? (e => handleSvgPointerUp(e, 0)) : undefined}
                >
                  <image
                    href={images[0].url}
                    x={0}
                    y={0}
                    width={imgSize.width}
                    height={imgSize.height}
                    style={{ pointerEvents: 'none' }}
                  />
                  // ...标注渲染...
                </svg>
              ) : null}
              */}
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
                <svg
                  className="absolute inset-0 w-full h-full z-20"
                  style={{
                    transform: `translate(${transforms[index]?.x || 0}px, ${transforms[index]?.y || 0}px) scale(${transforms[index]?.scale || 1})`,
                    touchAction: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    transition: dragState.current.isDragging ? 'none' : 'transform 0.1s',
                    pointerEvents: isAnnotateMode ? 'auto' : 'none',
                  }}
                  onPointerDown={isAnnotateMode ? (e => handleSvgPointerDown(e, index)) : undefined}
                  onPointerMove={isAnnotateMode ? (e => handleSvgPointerMove(e, index)) : undefined}
                  onPointerUp={isAnnotateMode ? (e => handleSvgPointerUp(e, index)) : undefined}
                >
                  {/* 已有标注 */}
                  {(annotations[image.id] || []).map(ann => {
                    const isSelected = selectedAnnotationId[image.id] === ann.id;
                    if (ann.type === 'rect') {
                      const [x1, y1, x2, y2] = ann.points;
                      return <rect key={ann.id} x={Math.min(x1, x2)} y={Math.min(y1, y2)} width={Math.abs(x2-x1)} height={Math.abs(y2-y1)} stroke={ann.color} strokeWidth={ann.strokeWidth} vectorEffect="non-scaling-stroke" fill="none"
                        onPointerDown={isAnnotateMode ? (e => handleSvgPointerDown(e, index)) : undefined}
                        style={isSelected ? { stroke: '#007AFF', strokeDasharray: '6 3', filter: 'drop-shadow(0 0 2px #007AFF88)' } : {}} />;
                    }
                    if (ann.type === 'ellipse') {
                      const [x1, y1, x2, y2] = ann.points;
                      return <ellipse key={ann.id} cx={(x1+x2)/2} cy={(y1+y2)/2} rx={Math.abs(x2-x1)/2} ry={Math.abs(y2-y1)/2} stroke={ann.color} strokeWidth={ann.strokeWidth} vectorEffect="non-scaling-stroke" fill="none"
                        onPointerDown={isAnnotateMode ? (e => handleSvgPointerDown(e, index)) : undefined}
                        style={isSelected ? { stroke: '#007AFF', strokeDasharray: '6 3', filter: 'drop-shadow(0 0 2px #007AFF88)' } : {}} />;
                    }
                    if (ann.type === 'pen') {
                      const pts = ann.points;
                      const d = pts.length >= 4 ? `M${pts[0]},${pts[1]} ` + pts.slice(2).map((v,i) => i%2===0?`L${pts[i+2]},${pts[i+3]}`:'').join(' ') : '';
                      return <path key={ann.id} d={d} stroke={ann.color} strokeWidth={ann.strokeWidth} vectorEffect="non-scaling-stroke" fill="none" strokeLinejoin="round" strokeLinecap="round"
                        onPointerDown={isAnnotateMode ? (e => handleSvgPointerDown(e, index)) : undefined}
                        style={isSelected ? { stroke: '#007AFF', strokeDasharray: '6 3', filter: 'drop-shadow(0 0 2px #007AFF88)' } : {}} />;
                    }
                    if (ann.type === 'text') {
                      const [tx, ty] = ann.points;
                      if (editingTextId === ann.id) {
                        // 编辑状态
                        return <foreignObject key={ann.id} x={tx-80} y={ty-18} width={160} height={60}>
                          <textarea
                            autoFocus
                            style={{ width: 160, height: 60, fontSize: ann.fontSize || 18, color: ann.color, border: '1.5px solid #007AFF', borderRadius: 8, resize: 'none', background: '#fff8', outline: 'none', padding: 4 }}
                            value={ann.text || ''}
                            onChange={e => {
                              const anns = [...(annotations[image.id] || [])];
                              const idx = anns.findIndex(a => a.id === ann.id);
                              if (idx !== -1) {
                                anns[idx] = { ...anns[idx], text: e.target.value };
                                setAnnotations(image.id, anns);
                              }
                            }}
                            onBlur={e => {
                              setEditingTextId?.(null);
                              if (!e.target.value.trim()) {
                                deleteAnnotation(image.id, ann.id);
                              }
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Escape') {
                                setEditingTextId?.(null);
                              }
                            }}
                          />
                        </foreignObject>;
                      }
                      // 非编辑状态
                      return <g key={ann.id}>
                        <text
                          x={tx}
                          y={ty}
                          fontSize={ann.fontSize || 18}
                          fill={ann.color}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          style={{ cursor: annotationTool === 'move' ? 'move' : 'text', userSelect: 'none', ...(isSelected ? { filter: 'drop-shadow(0 0 2px #007AFF88)' } : {}) }}
                          onDoubleClick={() => setEditingTextId?.(ann.id)}
                          onPointerDown={annotationTool === 'move' ? (e => handleSvgPointerDown(e, index)) : undefined}
                        >{ann.text}</text>
                        {annotationTool === 'move' && isSelected && (
                          <foreignObject x={tx+40} y={ty-24} width={32} height={32}>
                            <button
                              style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '1.5px solid #eee', color: '#FF3B30', boxShadow: '0 0 0 3px #FF3B3066', cursor: 'pointer' }}
                              onClick={() => deleteAnnotation(image.id, ann.id)}
                              tabIndex={-1}
                            >🗑</button>
                          </foreignObject>
                        )}
                      </g>;
                    }
                    return null;
                  })}
                  {/* 正在绘制 */}
                  {drawing && (
                    (syncZoom || image.id === drawing.imageId) && (
                      (() => {
                        if (drawing.type === 'rect') {
                          return <rect x={Math.min(drawing.start[0], drawing.points[2])} y={Math.min(drawing.start[1], drawing.points[3])} width={Math.abs(drawing.points[2]-drawing.start[0])} height={Math.abs(drawing.points[3]-drawing.start[1])} stroke={annotationColor} strokeWidth={annotationStrokeWidth} vectorEffect="non-scaling-stroke" fill="none" pointerEvents="none" />;
                        } else if (drawing.type === 'ellipse') {
                          return <ellipse cx={(drawing.start[0]+drawing.points[2])/2} cy={(drawing.start[1]+drawing.points[3])/2} rx={Math.abs(drawing.points[2]-drawing.start[0])/2} ry={Math.abs(drawing.points[3]-drawing.start[1])/2} stroke={annotationColor} strokeWidth={annotationStrokeWidth} vectorEffect="non-scaling-stroke" fill="none" pointerEvents="none" />;
                        } else if (drawing.type === 'pen' && drawing.points.length >= 4) {
                          return <path d={`M${drawing.points[0]},${drawing.points[1]} ` + drawing.points.slice(2).map((v,i) => i%2===0?`L${drawing.points[i+2]},${drawing.points[i+3]}`:'').join(' ')} stroke={annotationColor} strokeWidth={annotationStrokeWidth} vectorEffect="non-scaling-stroke" fill="none" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none" />;
                        }
                        return null;
                      })()
                    )
                  )}
                </svg>
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