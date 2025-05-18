import React, { useState, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useImageStore, ImageInfo } from '../stores/imageStore';

interface ExifSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

// 自定义工具提示组件
const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { darkMode } = useSettingsStore(); // 获取深色模式状态
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className={`absolute top-full left-1/2 transform -translate-x-1/2 translate-y-1 px-2 py-1 text-xs rounded whitespace-nowrap z-50 mt-1 shadow-lg
            ${darkMode 
              ? 'bg-gray-700 text-gray-200' 
              : 'bg-gray-100 text-gray-700'
            }`}
        >
          {text}
          <div 
            className={`absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent 
              ${darkMode 
                ? 'border-b-gray-700' 
                : 'border-b-gray-100'
              }`} 
          />
        </div>
      )}
    </div>
  );
};

const ExifSettingsPanel: React.FC<ExifSettingsPanelProps> = ({ isOpen, onClose }) => {
  const { exifSettings, toggleExifSetting, toggleAllExifSettings } = useSettingsStore();

  if (!isOpen) return null;

  const displayNames: { [key: string]: string } = {
    FileName: '文件名',
    Resolution: '分辨率',
    Make: '相机品牌',
    Model: '相机型号',
    LensModel: '镜头型号',
    FocalLength: '焦距',
    FNumber: '光圈',
    ExposureTime: '快门速度',
    ISO: 'ISO',
    DateTimeOriginal: '拍摄时间'
  };

  return (
    <div className="absolute right-0 top-12 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 min-w-[180px] z-20">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">显示设置</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <span className="text-lg">×</span>
        </button>
      </div>
      
      <div className="flex space-x-2 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button 
          onClick={() => toggleAllExifSettings(true)}
          className="px-2 py-0.5 text-xs rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-800/50 transition-colors"
        >
          全选
        </button>
        <button 
          onClick={() => toggleAllExifSettings(false)}
          className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          取消全选
        </button>
      </div>
      
      <div className="space-y-1">
        {Object.entries(exifSettings)
          .filter(([key]) => ['Make', 'Model', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO'].includes(key))
          .map(([key, value]) => (
            <label key={key} className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-0.5 rounded-md transition-colors">
              <input
                type="checkbox"
                checked={value}
                onChange={() => toggleExifSetting(key as keyof typeof exifSettings)}
                className="form-checkbox h-3.5 w-3.5 text-sky-500 rounded border-gray-300 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-sky-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{displayNames[key] || key}</span>
            </label>
          ))}
        
        <div className="border-t border-gray-200 dark:border-gray-700 my-1 pt-1">
          {Object.entries(exifSettings)
            .filter(([key]) => !['Make', 'Model', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO'].includes(key))
            .map(([key, value]) => (
              <label key={key} className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-0.5 rounded-md transition-colors">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => toggleExifSetting(key as keyof typeof exifSettings)}
                  className="form-checkbox h-3.5 w-3.5 text-sky-500 rounded border-gray-300 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-sky-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{displayNames[key] || key}</span>
              </label>
            ))}
        </div>
      </div>
    </div>
  );
};

const SettingsBar: React.FC = () => {
  const { darkMode, toggleDarkMode, demoMode, toggleDemoMode } = useSettingsStore();
  const { images, addImages, clearImages } = useImageStore();
  const [showExifSettings, setShowExifSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    // 先清空当前图片
    clearImages();
    
    const processedImages = await Promise.all(
      imageFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        const imageInfo: ImageInfo = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`,
          url,
          name: file.name,
          exif: {
            FileName: file.name,
            Resolution: '',
            Make: 'Unknown',
            Model: 'Unknown',
            LensModel: 'Unknown',
            FocalLength: 0,
            FNumber: 0,
            ExposureTime: '0',
            ISO: 0,
            DateTimeOriginal: file.lastModified.toString(),
          }
        };
        return imageInfo;
      })
    );

    addImages(processedImages);
  };

  // 如果没有图片，不显示任何按钮
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4 setting-bar">
      <div className="relative">
        <Tooltip text="显示设置">
          <button
            onClick={() => setShowExifSettings(!showExifSettings)}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 ${
              darkMode 
                ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                : 'bg-sky-500/10 hover:bg-sky-500/20 text-gray-900'
            } font-medium flex items-center`}
          >
            <svg 
              className="w-5 h-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </Tooltip>
        <ExifSettingsPanel isOpen={showExifSettings} onClose={() => setShowExifSettings(false)} />
      </div>

      <Tooltip text="演示模式">
        <button
          onClick={toggleDemoMode}
          className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 ${
            demoMode 
              ? 'bg-sky-600 hover:bg-sky-700 text-white' 
              : darkMode 
                ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                : 'bg-sky-500/10 hover:bg-sky-500/20 text-gray-900'
          } font-medium desktop-only`}
        >
          <svg 
            className="w-5 h-5" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      </Tooltip>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`px-7 py-3 rounded-full backdrop-blur-md transition-all duration-200 ${
          darkMode 
            ? 'bg-sky-600 hover:bg-sky-700 text-white' 
            : 'bg-sky-500 hover:bg-sky-600 text-white'
        } font-medium text-sm scale-105`}
      >
        重新上传
      </button>
      
      <div className="relative desktop-only">
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          id="add-image-input"
          onChange={(e) => {
            if (e.target.files) {
              const files = e.target.files;
              const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
              if (imageFiles.length === 0) return;
              
              Promise.all(
                imageFiles.map(async (file) => {
                  const url = URL.createObjectURL(file);
                  const imageInfo: ImageInfo = {
                    id: `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`,
                    url,
                    name: file.name,
                    exif: {
                      FileName: file.name,
                      Resolution: '',
                      Make: 'Unknown',
                      Model: 'Unknown',
                      LensModel: 'Unknown',
                      FocalLength: 0,
                      FNumber: 0,
                      ExposureTime: '0',
                      ISO: 0,
                      DateTimeOriginal: file.lastModified.toString(),
                    }
                  };
                  return imageInfo;
                })
              ).then(newImages => {
                addImages(newImages);
              });
              
              e.target.value = '';
            }
          }}
        />
        <Tooltip text="添加图片">
          <button
            onClick={() => document.getElementById('add-image-input')?.click()}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 ${
              darkMode 
                ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                : 'bg-sky-500/10 hover:bg-sky-500/20 text-gray-900'
            } font-medium`}
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
                d="M12 4v16m8-8H4" 
              />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default SettingsBar; 