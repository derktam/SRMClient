/**
 * Created by Minhyeong on 2016-01-22.
 */

//-------------------------------------------
var config = [];
config.default_name = '';
config.server_ip = '118.33.90.68';
config.server_cmd_port = 25104;
config.server_proxy_port = 25105;
//-------------------------------------------
this.config = config;
this.obj = require('./obj');

var cmd_socket = require('./socket')(this, config.server_ip, config.server_cmd_port);
var skt = cmd_socket.getConnection('cmd');
this.cmd_socket = cmd_socket;

var obj = this.obj;


process.on('uncaughtException', function (err) {
    console.log(err.code);
    if(err.code == 'ECONNREFUSED'){
        var client_address = obj.lastest_connect;
        switch(client_address){
            case config.server_ip+':'+config.server_cmd_port:
                console.log('[접속 실패] : 관리 포트');
                setTimeout(function(){
                    console.log('재접속 시도중..');
                    skt.destroy();
                    obj.proxy.session = [];
                    skt = cmd_socket.getConnection('cmd');
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
    }else{
        console.log('[소켓 종료] : 알 수 없는 에러');
        setTimeout(function(){
            console.log('재접속 시도중..');
            skt.destroy();
            obj.proxy.session = [];
            skt = cmd_socket.getConnection('cmd');
        }, 5000);
    }
});