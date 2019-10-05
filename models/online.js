const { ipcRenderer } = require('electron');
const $ = require('../public/js/jquery.min.3.4.0.js');
const { $getDom, $getAll, $countTime } = require('./base');

const oAudio = new Audio();

let now = 0;
let listArr = [];
let musicArr = [];

const render = (data) => {
    let dom = '', color = ['#78cc64', '#58cd7e', '#4fcdad', '#4cc7dd', '#469ee8', '#465de8', '#5846e8', '#8346e8', '#9e46e8'];
    $.each(data, function (key, item) {
        let sign_name = '';
        if (item.singer && item.singer[0] && item.singer[0].name) {
            sign_name = item.singer[0].name;
        };
        if (item.albumid) {
            dom += `<tr style="background:${color[key % color.length]}"><td><input type="checkbox" name="check"></td><td>${item.songname}</td><td>${sign_name}</td><td>${item.albumname}</td><td><button data-id="${item.songmid}" class="btn btn-success btn-xs glyphicon glyphicon-play"></button></td></tr>`;
        };
    });
    $("#tbody").html(dom);
    const oCheck = [...$getAll('input', $getDom('#tbody'))];
    oCheck.forEach((item, index) => {
        item['onclick'] = () => {
            //至少选择一项
            let check = oCheck.some((o, i, a) => o.checked);
            $getDom('#import-music-btn').disabled = check ? false : true;

            //全部选中时
            let allCheck = oCheck.every((o, i, a) => o.checked);
            $getDom('#allCheck').checked = allCheck ? true : false;
        }
    });

    //全选
    $getDom('#allCheck').addEventListener('click', function () {
        oCheck.forEach((item, index) => {
            item.checked = this.checked;
            $getDom('#import-music-btn').disabled = this.checked ? false : true;
        });
    });
};

const getAvatar = (o, f) => {
    var o = o.f ? o.f.split("|")[22] : o;
    o = "/" + o.slice(o.length - 2, o.length - 1) + "/" + o.slice(o.length - 1, o.length) + "/" + o + ".jpg";
    if (f) {
        if (!/^http(s)?:\/\//i.test(o)) {
            var src = "https://imgcache.qq.com/music/photo/mid_album_68",
                url = "https://y.gtimg.cn/music/photo_new/T002R68x68M000#mid#.jpg",
                img = o.split("/");
            try {
                img = img[img.length - 1];
                img = img.split(".")[0];
            } catch (e) {
                img = "";
            }
            return (!img) ? src + o : url.replace("#mid#", img);
        }
    } else {
        return o;
    }
};

const setList = (id, aid, name) => {
    $.ajax({
        type: "GET",
        url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=${id}&filename=C400${id}.m4a&guid=126548448`,
        dataType: "jsonp",
        success: function (data) {
            now++
            if (data.data) {
                listArr.push({
                    name: name,
                    path: `http://ws.stream.qqmusic.qq.com/C400${id}.m4a?fromtag=0&guid=126548448&vkey=${data.data.items[0].vkey}`,
                    imgs: getAvatar(aid, true)
                });
                if (now < musicArr.length) {
                    setList(musicArr[now].songmid, musicArr[now].albummid, musicArr[now].songname);
                };
            } else {
                console.log('接口调用失败');
            };
        }
    });
};

const musicPlay = (id) => {
    $.ajax({
        type: "GET",
        url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=${id}&filename=C400${id}.m4a&guid=126548448`,
        dataType: "jsonp",
        success: function (data) {
            if (data.data) {
                oAudio.src = `http://ws.stream.qqmusic.qq.com/C400${id}.m4a?fromtag=0&guid=126548448&vkey=${data.data.items[0].vkey}`;
                oAudio.play();
            } else {
                console.log('接口调用失败');
            };
        }
    });
};

$(document.body).on('click', '#search-btn', () => {
    const txt = $('#search-txt').val();
    if (txt) {
        $.ajax({
            type: "GET",
            async: false,
            url: 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp?aggr=1&cr=1&flag_qc=0&w=' + encodeURIComponent(txt) + '&p=1&n=10',
            dataType: "jsonp",
            jsonp: "jsonpCallback",
            success: function (data) {
                if (data.data) {
                    now = 0;
                    listArr.length = 0;
                    musicArr = data.data.song.list;
                    render(data.data.song.list);
                    setList(data.data.song.list[0].songmid, data.data.song.list[0].albummid, data.data.song.list[0].songname);
                } else {
                    console.log('接口调用失败');
                };
            }
        });
    } else {
        alert('请输入歌曲名 或 歌手名！');
    };

});

$(document).on("keydown", "#search-txt", (event) => {
    if (13 == event.keyCode) {
        $("#search-btn").trigger("click");
    };
});


// $getDom('#tbody').addEventListener('click', (event) => {
//     event.preventDefault();
//     const { dataset, classList } = event.target;
//     const id = dataset && dataset.id;

//     if (classList.contains('glyphicon-play')) {
//         musicPlay(id);
//     };
// });

$(document.body).on('click', '#tbody .glyphicon-play', (event) => {
    event.preventDefault();
    const { dataset } = event.target;
    const id = dataset && dataset.id;
    musicPlay(id);
});

$getDom('#import-music-btn').addEventListener('click', () => {
    //获取已选择项
    const newlistArr = [];
    [...$getAll('input', $getDom('#tbody'))].forEach((o, i) => {
        //方法1 删除没有被选择项
        // if (!o.checked) {
        //     delete listArr[i];
        // };

        //方法2 把已选择项入在一个新数组中
        if (o.checked) {
            newlistArr.push(listArr[i]);
        };
    });

    console.log(newlistArr);

    if (0 < newlistArr.length) {
        ipcRenderer.send('import-online-music', { status: true, data: newlistArr });
    } else {
        alert('请先选择音频文件！');
    };
});
