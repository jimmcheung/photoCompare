import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export interface FileToConvert {
  file: File;
  type: 'heif';
  status: 'pending' | 'converting' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface FormatConversionModalProps {
  isOpen: boolean;
  files: FileToConvert[];
  onClose: () => void;
  onConfirm: (outputFormat: 'image/jpeg' | 'image/png', quality: number) => void;
  onCancel: () => void;
  isConverting: boolean;
}

const FormatConversionModal: React.FC<FormatConversionModalProps> = ({
  isOpen,
  files,
  onClose,
  onConfirm,
  onCancel,
  isConverting
}) => {
  const { darkMode } = useSettingsStore();
  
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [quality, setQuality] = useState(0.85);
  
  if (!isOpen) return null;

  // 获取文件类型的中文描述
  const getFileTypeLabel = (type: 'heif') => {
    return 'HEIF/HEIC';
  };
  
  // 获取文件状态的中文描述和颜色
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '等待转换', color: darkMode ? 'text-gray-400' : 'text-gray-500' };
      case 'converting':
        return { label: '转换中', color: 'text-sky-500' };
      case 'success':
        return { label: '转换成功', color: 'text-green-500' };
      case 'error':
        return { label: '转换失败', color: 'text-red-500' };
      default:
        return { label: '未知状态', color: 'text-gray-500' };
    }
  };
  
  // 获取全局转换状态文字
  const getConversionStatusText = () => {
    if (!isConverting) return '';
    
    const total = files.length;
    const completed = files.filter(f => f.status === 'success' || f.status === 'error').length;
    const failed = files.filter(f => f.status === 'error').length;
    
    if (completed < total) {
      return `正在转换 (${completed}/${total})`;
    } else if (failed > 0) {
      return `转换完成，${failed} 个文件失败`;
    } else {
      return '转换成功';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-lg rounded-xl shadow-2xl 
          ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">HEIC/HEIF格式图片需要进行转换</h2>
          <p className="text-sm mb-4">
            HEIC/HEIF格式需要转换为JPG或PNG后才能正常显示，而且前端无法识别EXIF信息。你可以选择转换的格式和质量：
          </p>
          <div className="flex items-center gap-6 mb-4">
            <div>
              <label className="mr-2">输出格式：</label>
              <select
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value as 'image/jpeg' | 'image/png')}
                className={`border rounded px-2 py-1 ${darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white border-gray-300'}`}
              >
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>
            <div>
              <label className="mr-2">JPEG质量：</label>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.01}
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                disabled={outputFormat !== 'image/jpeg'}
                className="align-middle"
                style={{ width: 120 }}
              />
              <span className="ml-2 text-xs">{quality.toFixed(2)}</span>
            </div>
          </div>
          
          <div className={`mt-4 mb-6 rounded-lg overflow-hidden border 
            ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className={`text-xs ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <tr>
                    <th className="px-4 py-2 text-left">文件名</th>
                    <th className="px-4 py-2 text-left">格式</th>
                    <th className="px-4 py-2 text-right">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {files.map((file, index) => {
                    const statusInfo = getStatusInfo(file.status);
                    return (
                      <tr key={index} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 text-sm truncate max-w-[180px]">{file.file.name}</td>
                        <td className="px-4 py-3 text-sm">{getFileTypeLabel(file.type)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={statusInfo.color}>{statusInfo.label}</span>
                          {file.status === 'converting' && file.progress !== undefined && (
                            <div className="w-full mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-sky-500 h-1.5 rounded-full" 
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                          )}
                          {file.status === 'error' && file.error && (
                            <div className="text-xs text-red-500 mt-1">{file.error}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {isConverting && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">{getConversionStatusText()}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-sky-500 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${(files.filter(f => f.status === 'success' || f.status === 'error').length / files.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            {!isConverting && (
              <>
                <button
                  onClick={onCancel}
                  className={`px-4 py-2 rounded text-sm font-medium
                    ${darkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  取消
                </button>
                <button
                  onClick={() => onConfirm(outputFormat, quality)}
                  className="px-4 py-2 bg-sky-500 text-white rounded text-sm font-medium hover:bg-sky-600"
                >
                  开始转换
                </button>
              </>
            )}
            {isConverting && (
              <button
                onClick={onClose}
                disabled={files.some(f => f.status === 'converting')}
                className={`px-4 py-2 rounded text-sm font-medium
                  ${files.some(f => f.status === 'converting')
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-sky-500 text-white hover:bg-sky-600'}`}
              >
                {files.every(f => f.status === 'success' || f.status === 'error') ? '完成' : '关闭'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormatConversionModal; 