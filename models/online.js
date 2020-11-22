const { ipcRenderer } = require('electron');
const needle = require('needle');

const $ = require('../public/js/jquery.min.3.4.0.js');
const { $getDom, $getAll, $countTime } = require('./base');

const oAudio = new Audio();

let now = 0;
let listArr = [];
let musicArr = [];
let page = 1;
let word = '';
let totalnum = 0;

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
    let oCheck = [...$getAll('input', $getDom('#tbody'))];
    oCheck.forEach((item, index) => {
        item['onclick'] = () => {
            //至少选择一项
            let check = oCheck.some((o, i, a) => o.checked);
            $getDom('#import-music-btn').disabled = check ? false : true;

            //全部选中时
            let allCheck = oCheck.every((o, i, a) => o.checked);
            $getDom('#all-check').checked = allCheck ? true : false;
        }
    });

    //全选
    $getDom('#all-check').addEventListener('click', function () {
        oCheck.forEach((item, index) => {
            item.checked = this.checked;
            $getDom('#import-music-btn').disabled = this.checked ? false : true;
        });
    });

    //删除
    $getDom('#del-check').addEventListener('click', function () {
        //注：DOM删除后 记得要更新oCheck数组哦，不然第二次删除会出错
        oCheck = oCheck.filter((item, index) => {
            if (item.checked) {
                // item.parentNode.parentNode.parentNode.removeChild(item.parentNode.parentNode.parentNode.children[0]);
                item.parentNode.parentNode.parentNode.removeChild(item.parentNode.parentNode);
                return false;
            };
            return true;
        });
        $getDom('#all-check').checked = oCheck.every((o, i, a) => o.checked) && 0 < oCheck.length;
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
    // V1.0版
    // $.ajax({
    //     type: "GET",
    //     url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=${id}&filename=C400${id}.m4a&guid=126548448`,
    //     dataType: "jsonp",
    //     success: function (data) {
    //         now++;
    //         if (data.data) {
    //             listArr.push({
    //                 name: name,
    //                 path: `http://ws.stream.qqmusic.qq.com/C400${id}.m4a?fromtag=0&guid=126548448&vkey=${data.data.items[0].vkey}`,
    //                 imgs: getAvatar(aid, true)
    //             });
    //             if (now < musicArr.length) {
    //                 setList(musicArr[now].songmid, musicArr[now].albummid, musicArr[now].songname);
    //             };
    //         } else {
    //             console.log('接口调用失败');
    //         };
    //     }
    // });

    $.ajax({
        type: "GET",
        url: `https://api.qq.jsososo.com/song/urls?id=${id}`,
        success: function (o) {
            now++;
            if (o.data) {
                listArr.push({
                    name: name,
                    path: Object.values(o.data)[0],
                    imgs: getAvatar(aid, true)
                });
                if (now < musicArr.length) {
                    setList(musicArr[now].songmid, musicArr[now].albummid, musicArr[now].songname);
                };
            } else {
                if (o.result) {
                    alert(o.errMsg)
                } else {
                    console.log('接口调用失败');
                }
            };
        }
    });
};

const getMusic = () => {
    $.ajax({
        type: "GET",
        async: false,
        url: 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp?aggr=1&cr=1&flag_qc=0&w=' + encodeURIComponent(word) + '&p=' + page + '&n=8',
        dataType: "jsonp",
        jsonp: "jsonpCallback",
        success: function (data) {
            if (data.data) {
                now = 0;
                listArr.length = 0;

                // 只取前5条
                musicArr = data.data.song.list.filter((o, i) => i < 5);
                render(musicArr);

                // 总页数据 只显示前50条
                totalnum = data.data.song.totalnum > 50 ? 50 : data.data.song.totalnum;
                setList(musicArr[0].songmid, musicArr[0].albummid, musicArr[0].songname);

                // 分页
                var i = '';
                for (let index = 0; index < totalnum / 10; index++) {
                    i += `<i class="${page == index + 1 ? 'act' : ''}" >${index + 1}</i>`;
                }
                $('#nav-pages').html(i);

                $('#totalnum').text(`共${totalnum}条`);
            } else {
                console.log('接口调用失败');
            };
        }
    });

    // var token = 'FXTTMF45LEH'
    // $.ajax({
    //     type: "GET",
    //     async: false,
    //     url: `http://www.kuwo.cn/api/www/search/searchKey?key=${encodeURIComponent(txt)}`,
    //     headers: {
    //         Referer: 'http://www.kuwo.cn/',
    //         csrf: token,
    //         cookie: 'kw_token=' + token,
    //     },
    //     success: function (data) {
    //         if (data.data) {
    //             now = 0;
    //             listArr.length = 0;
    //             musicArr = data.data.song.list;
    //             render(musicArr);
    //             setList(musicArr[0].songmid, musicArr[0].albummid, musicArr[0].songname);
    //         } else {
    //             console.log('接口调用失败');
    //         };
    //     }
    // });

};

const musicPlay = (id, item) => {
    // V1.0版
    // $.ajax({
    //     type: "GET",
    //     url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?format=json205361747&platform=yqq&cid=205361747&songmid=${id}&filename=C400${id}.m4a&guid=126548448`,
    //     dataType: "jsonp",
    //     success: function (data) {
    //         if (data.data) {
    //             oAudio.src = `http://ws.stream.qqmusic.qq.com/C400${id}.m4a?fromtag=0&guid=126548448&vkey=${data.data.items[0].vkey}`;
    //             oAudio.play();
    //         } else {
    //             console.log('接口调用失败');
    //         };
    //     }
    // }); 

    $.ajax({
        type: "GET",
        url: `https://api.qq.jsososo.com/song/urls?id=${id}`,
        success: function (o) {
            if (o.data) {
                oAudio.src = Object.values(o.data)[0];
                oAudio.addEventListener('canplay', function () {
                    $item = $(item);
                    $('#tbody .glyphicon-play').not($item).removeClass('glyphicon-pause')
                    if ($item.hasClass('glyphicon-pause')) {
                        this.pause();
                        $(item).removeClass('glyphicon-pause');
                    } else {
                        this.play();
                        $(item).addClass('glyphicon-pause');
                    }
                });
            } else {
                if (o.result) {
                    alert(o.errMsg)
                } else {
                    console.log('播放接口调用失败');
                }
            };
        }
    });
};

const searchMusic = (word) => {
    $.ajax({
        type: "GET",
        async: false,
        url: `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=${encodeURIComponent(word)}&p=1&n=10`,
        dataType: "jsonp",
        jsonp: "jsonpCallback",
        success: function (o) {
            if (o.data) {
                const arr = o.data.song.list;
                var li = '';
                for (let i = 0; i < arr.length; i++) {
                    li += `<li>${arr[i].songname}</li>`;
                }
                $('#search-box').html(li).slideDown();
            } else {
                console.log('接口调用失败');
            };
        }
    });
};

$(document.body).on('input', '#search-txt', function () {
    word = $(this).val();
    (word) && searchMusic(word);
});

$(document.body).on('blur', '#search-txt', function () {
    $('#search-box').slideUp();
});

$(document.body).on('click', '#search-box li', function () {
    word = $(this).text();
    if (word) {
        page = 1;
        getMusic();
        $('#search-txt').val(word);
    }
    $(this).parent().slideUp();
});

$(document.body).on('click', '#search-btn', () => {
    word = $('#search-txt').val();
    if (word) {
        page = 1;
        getMusic();
        $('#search-box').slideUp();
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

$(document.body).on('click', '#tbody .glyphicon-play, #tbody .glyphicon-pause', (event) => {
    event.preventDefault();
    const { dataset } = event.target;
    const id = dataset && dataset.id;
    musicPlay(id, event.target);
});

$(document.body).on('click', '#nav-pages i', function (event) {
    event.preventDefault();
    page = $(this).text();
    getMusic();
    $(this).addClass('act').siblings('i').removeClass('act');
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
        if (o.checked && listArr[i]) {
            newlistArr.push(listArr[i]);
        };
    });
    if (0 < newlistArr.length) {
        ipcRenderer.send('import-online-music', { status: true, data: newlistArr });
        alert("添加成功！");
    } else {
        alert('请先选择音频文件！');
    };
});
