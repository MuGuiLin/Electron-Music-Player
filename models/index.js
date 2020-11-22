const { ipcRenderer } = require('electron');

// import { $getDom } from './base';
const $ = require('../public/js/jquery.min.3.4.0.js');

const { $getDom, $getAll, $countTime } = require('./base');

//音乐数据
let musicArr = [];

//播放索引
let nowNum = localStorage.getItem('NOTNUMBER') || 0;

//当前播放项
let nowPlay = {};

let timer = null;

//音频对象
const oAudio = new Audio();

const sumTime = (path) => {
    oAudio.src = path;
    return $countTime(oAudio.duration || 0);
};

const musicPlay = () => {
    console.log(nowNum);
    nowNum = nowNum > musicArr.length - 1 ? musicArr.length - 1 : nowNum;
    oAudio.src = musicArr[nowNum].path;
    oAudio.play();
    $('#container').scrollTop($('#music-list-box li').eq(0).outerHeight(true) *  nowNum);
};

const autoPlay = () => {
    if (0 < musicArr.length) {
        musicPlay();
    };
};

const saveNowNum = () => {
    localStorage.setItem('NOTNUMBER', nowNum);
}

const getStyle = (ele, attr) => {
    if (window.getComputedStyle) {
        return window.getComputedStyle(ele, null)[attr];
    } else {
        return ele.currentStyle[attr];
    };
};

const loopPlay = () => {
    oAudio.loop = !oAudio.loop;
    if (oAudio.loop) {
        $getDom('#loop-play-btn').classList.replace('glyphicon-random', 'glyphicon-retweet');
    } else {
        $getDom('#loop-play-btn').classList.replace('glyphicon-retweet', 'glyphicon-random');
    };
};

const downLoad = (name, href) => {
    name = 0 < name.search('.mp3') ? name : name + '.mp3';

    // js下载方法
    // var a = document.createElement("a"),
    // e = document.createEvent("MouseEvents");
    // e.initEvent("click", false, false);
    // a.href = href;
    // a.download = name;
    // a.title = name;
    // a.alt = name;
    // a.dispatchEvent(e);
    // a.remove();

    // electron下载方法
    ipcRenderer.send('music-download', { name: name, path: href });
    // ipcRenderer.send('down-load-music', { status: 1, path: musicArr[nowNum] });
};

const listDomArr = (o) => {
    return [...$getAll('#music-list-box li')];
};

const render = (arr) => {
    $getDom('#music-list-box').innerHTML = arr.map((o, i) => {
        return `<li class="" data-id="${o.id}">
                <div class="music-item-now"><label>${i + 1}</label></div>
                <div class="music-item-img"><img src="${o.imgs}" /></div>
                <div class="music-item-box">
                    <div class="music-item-box-top">
                        <div class="music-item-name"><i class="glyphicon glyphicon-music"></i>${o.name}</div>
                        <div class="music-item-btn">
                            <button class="btn btn-xs glyphicon glyphicon-play" title="播放" data-id="${o.id}"></button>
                            <button class="btn btn-xs glyphicon glyphicon-heart-empty" title="收藏" data-id="${o.id}"></button>
                            <button class="btn btn-xs glyphicon glyphicon-trash" title="删除" data-id="${o.id}"></button>
                            <button class="btn btn-xs glyphicon glyphicon-download-alt" title="下载" data-id="${o.id}" data-name="${o.name}" data-path="${o.path}" ></button>
                        </div>
                        <div class="music-item-time music-item-sum-time"><time>${o.time || '00:00'}</time></div>
                    </div>
                    <div class="music-item-box-bot">
                        <div class="music-item-time music-item-play-time"><time>00:00</time> / <time>${o.time || '00:00'}</time></div>
                    </div>
                </div>
            </li>`;
    }).join('');

    $getAll('#music-list-box li').forEach((item, index) => {
        item.addEventListener('dblclick', function (event) {
            event.preventDefault();
            const id = this.getAttribute('data-id');

            //播放
            if (id) {
                //如果当前被点击项已经在播放了，就继续播放
                if (nowPlay && nowPlay.id == id) {
                    oAudio.play();
                }
                //否则就是点击了新的播放项
                else {
                    //找到当前被点击项的id提取播放地址 赋给 当前播放项
                    nowPlay = musicArr.find((o, i) => {
                        if (o.id == id) {
                            nowNum = i;
                            saveNowNum();
                            return true;
                        };
                    });
                    musicPlay();

                    //当在播放新的项时，把之前暂停的图标替换为播放图标
                    const pause = $getDom('#music-list-box').querySelector('.glyphicon-pause');
                    if (pause) {
                        pause.classList.replace('glyphicon-pause', 'glyphicon-play');
                    };
                };
            };
        });
    });
};

const playRender = (time) => {
    $getDom('#play-info-box').innerHTML = `<marquee width="100" id="now-music-name" scrollamount="2" direction="left" align="middle">正在播放：${musicArr[nowNum].name}</marquee><time><span id="play-seeker">00:00</span> / ${time}</time>`
};

const nextPlay = () => {
    nowNum = (nowNum == musicArr.length - 1) ? 0 : Number(nowNum) + 1;
    saveNowNum();
    musicPlay();
};

//初始化音乐列表
ipcRenderer.on('init-main-win', (event, res) => {
    if (0 < res.data.length) {
        render(res.data);
        musicArr = res.data;
        if (res.now) nowNum = res.now;
        oAudio.volume = .5;
        autoPlay();
    } else {
        $getDom('#music-list-box').innerHTML = `<li><i class="glyphicon glyphicon-headphones"> 您的播放列表，空空如也！</i></li>`;
    };
});

//监听下载状态 -> main process里发出的message
ipcRenderer.on('down-load-state', (event, { state, path }) => {
    if (state == 'completed') {
        alert('OK 下载成功！');
    } else {
        alert(`NO 下载失败: ${state}`);
    }
});

//下载网络音乐
$getDom('#down-load-btn').addEventListener('click', () => {
    ipcRenderer.send('down-load-music', { status: 1, path: musicArr[nowNum] });
}, false);

//下载网络音乐
$getDom('#down-play-btn').addEventListener('click', () => {
    // ipcRenderer.send('down-load-music', { status: 1, path: musicArr[nowNum]});

    downLoad(musicArr[nowNum].name, musicArr[nowNum].path);
}, false);

//添加本地音乐
$getDom('#add-local-btn').addEventListener('click', () => {
    ipcRenderer.send('add-local-music', { status: 1 });
}, false);

//在线搜索音乐
$getDom('#add-lines-btn').addEventListener('click', () => {
    ipcRenderer.send('add-lines-music', { status: 1 });
}, false);

//相关播放，暂停，收藏，删除操作
$getDom('#music-list-box').addEventListener('click', (event) => {
    event.preventDefault();
    const { dataset, classList } = event.target;
    const id = dataset && dataset.id;

    //播放
    if (id && classList.contains('glyphicon-play')) {

        //如果当前被点击项已经在播放了，就继续播放
        if (nowPlay && nowPlay.id == id) {
            try {
                oAudio.play();
            } catch (error) {
                console.log('播放失败');
            };
        }
        //否则就是点击了新的播放项
        else {
            //找到当前被点击项的id提取播放地址 赋给 当前播放项
            nowPlay = musicArr.find((o, i) => {
                if (o.id == id) {
                    nowNum = i;
                    saveNowNum();
                    return true;
                };
            });

            musicPlay();

            //当在播放新的项时，把之前暂停的图标替换为播放图标
            const pause = $getDom('#music-list-box').querySelector('.glyphicon-pause');
            if (pause) {
                pause.classList.replace('glyphicon-pause', 'glyphicon-play');
            };
        }
        //把播放图标替换为 暂停图标
        classList.replace('glyphicon-play', 'glyphicon-pause');
    }
    //暂停
    else if (id && classList.contains('glyphicon-pause')) {
        oAudio.pause();
        classList.replace('glyphicon-pause', 'glyphicon-play');
    }
    //收藏
    else if (id && classList.contains('glyphicon-heart')) {

    }
    //删除
    else if (id && classList.contains('glyphicon-trash')) {
        ipcRenderer.send('remove-music-item', id);
    }
    //下载
    else if (id && classList.contains('glyphicon-download-alt')) {
        dataset.path && downLoad(dataset.name, dataset.path);
    };
});

//当音频加载完成时
oAudio.addEventListener('loadedmetadata', (event) => {
    const $nowDom = $getAll('#music-list-box li')[nowNum];
    playRender($countTime(oAudio.duration || 0));
    $nowDom.classList.remove('error');
    $nowDom.querySelector('img')['style']['animation-play-state'] = 'running';
    if ($nowDom.querySelector('.glyphicon-play')) $nowDom.querySelector('.glyphicon-play').classList.replace('glyphicon-play', 'glyphicon-pause');
    if ('00:00' == musicArr[nowNum].time) {
        ipcRenderer.send('uptime-music-item', { id: $nowDom.getAttribute('data-id'), time: $countTime(oAudio.duration || 0) });
    };
});

//当音频加失败成时
oAudio.addEventListener('error', (event, error) => {
    listDomArr()[nowNum].classList.add('error');
    clearTimeout(timer);
    timer = setTimeout(() => {
        nextPlay();
    }, 5000);
});

//当前音频播放时
oAudio.addEventListener('play', (event) => {
    clearTimeout(timer);
    const $nowDom = $getAll('#music-list-box li')[nowNum];
    $getDom('#play-paus-btn').classList.replace('glyphicon-play', 'glyphicon-pause');
    $getAll('#music-list-box li').forEach((item, index) => {
        item.classList.remove('music-list-active');
    });
    $nowDom.classList.add('music-list-active');
});

//当前音频播放进度
oAudio.addEventListener('timeupdate', (event) => {
    const $nowDom = $getAll('#music-list-box li')[nowNum];
    $getDom('#play-seeker').innerHTML = $countTime(oAudio.currentTime);
    $getDom('#progress-bar')['style']['width'] = oAudio.currentTime / oAudio.duration * 100 + '%';
    $nowDom.querySelector('.music-item-play-time').innerHTML = `<time>${$countTime(oAudio.currentTime)}</time> / <time>${$countTime(oAudio.duration || 0)}</time>`
});

//当前音频暂停时
oAudio.addEventListener('pause', (event) => {
    $getDom('#play-paus-btn').classList.replace('glyphicon-pause', 'glyphicon-play');
    $getAll('#music-list-box li')[nowNum].querySelector('img')['style']['animation-play-state'] = 'paused';
});

//当前音频播放完成时
oAudio.addEventListener('ended', (event) => {
    $getDom('#progress-bar')['style']['width'] = 0;
    if (oAudio.loop) {
        musicPlay();
    } else {
        nowNum = (nowNum == musicArr.length - 1) ? 0 : 1 + nowNum;
        saveNowNum();
        musicPlay();
    };
});

//慢速播放
$getDom('#fast-prev-btn').addEventListener('click', function () {
    oAudio.defaultPlaybackRate = oAudio.defaultPlaybackRate - 0.1;
    const currentTime = oAudio.currentTime;
    oAudio.load();  //注：设置后要重新加载一下视频对象 
    oAudio.currentTime = currentTime;
    oAudio.play(); //播放
}, false);

//上一曲
$getDom('#prev-song-btn').addEventListener('click', function () {
    nowNum = (nowNum == 0) ? 0 : Number(nowNum) - 1;
    saveNowNum();
    musicPlay();
}, false);

//播放/暂停
$getDom('#play-paus-btn').addEventListener('click', function () {
    oAudio.paused ? oAudio.play() : oAudio.pause();
}, false);

//正常播放
$getDom('#rest-play-btn').addEventListener('click', function () {
    oAudio.defaultPlaybackRate = 1;
    const currentTime = oAudio.currentTime;
    oAudio.load();  //注：设置后要重新加载一下视频对象 
    oAudio.currentTime = currentTime;
    oAudio.play(); //播放
}, false);

//停止播放
$getDom('#stop-play-btn').addEventListener('click', function () {
    oAudio.pause();
    oAudio.currentTime = 0;
}, false);

//下一曲
$getDom('#next-song-btn').addEventListener('click', function () {
    nextPlay();
}, false);

//快速播放
$getDom('#fast-next-btn').addEventListener('click', function () {
    oAudio.defaultPlaybackRate = oAudio.defaultPlaybackRate + 0.1;
    const currentTime = oAudio.currentTime;
    oAudio.load();  //注：设置后要重新加载一下视频对象
    oAudio.currentTime = currentTime;
    oAudio.play(); //播放
}, false);

//单曲循环
$getDom('#loop-play-btn').addEventListener('click', function () {
    loopPlay();
}, false);

//音量大小
$getDom('#volu-size-btn').addEventListener('click', function () {

}, false);

$getDom('#progress-box').addEventListener('mousedown', function (e) {
    e = e || window.event;

    let positions = e.pageX - $getDom('#progress-bar').offsetLeft;
    let percentage = 100 * positions / parseInt(getStyle(this, 'width'));

    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;

    $getDom('#progress-bar')['style']['width'] = percentage + '%';

    oAudio.currentTime = (oAudio.duration * percentage) / 100;
    oAudio.play();
});

$getDom('#volume-box').addEventListener('mousedown', function (e) {
    e = e || window.event;
    let getofx = e.offsetY;

    $getDom('#volume-bar')['style']['height'] = (-getofx + 180) + 'px';
    oAudio.volume = (-getofx + 180) / 180;
}, false);