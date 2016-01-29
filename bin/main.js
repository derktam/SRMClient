//-------------------------------------------

var server_ip = '192.168.100.252';
var server_cmd_port = 7004;
var server_proxy_port = 7005;

//-------------------------------------------


var cmd_socket = require('./socket')(this, server_ip, server_cmd_port);
this.obj = require('./obj');
cmd_socket.getConnection("cmd");


var global_obj = this.obj;
process.on('uncaughtException', function (err) {
    console.log(err.stack);
    if(err.stack.split(" ")[2] == 'ECONNREFUSED'){
        var client_address = err.stack.split(" ")[3].replace(/\n/gi,"");
        switch(client_address){
            case server_ip+':'+server_cmd_port:
                console.log("[접속 실패] : 관리 포트");
                setTimeout(function(){
                    cmd_socket.getConnection("cmd");
                }, 5000);
                break;
            case server_ip+':'+server_proxy_port:
                console.log("[접속 실패] : 프록시 포트");
                break;
            default:
                console.log("[접속 실패] : " + client_address);
                var packet = cmd_socket.create_packet('link_fail',client_address,true);
                cmd_socket.send(global_obj.server_socket,packet);
                break;
        }
    }
});