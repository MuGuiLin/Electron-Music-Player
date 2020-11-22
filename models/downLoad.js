const { ipcRenderer } = require('electron');
const { $getDom, $on } = require('./base');

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('get-music-down-path');

    ipcRenderer.on('set-music-down-path', (event, res) => {
        if (1 === res.status && res.path) {
            $getDom('#audio').src = res.path.path
            $getDom("#tbody").innerHTML = `<tr><td colspan="2"><p>温馨提示：请选择从网络搜索的音乐进行下载！</p><p>温馨提示：下载按扭在播放器最右侧，本地音乐没有的！</p></td></tr><tr><td><img src="${res.path.imgs}" alt="歌手"/></td><td>${res.path.name}</td></tr><tr><td colspan="2"><p>${res.path.path}</p></td></tr>`;
        } else {
            render(['请先播放列表，播放一下要下载的音乐！']);
        };
    });
})
