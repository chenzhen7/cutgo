// 导入 Electron 的 app 和 BrowserWindow 模块
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 判断是否为开发环境（非 production 或被 electron . 启动）
const isDev = process.env.NODE_ENV !== 'production' || process.defaultApp;

// 开发环境的前端网址，Next.js 默认端口
const DEV_URL = 'http://localhost:4000';
const PROD_URL = 'http://localhost:38888';

// 创建主窗口的函数
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,           // 默认宽度
    height: 800,           // 默认高度
    minWidth: 800,         // 最小宽度
    minHeight: 600,        // 最小高度
    webPreferences: {
      nodeIntegration: false,   // 禁用 Node 集成，提升安全
      contextIsolation: true,   // 启用上下文隔离
    },
    show: false,           // 先隐藏窗口，加载完再显示，避免白屏
    title: 'CutGo - 秒剧', // 窗口标题
  });

  // url 根据环境可以区分 dev/prod，现暂时都用 DEV_URL
  const url = isDev ? DEV_URL : PROD_URL;
  win.loadURL(url);        // 加载地址

  // 当窗口内容准备好后再显示窗口
  win.once('ready-to-show', () => win.show());

  // 开发环境下自动打开开发者工具
  if (isDev) win.webContents.openDevTools();
}

// Electron 初始化完成后调用 createWindow
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用，Mac 下除外（遵循平台惯例）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 在 Mac 下点击 dock 图标时，没有窗口则新建一个窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
