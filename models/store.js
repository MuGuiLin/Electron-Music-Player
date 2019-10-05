const Store = require('electron-store');

// const store = new Store('music');

// store.set('list', '🦄');
// console.log(store.get('list'));
// //=> '🦄'

// // Use dot-notation to access nested properties
// store.set('foo.bar', true);
// console.log(store.get('foo'));
// //=> {bar: true}

// store.delete('list');
// console.log(store.get('list'));
// //=> undefined

const path = require('path');

module.exports = class store extends Store {
    constructor(config) {
        super(config);
        this.list = this.get('music-list') || [];
    };

    saveList() {
        this.set('music-list', this.list);
        return this;
    };

    getList() {
        return this.get('music-list') || [];
    };

    addList(listArr) {
        let i = 0;
        const newList = listArr.map((o, i) => {
            i++;
            //设置新存储对象
            return {
                id: Date.now() + i,
                path: o.path,
                name: o.name || '佚名',
                imgs: o.imgs || '../static/music.png',
                time: '00:00'
            };
        }).filter((o, i) => {
            //去除重复的
            const resetPath = this.getList().map((o, i) => o.path);
            return resetPath.indexOf(o.path) < 0;
        });

        this.list = [...this.list, ...newList];

        return this.saveList();
    };

    delList(id) {
        this.list = this.list.filter((o, i) => {
            return o.id != id;
        });
        return this.saveList();
    };

    upTime(id, time) {
        this.getList().forEach((o, i) => {
            if(id == o.id) {
                this.list[i].time = time || '00:00';
            };
        });
        return this.saveList();
    }
};