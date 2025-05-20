/**
 * 格式转换工具
 * 提供多种图像格式转换功能，包括HEIF和RAW格式转换
 */

import { convertHeic, isHeicFormat } from './heicHandler';

/**
 * 设置操作超时的辅助函数
 */
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * 新的通用转换函数，支持格式和质量
 */
export const convertHeif = async (
  file: File,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.85,
  progressCallback?: (progress: number) => void
): Promise<Blob | null> => {
  try {
    if (progressCallback) {
      progressCallback(10);
    }
    const blob = await convertHeic(file, outputFormat, quality, progressCallback);
    if (progressCallback) {
      progressCallback(100);
    }
    return blob;
  } catch (error) {
    console.error('HEIF转换失败:', error);
    return null;
  }
};

/**
 * 检查文件是否需要格式转换
 */
export const needsConversion = async (file: File): Promise<{
  needsConversion: boolean;
  type?: 'heif';
}> => {
  // 检查是否为HEIF/HEIC格式
  try {
    const isHeif = await isHeicFormat(file);
    if (isHeif) {
      return { needsConversion: true, type: 'heif' };
    }
  } catch (error) {
    console.warn('检查HEIF格式时出错:', error);
    // 如果检测出错，尝试使用文件扩展名进行简单判断
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
    return { needsConversion: true, type: 'heif' };
    }
  }
  
  // 不需要转换的普通格式
  return { needsConversion: false };
}; 