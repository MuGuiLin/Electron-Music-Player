//引入app, BrowserWindow, ipcMain模块
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const Store = require('./models/store');

//指定本地存储文件名
const store = new Store({ name: 'Music/json' });

let downLoadPath = {};

// 下载文件存放位置
let saveLoadPath = "C:\\Users\\MuGuiLin\\Desktop\\";
// 下载文件名称设置
let saveLoadName = "";

app.setApplicationMenu(); //隐藏菜单栏


//当electron加载完成时，注：有些API只能在ready以后才能调用
app.on('ready', (a, b) => {
  //console.log('electron已加载完成了!', a, b);

  //封装继承BrowserWindow类，用于建立窗口
  class AddWin extends BrowserWindow {
    constructor(config, loadFile) {
      const baseConfig = {
        width: 400,
        height: 858,
        x: 600,
        y: 100,
        webPreferences: {
          nodeIntegration: true  //在mainWin中是否可以使用Node.js中的API
        },
        frame: true, //添加后自定义标题 自定义边框
        resizable: false, //可否缩放
        movable: true, //可否移动
        parent: {}, //指定父窗口，(当父窗口关闭时，子窗口也会被关闭)
        icon: './static/icon.ico',
        backgroundColor: '#0091f2',
        autoHideMenuBar: false, //布尔（可选） - 除非Alt按下键，否则自动隐藏菜单栏。默认是false。
      };

      // const newConfig = Object.assign(baseConfig, config);  对象合并，推荐用下面ES6新增的合并对象方法
      const newConfig = { ...baseConfig, ...config };

      //向父类传递配置参数
      super(newConfig);

      //注：由于当前继承了BrowserWindow这个父类，所以这里的this就会指向BrowserWindow本身

      //加载窗口页面
      this.loadFile(loadFile);

      //当页面还没加载完成时，提高用户体验
      this.once('ready-to-show', () => {
        this.show();
      });
    };

  };

  //创建主窗口
  const mainWin = new AddWin({}, './views/index.html');

  // 打开开发工具页面
  // mainWin.webContents.openDevTools();


  // 主窗口初始化完成时
  mainWin.webContents.on('did-finish-load', (event) => {
    //将之前存储的数据传到主窗口渲染出来
    const musicList = store.getList();

    //查看本地数据存储路径
    console.log('数据存储路径：', app.getPath('userData'));

    //渲染音乐列表
    mainWin.send('init-main-win', { status: 1, data: musicList });

  });


  // 主窗口下载进程监听
  mainWin.webContents.session.on('will-download', (event, item, webContents) => {
    // console.log('----------------', webContents);

    //注：没有设置保存路径，Electron将使用默认方式来确定保存路径（通常会提示保存对话框）
    item.setSavePath("");

    // item.setSavePath((saveLoadPath + saveLoadName) || item.getFilename());

    // 下载进度
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {

        console.log('下载被中断，但可以恢复！');
      } else if (state === 'progressing') {
        if (item.isPaused()) {

          console.log('下载已暂停!');
        } else {

          console.log(`接收字节: ${item.getReceivedBytes()}`)
        }
      }
    });

    // 下载结果
    item.once('done', (event, state) => {
      if (state == 'completed') {
        console.log('OK 下载成功！');

      } else {
        console.log(`NO 下载失败: ${state}`);
      }
      //回显 调用渲染进程方法
      mainWin.webContents.send('down-load-state', { state: state, path: saveLoadPath });
    })

  });


  /**
   * ipcMain 监听web page里发出的message
   * 
   */

  //监听渲染进程传来的数据 
  ipcMain.on('down-load-music', (event, msg) => {
    if (msg.status) {
      downLoadPath = msg;
      //创建下载网络音乐子窗口
      const localWin = new AddWin({
        width: 500,
        height: 858,
        x: 1000,
        y: 100,
        parent: mainWin
      }, './views/downLoad.html');
    }
  });

  //返加下载音乐路径
  ipcMain.on('get-music-down-path', event => {
    event.sender.send('set-music-down-path', downLoadPath);
  });

  //监听渲染进程传来的数据
  ipcMain.on('add-local-music', (event, msg) => {
    // console.log(event, msg);

    if (msg.status) {
      //向渲染进程回传数据
      //注：event.sender === mainWin
      // event.sender.send('muguilin', {
      // mainWin.send('muguilin', {
      //   text: 'OK，我已经收到mupiao发送过来的数据了!',
      //   back: msg
      // });

      //创建添加本地音乐子窗口
      const localWin = new AddWin({
        width: 500,
        height: 858,
        x: 1000,
        y: 100,
        parent: mainWin
      }, './views/local.html');
    }
  });

  //在线搜索音乐
  ipcMain.on('add-lines-music', (event, msg) => {
    new AddWin({
      width: 760,
      height: 858,
      x: 1000,
      y: 100,
      parent: mainWin
    }, './views/online.html');
  });

  //选择添加音频文件
  ipcMain.on('select-local-music', (event, msg) => {
    dialog.showOpenDialog({
      //选择文件，可多选文件
      properties: ['openFile', 'multiSelections'],

      //可选文件格式
      filters: [{ name: 'Music', extensions: ['mp3', 'wav', 'ogg'] }]
    }, (files) => {
      if (files) {
        event.sender.send('select-files', { status: 1, path: files });
      } else {
        event.sender.send('select-files', { status: 0, path: [] });
      };
    });
  });

  // 音乐下载
  ipcMain.on('music-download', (event, args) => {
    // 设置下载文件名
    saveLoadName = args.name;
    // 触发will-download事件
    args.path && mainWin.webContents.downloadURL(args.path);
  });

  //存储已选择的本地音频文件，并重新渲染音乐列表
  ipcMain.on('import-local-music', (event, msg) => {
    const listArr = store.addList(msg.data).getList();
    mainWin.send('init-main-win', { status: 1, data: listArr, now: listArr.length });
  });

  //存储已选择的在线音频文件，并重新渲染音乐列表
  ipcMain.on('import-online-music', (event, msg) => {
    const listArr = store.addList(msg.data).getList();
    mainWin.send('init-main-win', { status: 1, data: listArr, now: listArr.length });
  });

  //删除音乐列表项，并重新渲染音乐列表
  ipcMain.on('remove-music-item', (event, id) => {
    const listArr = store.delList(id).getList();
    mainWin.send('init-main-win', { status: 1, data: listArr });
  });

  //删除音乐列表项，并重新渲染音乐列表
  ipcMain.on('uptime-music-item', (event, msg) => {
    store.upTime(msg.id, msg.time);
    // mainWin.send('init-main-win', { status: 1, data: listArr });
  });
});


// 当所有的窗口被关闭后退出应用
app.on('window-all-closed', () => {
  // 对于OS X系统，应用和相应的菜单栏会一直激活直到用户通过Cmd + Q显式退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 对于OS X系统，当dock图标被点击后会重新创建一个app窗口，并且不会有其他
  // 窗口打开
  if (win === null) {

  }
});

