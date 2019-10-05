const { ipcRenderer } = require('electron');
const path = require('path');
const { $getDom, $on } = require('./base');

let listArr = [];

const render = (arr) => {
    $getDom('#tbody').innerHTML = arr.map((o, i) => {
        return `<tr><td>${i + 1}</td><td>${path.basename(o)}</td></tr>`;
    }).join('');
    window.scroll(0, document.body.scrollHeight);
};

ipcRenderer.on('select-files', (event, res) => {
    if (1 === res.status && Array.isArray(res.path)) {
        if (0 < res.path.length) {
            listArr.length = 0;
            res.path.forEach((o, i) => {
                listArr.push({
                    path: o,
                    name: path.basename(o)
                });
            });
            render(res.path);
        };
    } else {
        render(['文件读取失败']);
    };
});

//选择本地音乐
$on($getDom('#select-music-btn'), 'click', () => {
    ipcRenderer.send('select-local-music', { status: true });
});

//导入到音乐库
$getDom('#import-music-btn').addEventListener('click', () => {
    if (0 < listArr.length) {
        ipcRenderer.send('import-local-music', { status: true, data: listArr });
    } else {
        alert('请先选择音频文件！');
    };
});