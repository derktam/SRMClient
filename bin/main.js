/**
 * Created by Minhyeong on 2016-01-22.
 */

//-------------------------------------------
var config = [];
config.server_ip = '192.168.100.135';
config.server_cmd_port = 6004;
config.server_proxy_port = 6005;
//-------------------------------------------
this.config = config;
this.obj = require('./obj');

var cmd_socket = require('./socket')(this, config.server_ip, config.server_cmd_port);
cmd_socket.getConnection('cmd');
this.cmd_socket = cmd_socket;

var obj = this.obj;

process.on('uncaughtException', function (err) {
    console.log(err.stack);
    if(err.stack.split(" ")[2] == 'ECONNREFUSED'){
        var client_address = err.stack.split(" ")[3].replace(/\n/gi,"");
        switch(client_address){
            case config.server_ip+':'+config.server_cmd_port:
                console.log('[접속 실패] : 관리 포트');
                setTimeout(function(){
                    console.log('재접속 시도중..');
                    cmd_socket.getConnection('cmd');
                }, 5000);
                break;
            case config.server_ip+':'+config.server_proxy_port:
                console.log('[접속 실패] : 프록시 포트');
                break;
            default:
                console.log('[접속 실패] : ' + client_address);
                var packet = cmd_socket.create_packet('link_fail',client_address,true);
                cmd_socket.send(obj.server_socket,packet);
                break;
        }
    }
});