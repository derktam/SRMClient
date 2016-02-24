/**
 * Created by Minhyeong on 2016-01-22.
 */


var NodeRSA = require('node-rsa');
var key = new NodeRSA({b: 512});
var server_key = new NodeRSA({b: 512});
var server_socket = "";
var proxy = [];
var lastest_connect = undefined;
proxy.session = [];

proxy['get_target_socket'] = function (socket) {
    for(var i=0;i<proxy.session.length;i++){
        if(Object.is(proxy.session[i].client,socket)){
            return proxy.session[i].proxy;
        }else if(Object.is(proxy.session[i].proxy,socket)){
            return proxy.session[i].client;
        }
    }
    return -1;
};

proxy['link'] = function (socket,callback) {
    for(var i=0;i<proxy.session.length;i++){
        if(Object.is(proxy.session[i].client,socket)){
            if(!proxy.session[i].state)
                proxy.session[i].state = true;
            else if(callback != undefined) callback(proxy.session[i].proxy);
            return true;
        }else if(Object.is(proxy.session[i].proxy,socket)){
            if(!proxy.session[i].state)
                proxy.session[i].state = true;
            else if(callback != undefined) callback(proxy.session[i].proxy);
            return true;
        }
    }
    return false;
};

proxy['get_id_by_socket'] = function (socket) {
    for(var i=0;i<proxy.session.length;i++){
        if(Object.is(proxy.session[i].client,socket)){
            return proxy.session[i].id;
        }else if(Object.is(proxy.session[i].proxy,socket)){
            return proxy.session[i].id;
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
    proxy.session.push(tmp);
    console.log("[프록시 추가] " + id)
}

proxy['delete'] = function (socket) {
    for(var i=0;i<proxy.session.length;i++){
        if( Object.is(proxy.session[i].proxy,socket) ){
            if(proxy.session[i].client != undefined)    proxy.session[i].client.end();
            console.log("[프록시 제거] " + proxy.session[i].id);
            proxy.session.splice(i,1);
        }else if( Object.is(proxy.session[i].client,socket) ){
            if(proxy.session[i].proxy != undefined)    proxy.session[i].proxy.end();
            console.log("[프록시 제거] " + proxy.session[i].id);
            proxy.session.splice(i,1);
            break;
        }
    }
};

module.exports = {
    key:key,
    server_key:server_key,
    server_socket:server_socket,
    lastest_connect:lastest_connect,
    proxy:proxy
};