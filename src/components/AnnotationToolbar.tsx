import React, { useRef, useState, useLayoutEffect } from 'react';
import { useAnnotationStore, AnnotationType } from '../stores/annotationStore';
import { PiPaintBrushDuotone, PiPaletteDuotone, PiTrashDuotone } from 'react-icons/pi';
import { FiEdit2, FiMove, FiType } from 'react-icons/fi';
import { MdColorLens, MdOutlineDeleteOutline } from 'react-icons/md';
import { HexColorPicker } from 'react-colorful';
import ReactDOM from 'react-dom';

const PRESET_COLORS = ['#FF3B30', '#FFD60A', '#007AFF'];
const STROKE_WIDTHS = [2, 4, 8];
const TOOLBAR_HEIGHT = 72;
const TOOLBAR_MIN_WIDTH = 480;
const TOOLBAR_MAX_WIDTH = 600;
const TOOLBAR_RADIUS = 999;

const TOOLS: { type: AnnotationType; icon: React.ReactNode; label: string }[] = [
  { type: 'move', icon: <FiMove size={22} style={{display:'block'}} />, label: '选择/移动' },
  { type: 'rect', icon: <svg width="22" height="22" viewBox="0 0 22 22" style={{display:'block'}}><rect x="4" y="4" width="14" height="14" rx="7" stroke="currentColor" strokeWidth="2.2" fill="none"/></svg>, label: '矩形' },
  { type: 'ellipse', icon: <svg width="22" height="22" viewBox="0 0 22 22" style={{display:'block'}}><ellipse cx="11" cy="11" rx="7" ry="7" stroke="currentColor" strokeWidth="2.2" fill="none"/></svg>, label: '圆形' },
  { type: 'pen', icon: <FiEdit2 size={22} style={{display:'block'}} />, label: '画笔' },
  { type: 'text', icon: <FiType size={22} style={{display:'block'}} />, label: '文字' },
];

// 正弦波生成函数（振幅固定1.35px，画布高度为线宽+16）
function getSinePath(width = 28, height = 16, cycles = 1, amp = 1.35) {
  const yMid = height / 2;
  let d = '';
  for (let i = 0; i <= width; i++) {
    const x = i;
    const y = yMid + amp * Math.sin((i / width) * cycles * 2 * Math.PI);
    d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  }
  return d;
}

const AnnotationToolbar: React.FC = () => {
  const {
    annotationTool, setAnnotationTool,
    annotationStrokeWidth, setStrokeWidth,
    annotationColor, setAnnotationColor,
    annotationToolbar,
    clearAnnotations, isAnnotateMode,
    annotations
  } = useAnnotationStore();
  const [showPalette, setShowPalette] = useState(false);
  const [customColor, setCustomColor] = useState('#FF3B30');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const paletteBtnRef = useRef<HTMLButtonElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [palettePos, setPalettePos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [showStrokeMenu, setShowStrokeMenu] = useState(false);
  const strokeBtnRef = useRef<HTMLButtonElement>(null);
  const [strokeMenuPos, setStrokeMenuPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  React.useEffect(() => {
    if (annotationToolbar.visible) {
      setShouldRender(true);
      setTimeout(() => {
        if (toolbarRef.current) {
          const rect = toolbarRef.current.getBoundingClientRect();
          setPos({
            x: (window.innerWidth - rect.width) / 2,
            y: window.innerHeight * 0.7,
          });
        }
        setAnimating(true);
      }, 10);
      setAnnotationColor('#FF3B30');
      setCustomColor('#FF3B30');
      setStrokeWidth(4);
    } else if (shouldRender) {
      setAnimating(false);
    }
  }, [annotationToolbar.visible]);

  useLayoutEffect(() => {
    if (!animating && shouldRender) {
      const timer = setTimeout(() => setShouldRender(false), 350);
      return () => clearTimeout(timer);
    }
  }, [animating, shouldRender]);

  const handleToolbarPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.toolbar-btn')) return;
    if (e.button !== 0) return;
    if (!toolbarRef.current) return;
    const rect = toolbarRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd);
  };
  const handleDragMove = (e: PointerEvent) => {
    setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
  };
  const handleDragEnd = () => {
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', handleDragEnd);
  };

  const style: React.CSSProperties = {
    position: 'fixed',
    left: pos.x,
    top: pos.y,
    zIndex: 1000,
    width: 'fit-content',
    height: TOOLBAR_HEIGHT,
    borderRadius: TOOLBAR_RADIUS,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px) saturate(1.5)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    border: '1.5px solid rgba(180,180,200,0.13)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    opacity: animating ? 1 : 0,
    pointerEvents: shouldRender ? 'auto' : 'none',
    transform: animating
      ? 'scale(1) translateY(0px)'
      : 'scale(0.95) translateY(40px)',
    transition: 'opacity 0.35s cubic-bezier(.4,0,.2,1), transform 0.35s cubic-bezier(.4,0,.2,1)',
    padding: '0 36px',
    boxSizing: 'border-box',
  };

  const palettePopoverStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 2000,
    left: 0,
    top: 0,
    pointerEvents: showPalette ? 'auto' : 'none',
    opacity: showPalette ? 1 : 0,
    transition: 'opacity 0.18s',
  };

  React.useEffect(() => {
    if (showPalette && paletteBtnRef.current) {
      const rect = paletteBtnRef.current.getBoundingClientRect();
      const popoverWidth = 220;
      const popoverHeight = 170;
      const POPOVER_GAP = 100;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;

      // 弹窗底部紧贴按钮顶部上方100px
      let top = rect.top - popoverHeight - POPOVER_GAP;
      // 如果上方空间不足，才考虑下方
      if (top < POPOVER_GAP) {
        top = rect.bottom + POPOVER_GAP;
      }
      // 屏幕边界保护
      if (left < 8) left = 8;
      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }
      setPalettePos({ left, top });
    }
  }, [showPalette, pos]);

  React.useEffect(() => {
    if (!showPalette) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest('.color-popover') &&
        !(e.target as HTMLElement).closest('.toolbar-btn')
      ) {
        setShowPalette(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [showPalette]);

  const btnBase = {
    border: 'none',
    borderRadius: '50%',
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    maxWidth: 40,
    maxHeight: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    transition: 'box-shadow 0.18s, background 0.18s',
    padding: 0,
    overflow: 'hidden',
    background: 'transparent',
  };

  // 线宽弹窗定位
  React.useEffect(() => {
    if (showStrokeMenu && strokeBtnRef.current) {
      const rect = strokeBtnRef.current.getBoundingClientRect();
      const menuWidth = 48;
      const menuHeight = 140;
      let left = rect.left + rect.width / 2 - menuWidth / 2;
      let top = rect.top - menuHeight - 12;
      if (top < 8) top = rect.bottom + 12;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      setStrokeMenuPos({ left, top });
    }
    // 点击外部关闭菜单
    if (showStrokeMenu) {
      const handleClick = (e: MouseEvent) => {
        const popover = document.querySelector('.stroke-menu-popover');
        if (
          popover && !popover.contains(e.target as Node) &&
          strokeBtnRef.current && !strokeBtnRef.current.contains(e.target as Node)
        ) {
          setShowStrokeMenu(false);
        }
      };
      window.addEventListener('mousedown', handleClick);
      return () => window.removeEventListener('mousedown', handleClick);
    }
  }, [showStrokeMenu, pos]);

  if (!shouldRender) return null;

  // 弹窗渲染逻辑用 Portal
  const colorPopover = showPalette ? ReactDOM.createPortal(
    <div
      className="color-popover"
      onPointerDown={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        zIndex: 3000,
        left: palettePos.left,
        top: palettePos.top,
        width: 220,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 18,
        boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        border: '1.5px solid #e0e0e0',
        opacity: 1,
        pointerEvents: 'auto',
      }}
      onClick={e => e.stopPropagation()}
    >
      <HexColorPicker
        color={customColor}
        onChange={color => {
          setCustomColor(color);
          setAnnotationColor(color);
        }}
        style={{ width: 180, height: 120 }}
      />
      <input
        type="text"
        value={customColor}
        onChange={e => {
          setCustomColor(e.target.value);
          setAnnotationColor(e.target.value);
        }}
        style={{ width: 90, fontSize: 15, border: '1px solid #eee', borderRadius: 8, padding: '3px 8px', textAlign: 'center', marginTop: 4 }}
        maxLength={9}
      />
      <button
        style={{ marginTop: 8, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={() => setShowPalette(false)}
      >关闭</button>
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={toolbarRef}
      style={style}
      className="annotation-toolbar"
      onPointerDown={handleToolbarPointerDown}
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {TOOLS.map(tool => (
            <button
              key={tool.type}
              className="toolbar-btn"
              onClick={() => setAnnotationTool(tool.type)}
              style={{
                ...btnBase,
                background: annotationTool === tool.type ? '#e6f0ff' : 'transparent',
                color: annotationTool === tool.type ? '#007AFF' : '#333',
                boxShadow: annotationTool === tool.type ? '0 0 0 3px #007AFF66' : undefined,
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = annotationTool === tool.type ? '0 0 0 3px #007AFF66' : '0 0 0 3px #007AFF33'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = annotationTool === tool.type ? '0 0 0 3px #007AFF66' : 'none'}
              onFocus={e => e.currentTarget.style.boxShadow = annotationTool === tool.type ? '0 0 0 3px #007AFF66' : '0 0 0 3px #007AFF33'}
              onBlur={e => e.currentTarget.style.boxShadow = annotationTool === tool.type ? '0 0 0 3px #007AFF66' : 'none'}
              title={tool.label}
            >
              <span style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {tool.icon}
              </span>
            </button>
          ))}
        </div>
        <div className="annotation-toolbar-divider" style={{height: 36, width: 1.5, background: 'rgba(120,120,140,0.18)', margin: '0 16px'}} />
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            ref={strokeBtnRef}
            className="toolbar-btn"
            onClick={() => setShowStrokeMenu(v => !v)}
            style={{
              ...btnBase,
              background: 'transparent',
              boxShadow: showStrokeMenu ? '0 0 0 3px #007AFF66' : 'none',
              outline: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              overflow: 'hidden',
            }}
            title="线宽"
            onMouseEnter={e => { const p = e.currentTarget.querySelector('path'); if (p) p.setAttribute('stroke', '#007AFF'); }}
            onMouseLeave={e => { const p = e.currentTarget.querySelector('path'); if (p) p.setAttribute('stroke', '#333'); }}
            onFocus={e => { const p = e.currentTarget.querySelector('path'); if (p) p.setAttribute('stroke', '#007AFF'); }}
            onBlur={e => { const p = e.currentTarget.querySelector('path'); if (p) p.setAttribute('stroke', '#333'); }}
          >
            <span style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <svg width="28" height={annotationStrokeWidth + 16} viewBox={`0 0 28 ${annotationStrokeWidth + 16}`} style={{display:'block'}}>
                <path d={getSinePath(28, annotationStrokeWidth + 16, 1, 1.35)} stroke="#333" strokeWidth={annotationStrokeWidth} fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </button>
          {showStrokeMenu && ReactDOM.createPortal(
            <div
              className="stroke-menu-popover"
              onPointerDown={e => e.stopPropagation()}
              style={{
                position: 'fixed',
                zIndex: 3000,
                left: strokeMenuPos.left,
                top: strokeMenuPos.top,
                width: 48,
                background: 'rgba(255,255,255,0.98)',
                borderRadius: 25,
                boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                border: '1.5px solid #e0e0e0',
                opacity: 1,
                pointerEvents: 'auto',
              }}
            >
              {STROKE_WIDTHS.map(w => (
                <button
                  key={w}
                  onClick={() => { setStrokeWidth(w); setShowStrokeMenu(false); }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    background: annotationStrokeWidth === w ? '#e6f0ff' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'none', // 默认无外圈
                    margin: 0,
                    padding: 0,
                    cursor: 'pointer',
                  }}
                  title={`粗细${w}`}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px #007AFF66'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = annotationStrokeWidth === w ? '0 0 0 3px #007AFF66' : 'none'}
                  onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px #007AFF66'}
                  onBlur={e => e.currentTarget.style.boxShadow = annotationStrokeWidth === w ? '0 0 0 3px #007AFF66' : 'none'}
                >
                  <svg width="28" height={w + 16} viewBox={`0 0 28 ${w + 16}`} style={{display:'block'}}>
                    <path d={getSinePath(28, w + 16, 1, 1.35)} stroke={annotationStrokeWidth === w ? '#007AFF' : '#333'} strokeWidth={w} fill="none" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
        <div className="annotation-toolbar-divider" style={{height: 36, width: 1.5, background: 'rgba(120,120,140,0.18)', margin: '0 16px'}} />
        <div style={{ display: 'flex', gap: 12 }}>
          {PRESET_COLORS.map(c => {
            return (
              <button
                key={c}
                className="toolbar-btn"
                onClick={() => setAnnotationColor(c)}
                style={{
                  ...btnBase,
                  background: '#fff',
                  boxShadow: annotationColor === c ? '0 0 0 3px #007AFF66' : undefined,
                  border: 'none',
                  outline: 'none',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  overflow: 'hidden',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = annotationColor === c ? '0 0 0 3px #007AFF66' : '0 0 0 3px #007AFF33'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = annotationColor === c ? '0 0 0 3px #007AFF66' : 'none'}
                onFocus={e => e.currentTarget.style.boxShadow = annotationColor === c ? '0 0 0 3px #007AFF66' : '0 0 0 3px #007AFF33'}
                onBlur={e => e.currentTarget.style.boxShadow = annotationColor === c ? '0 0 0 3px #007AFF66' : 'none'}
                title={c}
              >
                <span style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <span style={{display:'block',width:25,height:25,borderRadius:'50%',background:c}}></span>
                </span>
              </button>
            );
          })}
          <button
            ref={paletteBtnRef}
            className="toolbar-btn"
            style={{
              ...btnBase,
              background: '#fff',
              boxShadow: (!PRESET_COLORS.includes(annotationColor) && customColor === annotationColor) || showPalette ? '0 0 0 3px #007AFF66' : 'none',
              outline: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              overflow: 'hidden',
            }}
            onClick={() => setShowPalette(v => !v)}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px #007AFF66'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = (!PRESET_COLORS.includes(annotationColor) && customColor === annotationColor) || showPalette ? '0 0 0 3px #007AFF66' : 'none'}
            onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px #007AFF66'}
            onBlur={e => e.currentTarget.style.boxShadow = (!PRESET_COLORS.includes(annotationColor) && customColor === annotationColor) || showPalette ? '0 0 0 3px #007AFF66' : 'none'}
            title="更多颜色"
          >
            <span style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:'block',margin:'auto'}}>
                <circle cx="15" cy="15" r="13" stroke="#bbb" strokeWidth="3" fill="none"/>
                <path d="M15 2 A13 13 0 0 1 28 15" stroke="#FF3B30" strokeWidth="4" fill="none"/>
                <path d="M28 15 A13 13 0 0 1 15 28" stroke="#FFD60A" strokeWidth="4" fill="none"/>
                <path d="M15 28 A13 13 0 0 1 2 15" stroke="#007AFF" strokeWidth="4" fill="none"/>
                <path d="M2 15 A13 13 0 0 1 15 2" stroke="#34C759" strokeWidth="4" fill="none"/>
              </svg>
              <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: '50%', background: customColor, border: '1.5px solid #eee', boxShadow: '0 0 2px #007AFF44', display:'flex', alignItems:'center', justifyContent:'center' }} />
            </span>
          </button>
        </div>
        <div className="annotation-toolbar-divider" style={{height: 36, width: 1.5, background: 'rgba(120,120,140,0.18)', margin: '0 16px'}} />
        <div style={{ display: 'flex', gap: 0 }}>
          <button
            className="toolbar-btn"
            onClick={() => {
              Object.keys(annotations).forEach(id => clearAnnotations(id));
            }}
            style={{
              ...btnBase,
              background: '#fff',
              color: '#FF3B30',
              boxShadow: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px #FF3B3066'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px #FF3B3066'}
            onBlur={e => e.currentTarget.style.boxShadow = 'none'}
            title="清空所有标注"
          >
            <span style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <MdOutlineDeleteOutline size={22} style={{display:'block',margin:'auto'}} />
            </span>
          </button>
        </div>
      </div>
      {colorPopover}
    </div>
  );
};

export default AnnotationToolbar; 