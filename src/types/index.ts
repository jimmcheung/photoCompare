export interface ImageInfo {
  id: string;
  file: File;
  url: string;
  exif: ExifData;
}

export interface ExifData {
  Make?: string;
  Model?: string;
  ISO?: number;
  FNumber?: number;
  ExposureTime?: string;
  FocalLength?: number;
  LensModel?: string;
  DateTimeOriginal?: string;
  FileName: string;
}

export interface DrawingOptions {
  type: 'line' | 'arrow' | 'rectangle' | 'circle';
  color: string;
  width: number;
}

export interface Settings {
  darkMode: boolean;
  syncZoom: boolean;
  syncDraw: boolean;
  presentationMode: boolean;
  visibleExifFields: string[];
} 