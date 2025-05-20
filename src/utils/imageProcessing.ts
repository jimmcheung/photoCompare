import exifr from 'exifr';
import { ImageInfo } from '../stores/imageStore';
import { isHeicFormat as checkHeicFormat, convertHeic } from './heicHandler';

/**
 * 检查文件是否是HEIC/HEIF格式
 */
const isHeicFormatByName = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.heic') || fileName.endsWith('.heif');
};

/**
 * 将HEIC/HEIF文件转换为JPEG
 */
const convertHeicToJpeg = async (file: File): Promise<Blob> => {
  try {
    return await convertHeic(file, 'image/jpeg', 0.8);
  } catch (error) {
    console.error('HEIC/HEIF转换失败:', error);
    throw new Error('HEIC/HEIF格式转换失败');
  }
};

/**
 * 处理图片文件，提取EXIF信息
 * 注意: 现在特殊格式如HEIF和RAW会在上传前通过格式转换器处理
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
      // 超时处理
      setTimeout(() => resolve({width: 0, height: 0}), 3000); 
    });
    
    // 尝试提取EXIF数据
    let exif: any = {};
    try {
      exif = await exifr.parse(file, {
      pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal'],
    }) || {};
    } catch (exifError) {
      console.warn('EXIF提取警告:', exifError);
    }
    
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
    throw error;
  }
}; 