import exifr from 'exifr';
import { ImageInfo } from '../stores/imageStore';

/**
 * 处理图片文件，提取EXIF信息
 */
export const processImageFile = async (file: File): Promise<ImageInfo> => {
  try {
    // 创建图像URL
    const url = URL.createObjectURL(file);
    
    // 获取图像尺寸
    const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => {
        resolve({width: 0, height: 0});
      };
      img.src = url;
      setTimeout(() => resolve({width: 0, height: 0}), 3000); // 超时处理
    });
    
    // 提取EXIF数据
    const exif = await exifr.parse(file, {
      pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal'],
    }) || {};
    
    // 构建图像信息对象
    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`,
      file,
      url,
      name: file.name,
      exif: {
        FileName: file.name,
        Resolution: `${dimensions.width} × ${dimensions.height}`,
        Make: exif?.Make || 'Unknown',
        Model: exif?.Model || 'Unknown',
        LensModel: exif?.LensModel || 'Unknown',
        FocalLength: exif?.FocalLength || 0,
        FNumber: exif?.FNumber || 0,
        ExposureTime: exif?.ExposureTime?.toString() || '0',
        ISO: exif?.ISO || 0,
        DateTimeOriginal: exif?.DateTimeOriginal || 'Unknown',
      }
    };
  } catch (error) {
    console.error('图像处理失败:', error);
    
    // 创建一个简单的错误对象
    return {
      id: `error-${Date.now()}-${file.name}`,
      file,
      url: '',
      name: file.name,
      exif: {
        FileName: file.name,
        Resolution: '0 × 0',
        Make: 'Error',
        Model: 'Error',
        LensModel: 'Error',
        FocalLength: 0,
        FNumber: 0,
        ExposureTime: '0',
        ISO: 0,
        DateTimeOriginal: new Date().toISOString(),
      }
    };
  }
}; 