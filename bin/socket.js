/**
 * Created by Minhyeong on 2016-01-22.
 */
var net = require('net');
var async = require('async');
var global = null;
module.exports = function(main, ip, port) {
    var getConnection = function(connName){
        var client = net.connect({port: port, host: ip}, function() {
            global = this;
            var target_socket = undefined;
            console.log(connName + ' Connected: ');
            console.log('   local = %s:%s', this.localAddress, this.localPort);
            console.log('   remote = %s:%s', this.remoteAddress, this.remotePort);
            this.setMaxListeners(0);

            if(port == 7004) {
                this.setEncoding('utf8');
                var packet = create_packet('hello', main.obj.key.exportKey('public'));
                send(this, packet);
                main.obj.server_socket = this;
            }else{
                if(connName == 'client-test'){
                    var client_address = ip + ":" + port;
                    console.log("[접속 성공] : " + client_address);
                    var packet = create_packet('link_ok',client_address,true);
                    send(main.obj.server_socket,packet);
                    this.end();
                }else if(connName == 'proxy'){
                    console.log("############# proxy ###########");
                    main.obj.proxy.link(this,function(socket){
                        var packet = main.obj.proxy.get_id_by_socket(socket) + "|" + socket.localAddress + ":" + socket.localPort;
                        packet = create_packet('link', packet, true);
                        send(main.obj.server_socket, packet);
                        console.log("link complete");
                    });
                }else if(connName == 'client'){
                    console.log("############# client ###########");
                    main.obj.proxy.link(this,function(socket){
                        var packet = main.obj.proxy.get_id_by_socket(socket) + "|" + socket.localAddress + ":" + socket.localPort;
                        packet = create_packet('link', packet, true);
                        send(main.obj.server_socket, packet);
                        console.log("link complete");
                    });
                }
            }
            this.on('data', function(data) {
                console.log('Received data from client on port %d: %s', client.remotePort, data.toString());
                //console.log('[' + connName + ']  Bytes received: ' + client.bytesRead);
                if(port == 7004) {
                    var packet = json_parse(data);
                    if(packet == -1)    return;
                    switch (packet.type) {
                        case 'hello':
                            main.obj.server_key.importKey(packet.data,'public');
                            var packet = create_packet('welcome','encrypt',true);
                            send(this,packet);
                            break;
                        case 'welcome':
                            if(packet.data == 'tpyrcne'){
                                console.log("Encrypt Check OK");
                                var packet = create_packet('hs_finish', "ok", true);
                                send(this,packet);
                            }else{
                                console.log("Encrypt Session Fail");
                                this.end();
                            }
                            break;
                        case 'name_check':
                            if(packet.data == 'ok'){
                                console.log("클라이언트가 시작되었습니다.");
                            }else if(packet.data == 'name' || packet.data == 'retry'){
                                process.stdin.resume();
                                process.stdin.setEncoding('utf8');
                                async.waterfall([
                                    function(cb) {
                                        console.log("등록할 이름을 입력해주세요 : ");
                                        process.stdin.on('data', function (chunk) {
                                            process.stdin.pause();
                                            cb(null,chunk);
                                        });
                                    },function(chunk,cb) {
                                        var packet = create_packet('name_check',chunk, true);
                                        send(global,packet);
                                    }
                                ]);
                            }
                            break;
                        case 'link':
                            var pr_ip = packet.data.split(":")[0];
                            var pr_port = parseInt(packet.data.split(":")[1]);

                            var clientSocket = require('./socket')(main, pr_ip, pr_port);
                            clientSocket.getConnection('client-test');

                            break;
                        case 'drop':
                            break;
                        case 'restart':
                            break;
                        case 'proxy_link':
                            console.log("[cmd][proxy_link]" + packet.data);
                            var tmp = packet.data.split("|");

                            var proxySocket = require('./socket')(main, '192.168.100.252', '7005');
                            var socket1 = proxySocket.getConnection('proxy');

                            var clientSocket = require('./socket')(main, tmp[1], tmp[2]);
                            var socket2 = clientSocket.getConnection('client');

                            main.obj.proxy.add(tmp[0],socket1,socket2);
                            break;
                    }
                }else{
                    var tmp = main.obj.proxy.get_target_socket(this);
                    target_socket = tmp;
                    if (tmp != -1)  send(tmp,data,this);
                    else    console.log("tmp = -1");
                }
            });

            this.on('drain', function () {
                console.log('drain'+port);
                target_socket.resume();
            });

            this.on('end', function() {
                main.obj.proxy.delete(this);
                console.log(connName + ' Client disconnected');
            });
            this.on('error', function(err) {
                console.log('Socket Error: ', JSON.stringify(err));
                console.log(err.stack);
            });
            this.on('timeout', function() {
                console.log('Socket Timed Out');
            });
            this.on('close', function() {
                console.log('Socket Closed');
            });
        });
        return client;
    }

    function send(socket, data, ori_socket) {
        if(ori_socket != undefined) ori_socket.pause();
        async.waterfall([
            function(cb) {
                var success = socket.write(data,function(){
                    cb(null,success,socket,data,ori_socket);
                });
            },
            function(success,socket,data,ori_socket,cb) {
                if (success) {
                    if(ori_socket != undefined) ori_socket.resume();
                }
            }
        ]);
    }

    var json_parse = function(data){
        var result;
        try {
            data = main.obj.key.decrypt(data,'utf8');
            result = JSON.parse(data);
            return result;
        }catch(e) {
            try {
                result = JSON.parse(data);
                return result;
            } catch (e) {
                return -1;
            }
            return -1;
        }
    }

    var create_packet = function(type,data,encrypt){
        var tmp = {
            type : type,
            data : data
        }
        var packet = JSON.stringify(tmp);
        if(encrypt) packet = main.obj.server_key.encrypt(packet,'base64');
        return packet;
    }

    return {
        getConnection : getConnection,
        create_packet : create_packet,
        send : send
    };
};