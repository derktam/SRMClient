/**
 * Created by Minhyeong on 2016-01-22.
 */


var NodeRSA = require('node-rsa');
var key = new NodeRSA({b: 512});
var server_key = new NodeRSA({b: 512});
var server_socket = "";
var proxy = [];
var test = 0;


proxy['get_target_socket'] = function (socket) {
    for(var i=0;i<proxy.length;i++){
        if(Object.is(proxy[i].client,socket)){
            return proxy[i].proxy;
        }else if(Object.is(proxy[i].proxy,socket)){
            return proxy[i].client;
        }
    }
    return -1;
};

proxy['link'] = function (socket,callback) {
    for(var i=0;i<proxy.length;i++){
        if(Object.is(proxy[i].client,socket)){
            if(!proxy[i].state)
                proxy[i].state = true;
            else if(callback != undefined) callback(proxy[i].proxy);
            return true;
        }else if(Object.is(proxy[i].proxy,socket)){
            if(!proxy[i].state)
                proxy[i].state = true;
            else if(callback != undefined) callback(proxy[i].proxy);
            return true;
        }
    }
    return false;
};

proxy['get_id_by_socket'] = function (socket) {
    for(var i=0;i<proxy.length;i++){
        if(Object.is(proxy[i].client,socket)){
            return proxy[i].id;
        }else if(Object.is(proxy[i].proxy,socket)){
            return proxy[i].id;
        }
    }
    return -1;
};

proxy['add'] = function (id, socket1, socket2){
    var tmp = [];
    tmp.id = id;
    tmp.proxy = socket1;
    tmp.client = socket2;
    tmp.state = false;
    proxy.push(tmp);
    console.log("[프록시 추가] " + id)
}

proxy['delete'] = function (socket) {
    for(var i=0;i<proxy.length;i++){
        if( Object.is(proxy[i].proxy,socket) ){
            if(proxy[i].client != undefined)    proxy[i].client.end();
            console.log("[프록시 제거] " + proxy[i].id);
            proxy.splice(i,1);
        }else if( Object.is(proxy[i].client,socket) ){
            if(proxy[i].proxy != undefined)    proxy[i].proxy.end();
            console.log("[프록시 제거] " + proxy[i].id);
            proxy.splice(i,1);
            break;
        }
    }
};

module.exports = {
    key:key,
    server_key:server_key,
    server_socket:server_socket,
    test:test,
    proxy:proxy
};