exports.$getDom = (ele, doc = document) => doc.querySelector(ele);

exports.$getAll = (ele, doc = document) => doc.querySelectorAll(ele);

exports.$on = (ele = document, event = 'click', back, mao = false) => {
    ele.addEventListener(event, (e) => {
        back(e);
    }, mao)
};

exports.$countTime = (time = 0) => {
    const minutes = '0' + Math.floor(time / 60);
    const seconds = '0' + Math.floor(time - minutes * 60);
    return minutes.substr(-2) + ':' + seconds.substr(-2);
};
