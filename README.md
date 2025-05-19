# PhotoCompare - 照片对比工具

一个用于对比多张照片细节的 Web 应用，支持图片同步缩放、平移、EXIF 信息显示等功能。

**在线体验：** [https://jimmcheung.github.io/photoCompare/](https://jimmcheung.github.io/photoCompare/)

## 功能特点

- 🖼️ 支持同时上传2-5张照片进行对比
- 🔄 同步缩放和平移操作
- 📊 显示照片 EXIF 信息（相机型号、镜头、参数等）
- 🌓 深色/浅色主题切换
- 🎯 演示模式（全屏展示）
- 📱 响应式设计，支持各种设备
- 🚀 图片懒加载，优化性能
- 💾 本地存储用户偏好设置
- ✏️ 标注功能（支持矩形、圆形、画笔、文字等标注）

## 技术栈

- React 18
- TypeScript
- Tailwind CSS
- Zustand (状态管理)
- React Zoom Pan Pinch (图片缩放)
- Exifr (EXIF 信息提取)
- Vite (构建工具)

## 开发环境设置

1. 克隆项目：
```bash
git clone https://github.com/jimmcheung/photoCompare.git
cd photoCompare
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 构建生产版本：
```bash
npm run build
```

## 使用说明

1. 打开应用后，可以通过拖放或点击选择按钮上传2-5张照片
2. 上传完成后，照片会并排显示
3. 在任一照片上进行缩放或平移操作，其他照片会同步显示相同位置（可在设置中关闭）
4. 可以通过左上角的设置面板：
   - 切换深色/浅色主题
   - 开启/关闭同步缩放
   - 选择显示的 EXIF 信息
   - 开启演示模式
5. 在演示模式下，界面上的按钮会隐藏，按 ESC 键可退出演示模式
6. 使用标注工具栏进行图片标注：
   - 支持矩形、圆形、自由画笔、文字标注
   - 可调整线宽和颜色
   - 标注可编辑、删除、同步

## 版本管理

当前版本：v1.1.0

版本号说明：
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

更新版本号：
1. 修改 `package.json` 中的版本号
2. 运行 `npm run version` 更新页面显示

## 更新日志

### v1.1.0 (2024-05-19)
- 升级版本号至1.1.0，常规版本号升级
- 同步更新 package.json、package-lock.json 等相关文件
- 更新项目文档和说明

### v1.0.3 (2024-05-19)
- 修复图片重新上传和添加时EXIF信息不显示的问题
- 统一图片处理逻辑
- ImageInfo类型结构优化，file字段全局一致
- 修正关于弹窗中的GitHub仓库链接

### v1.0.2 (2024-05-18)
- 修复图片重新上传和添加时EXIF信息不显示的问题
- 统一图片处理逻辑
- ImageInfo类型结构优化，file字段全局一致
- 修正关于弹窗中的GitHub仓库链接为正确地址

### v1.0.1 (2024-05-17)
- 更新演示模式按钮图标，使用更现代化的全屏SVG图标
- 整体代码优化，移除冗余代码
- 更新文档和说明

### v1.0.0 (2024-05-17)
- 初始版本发布
- 支持照片对比功能
- 支持 EXIF 信息显示
- 支持深色模式
- 支持演示模式
- 响应式设计，适配多种设备

## 部署

### GitHub Pages
1. 在 GitHub 创建仓库
2. 推送代码到仓库
3. 在仓库设置中启用 GitHub Pages

当前部署地址：[https://jimmcheung.github.io/photoCompare/](https://jimmcheung.github.io/photoCompare/)

### Vercel
1. 注册 Vercel 账号
2. 导入 GitHub 仓库
3. 自动部署

### 自建服务器
1. 构建项目：`npm run build`
2. 将 `dist` 目录下的文件部署到服务器
3. 配置 Nginx 或其他 Web 服务器

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 作者

- Jim
- B站：[@Jim超爱玩](https://space.bilibili.com/13818699)
