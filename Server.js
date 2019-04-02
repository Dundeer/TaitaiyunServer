const config = {
    port:8080,
    hostname:"192.168.0.21"
}
const ws = require('nodejs-websocket');
const daidaiyun = require('./Daidaiyun');
console.log("开始建立连接");

const socketServer = ws.createServer(function(conn){
    daidaiyun(conn);
}).listen(
    config.port,
    config.hostname
);

console.log('服务器运行于'+8080);

//socket服务
socketServer.on('uncaughtException',function(err){
    console.log(1);
    console.log(err);
    console.log(err.stack);
});

