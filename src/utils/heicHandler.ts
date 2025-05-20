/**
 * HEIC/HEIF格式处理工具
 * 提供更可靠的HEIC/HEIF转换功能
 */

import { isHeic, heicTo } from 'heic-to';

/**
 * 检查文件是否是HEIC/HEIF格式
 * @param file 要检查的文件
 * @returns Promise<boolean> 是否为HEIC/HEIF格式
 */
export const isHeicFormat = async (file: File): Promise<boolean> => {
  try {
    return await isHeic(file);
  } catch (err) {
    console.warn('检查HEIC格式时出错:', err);
    
    // 如果检测函数失败，回退到扩展名检查
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.heic') || fileName.endsWith('.heif');
  }
};

/**
 * 将HEIC/HEIF格式转换为JPEG
 * @param file HEIC/HEIF文件
 * @param quality JPEG质量，0-1之间
 * @param progressCallback 进度回调函数
 * @returns Promise<Blob> 转换后的JPEG Blob对象
 */
export const convertHeicToJpeg = async (
  file: File,
  quality: number = 0.85,
  progressCallback?: (progress: number) => void
): Promise<Blob> => {
  if (typeof progressCallback === 'function') {
    progressCallback(10);
  }
  
  try {
    console.log('开始转换HEIC格式:', file.name);
    
    // 使用heic-to库进行转换
    const result = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: quality
    });
    
    if (typeof progressCallback === 'function') {
      progressCallback(100);
    }
    
    console.log('HEIC转换成功:', file.name);
    
    // 确保转换结果是Blob对象
    const blob = result instanceof Blob ? result : new Blob([result], { type: 'image/jpeg' });
    return blob;
  } catch (error) {
    console.error('HEIC转JPEG失败:', error);
    
    if (typeof progressCallback === 'function') {
      progressCallback(50); // 更新进度，表示正在尝试备选方案
    }
    
    // 尝试使用备用方法转换
    try {
      console.log('使用备用方法转换HEIC:', file.name);
      
      // 使用Canvas作为备用转换方法
      return await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('无法创建Canvas上下文'));
              return;
            }
            ctx.drawImage(img, 0, 0);
            if (typeof progressCallback === 'function') {
              progressCallback(90);
            }
            canvas.toBlob((blob) => {
              if (blob) {
                if (typeof progressCallback === 'function') {
                  progressCallback(100);
                }
                resolve(blob);
              } else {
                reject(new Error('Canvas转换失败'));
              }
            }, 'image/jpeg', quality);
          };
          img.onerror = () => {
            reject(new Error('图像加载失败'));
          };
          img.src = URL.createObjectURL(file);
        };
        reader.onerror = () => {
          reject(new Error('文件读取失败'));
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (backupError) {
      console.error('备用转换方法也失败:', backupError);
      
      throw new Error('无法转换HEIC格式图像，请尝试转换为JPEG后再上传');
    }
  }
};

/**
 * 将HEIC/HEIF格式转换为PNG
 * @param file HEIC/HEIF文件
 * @param progressCallback 进度回调函数
 * @returns Promise<Blob> 转换后的PNG Blob对象
 */
export const convertHeicToPng = async (
  file: File,
  progressCallback?: (progress: number) => void
): Promise<Blob> => {
  if (typeof progressCallback === 'function') {
    progressCallback(10);
  }
  
  try {
    console.log('开始转换HEIC格式为PNG:', file.name);
    
    // 使用heic-to库进行转换
    const result = await heicTo({
      blob: file,
      type: 'image/png',
      quality: 1.0 // PNG格式不需要质量参数，但API可能要求提供
    });
    
    if (typeof progressCallback === 'function') {
      progressCallback(100);
    }
    
    console.log('HEIC转PNG成功:', file.name);
    
    // 确保转换结果是Blob对象
    const blob = result instanceof Blob ? result : new Blob([result], { type: 'image/png' });
    return blob;
  } catch (error) {
    console.error('HEIC转PNG失败:', error);
    
    if (typeof progressCallback === 'function') {
      progressCallback(50); // 更新进度，表示正在尝试备选方案
    }
    
    // 尝试使用备用方法转换
    try {
      console.log('使用备用方法转换HEIC为PNG:', file.name);
      
      // 使用Canvas作为备用转换方法
      return await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('无法创建Canvas上下文'));
              return;
            }
            ctx.drawImage(img, 0, 0);
            if (typeof progressCallback === 'function') {
              progressCallback(90);
            }
            canvas.toBlob((blob) => {
              if (blob) {
                if (typeof progressCallback === 'function') {
                  progressCallback(100);
                }
                resolve(blob);
              } else {
                reject(new Error('Canvas转换失败'));
              }
            }, 'image/png');
          };
          img.onerror = () => {
            reject(new Error('图像加载失败'));
          };
          img.src = URL.createObjectURL(file);
        };
        reader.onerror = () => {
          reject(new Error('文件读取失败'));
        };
        reader.readAsArrayBuffer(file);
      });
    } catch (backupError) {
      console.error('备用转换方法也失败:', backupError);
      throw new Error('无法转换HEIC格式图像，请尝试转换为JPEG后再上传');
    }
  }
};

/**
 * 通用的HEIC转换函数，支持多种输出格式
 * @param file HEIC/HEIF文件
 * @param outputType 输出格式，'image/jpeg'或'image/png'
 * @param quality 质量参数，JPEG格式有效
 * @param progressCallback 进度回调函数
 * @returns Promise<Blob> 转换后的Blob对象
 */
export const convertHeic = async (
  file: File,
  outputType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.85,
  progressCallback?: (progress: number) => void
): Promise<Blob> => {
  try {
    if (outputType === 'image/png') {
      return convertHeicToPng(file, progressCallback);
    } else {
      return convertHeicToJpeg(file, quality, progressCallback);
    }
  } catch (error) {
    console.error('HEIC转换失败:', error);
    if (typeof progressCallback === 'function') {
      progressCallback(100);
    }
    throw error;
  }
}; 