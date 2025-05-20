// 为避免 npm 报告 API 问题，设置环境变量
if (process.env.NODE_ENV === 'development') {
  // 由于我们无法直接设置 process.env.UV_USE_IO_URING，可以检查 window._env_
  if (!(window as any)._env_) {
    (window as any)._env_ = {};
  }
  (window as any)._env_.UV_USE_IO_URING = '0';
}

// 导入React和ReactDOM
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// 创建根元素并渲染App
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 