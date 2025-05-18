import React, { useCallback, useState } from 'react';
import { useImageStore } from '../stores/imageStore';
import { useSettingsStore } from '../stores/settingsStore';
import { processImageFile } from '../utils/imageProcessing';

const ImageUploader: React.FC = () => {
  const { darkMode, demoMode } = useSettingsStore();
  const { addImages, clearImages, removeImage, images, addImage } = useImageStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = useCallback(async (files: FileList, shouldClear: boolean = true) => {
    if (!files.length) return;

    if (shouldClear && images.length > 0) {
      clearImages();
    }

    setIsProcessing(true);
    try {
      const processedImages = await Promise.all(
        Array.from(files)
          .filter(file => file.type.startsWith('image/') || 
                          file.name.toLowerCase().endsWith('.heic') || 
                          file.name.toLowerCase().endsWith('.heif'))
          .map(processImageFile)
      );
      addImages(processedImages);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('部分图片处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [addImages, clearImages, images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.heic,.heif';
    input.multiple = true;
    input.onchange = (e) => {
      if (e.target instanceof HTMLInputElement && e.target.files) {
        handleFiles(e.target.files);
      }
    };
    input.click();
  }, [handleFiles]);

  const renderImageList = () => (
    <div className="w-full">
      {!demoMode && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,.heic,.heif';
              input.multiple = true;
              input.onchange = (e) => {
                if (e.target instanceof HTMLInputElement && e.target.files) {
                  clearImages();
                  handleFiles(e.target.files, true);
                }
              };
              input.click();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${darkMode 
                ? 'bg-sky-500/20 text-gray-100 hover:bg-sky-500/30' 
                : 'bg-sky-500/10 text-gray-700 hover:bg-sky-500/20'}`}
          >
            重新上传
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,.heic,.heif';
              input.onchange = (e) => {
                if (e.target instanceof HTMLInputElement && e.target.files) {
                  handleFiles(e.target.files, false);
                }
              };
              input.click();
            }}
            className={`p-2 rounded-lg font-medium transition-all duration-200
              ${darkMode 
                ? 'bg-sky-500/20 text-gray-100 hover:bg-sky-500/30' 
                : 'bg-sky-500/10 text-gray-700 hover:bg-sky-500/20'}`}
            title="添加图片"
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
        </div>
      )}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${demoMode ? 'p-0' : ''}`}>
        {images.map((image) => (
          <div key={image.id} className={`relative group aspect-[3/2] ${darkMode ? 'bg-black' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-contain"
            />
            {!demoMode && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <button
                  onClick={() => removeImage(image.id)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    ${darkMode 
                      ? 'bg-gray-900/80 text-gray-100 hover:bg-gray-900' 
                      : 'bg-white/80 text-gray-700 hover:bg-white'}`}
                >
                  <svg 
                    className="w-4 h-4" 
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
                <div className="absolute bottom-0 left-0 right-0 p-3 text-sm text-white bg-gradient-to-t from-black/70 to-transparent">
                  <div className="space-y-1">
                    {image.exif.Make !== 'Unknown' && image.exif.Model !== 'Unknown' && (
                      <p>{image.exif.Make} {image.exif.Model}</p>
                    )}
                    {image.exif.LensModel !== 'Unknown' && (
                      <p>{image.exif.LensModel}</p>
                    )}
                    {image.exif.FocalLength > 0 && (
                      <p>{image.exif.FocalLength}mm</p>
                    )}
                    {image.exif.FNumber > 0 && (
                      <p>f/{image.exif.FNumber}</p>
                    )}
                    {image.exif.ISO > 0 && (
                      <p>{image.exif.ISO}</p>
                    )}
                    {image.exif.ExposureTime !== '0' && (
                      <p>{image.exif.ExposureTime}s</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${
      darkMode ? 'bg-black' : 'bg-gray-100'
    } ${demoMode ? 'demo-mode' : 'pt-12'}`}>
      <div className={`w-full max-w-4xl ${demoMode ? 'p-0 demo-content' : 'p-4 -mt-48'}`}>
        {demoMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className={`relative aspect-[3/2] ${darkMode ? 'bg-black' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-sm text-white bg-gradient-to-t from-black/70 to-transparent">
                  <div className="space-y-1">
                    {image.exif.Make !== 'Unknown' && image.exif.Model !== 'Unknown' && (
                      <p>{image.exif.Make} {image.exif.Model}</p>
                    )}
                    {image.exif.LensModel !== 'Unknown' && (
                      <p>{image.exif.LensModel}</p>
                    )}
                    {image.exif.FocalLength > 0 && (
                      <p>{image.exif.FocalLength}mm</p>
                    )}
                    {image.exif.FNumber > 0 && (
                      <p>f/{image.exif.FNumber}</p>
                    )}
                    {image.exif.ISO > 0 && (
                      <p>{image.exif.ISO}</p>
                    )}
                    {image.exif.ExposureTime !== '0' && (
                      <p>{image.exif.ExposureTime}s</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {isProcessing ? (
              <div className="text-center">
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>处理中...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center">
                <div
                  className={`flex flex-col items-center justify-center w-[480px] h-[320px] border-4 border-dashed rounded-2xl p-8 cursor-pointer
                    ${darkMode ? 'border-gray-800 text-gray-300 bg-black' : 'border-gray-300 text-gray-600'}
                    transition-all duration-200 
                    ${darkMode ? 'hover:border-sky-500/50 hover:bg-sky-500/10' : 'hover:border-sky-500/50 hover:bg-sky-500/5'}`}
                  onClick={handleClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <svg
                    className={`mx-auto h-12 w-12 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-base font-medium">点击或拖放图片到此处</h3>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>支持上传图片进行对比</p>
                  <p className={`mt-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>支持格式：JPG、PNG、GIF、WebP、HEIC、RAW等</p>
                </div>
                <div className={`mt-4 flex items-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>隐私声明：所有图片仅在您的浏览器中本地处理，不会上传到任何服务器</span>
                </div>
              </div>
            ) : (
              renderImageList()
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;