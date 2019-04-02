const user = {}//当前在线用户
const DDRoom = {};//当前存在房间
var mysql = require('mysql');//调用mysql模块

//创建一个连接
var connection = mysql.createConnection({
    host:"127.0.0.1",//ip
    user:'root',//用户名
    password:'123123',//密码
    port:'3306',//端口
    database:'daidaiyun'
});

//增
var userAddSql = 'INSERT INTO shuju(name,win,times,'+
    'integral,jifen,zuigao) VALUES (?,?,?,?,?,?)';

//创建连接
connection.connect(function(error){
    if(error){
        console.log(error);
        return;
    }else{
        console.log('connection success!');
    }
});                      

module.exports = socket;

function socket(conn){
    let userid = null;
    conn.on('text',function(str){
        if(isJSON(str)==true){
            var dats = JSON.parse(str);
            if(dats.id!=null){
                userid = dats.id;
                getTheClient(dats,conn);
            }else{
                conn.sendText(messages(0,0,'用户ID未填'));
            }
        }else{
            conn.sendText(messages(0,0,'请检查上是否为JSON格式'));
        }
    });
    conn.on('close',function(code,reason){
        exitWebsocket(userid);
    });
    conn.on('error',function(code,reason){
        exitWebsocket(userid);
    });
}
//创建新房间
function Room(){
    var newroom = {
        players:[],
        isplay:false
    }
    return newroom;
}
//创建一个新人物
function Player(conn){
    var Play = {
        conn:conn
    }
    return Play;
}
//内容处理
function getTheClient(data,conn){
    let id = data.id;
    if(!user[id]){
        user[id] = Player(conn);
    }
    
    switch(data.type){
        case "Login":
        //保持通信
        console.log(id+"连接中");
        conn.sendText(messages(1,Object.values(user).length,"通讯中"));
        break;
        case "Joinin":
       //加入房间
            let roomNum = Object.values(DDRoom).length;
            if(roomNum==0){
                //房间为空
                user[id]['roomId'] = 0;
                DDRoom[roomNum] = Room();
                DDRoom[0]['players'].push(id);
                DDRoom[0]['playNumber'] = 1;
                console.log("添加房间，房间数为："+Object.values(DDRoom).length+",房主id："+DDRoom[0]['players'][0]+",房间内人数为："+DDRoom[0]['playNumber']);
            }else{
                var selfRoomid = -1;
                var NullId = [];
                for(var i = 0;i < roomNum;i++){
                    if(DDRoom[i] == null){
                        NullId.push[i];
                        continue;
                    }
                    if(DDRoom[i]['playNumber'] < 2&&!DDRoom[i]['isplay']){
                        selfRoomid = i;
                        break;
                    }
                }
                if(selfRoomid == -1){
                     //创建房间
                     user[id]['roomId'] = NullId[0];
                     DDRoom[NullId[0]] = Room();
                     DDRoom[NullId[0]]['players'].push(id);
                     DDRoom[NullId[0]]['playNumber'] = 1;
                     console.log('房间数'+roomNum);
                }else{
                    //房间未满
                    user[id]['roomId'] = i;
                    DDRoom[i]['players'].push(id);
                    DDRoom[i]['playNumber'] = 2;
                    console.log(id+"进入房间"+roomNum - 1);
                }
            }
            conn.sendText(messages(1,2,"进入房间"));
        break;
        case "Gaming":
        console.log('Gaming');
        var player = user[id];
        var room = DDRoom[player['roomId']];
        console.log("游戏的房间号为：" + user[id]['roomId']);
        if(player["roomId"]!=null && data.start==1){
            if(room['playNumber'] > 1){
                if(room['players'][0]==id){
                    user[room['players'][1]]['conn'].sendText(messages(1,1,"对方已准备"));
                }else{
                    user[room['players'][0]]['conn'].sendText(messages(1,1,'对方已准备'));
                }
                room['isplay'] = true;
                conn.sendText(messages(1,1,'对方已准备'));
            }else{
                conn.sendText(messages(0,0,'另一玩家未加入'));
            }
        }else if(player['roomId']!=null && data.play!=null){
            try{
                if(room!=null){
                    if(room['playNumber'] > 1){
                        if(room['players'][0] == id){
                            if(user[room['players'][1]]!=null){
                                user[room['players'][1]]['conn'].sendText(messages(1,data.play,'对方的招式'));
                            }else{
                                conn.sendText(messages(1,1,"对方退出"));
                            }
                        }else{
                            if(user[room['players'][0]]!=null){
                                user[room['players'][0]]['conn'].sendText(messages(1,data.play,'对方的招式'));
                            }else{
                                conn.sendText(messages(1,1,"对方退出"));
                            }
                        }
                    }else{
                        conn.sendText(messages(1,1,"对方退出"));
                    }
                }else{
                    conn.sendText(messages(1,1,"对方退出"));
                }
            }catch(e){
                conn.sendText(messages(1,1,"对方退出"));
            }
           
        }else{
            conn.sendText(messages(0,0,'状态码失效'));
        }
        break;
        case "Quit":
        //退出房间
        console.log(id+"请求退出房间");
        if(user[id]['roomId']!=null){
            console.log(id+"退出房");
           if(DDRoom[user[id]['roomId']]!=null){
               if(DDRoom[user[id]['roomId']]['playNumber']>1){
                   if(DDRoom[user[id]['roomId']]['players'][0] == id){
                       if(DDRoom[user[id]['roomId']]['players'][1] != null){
                        DDRoom[user[id]['roomId']]['players'].splice(0,1);
                       }else{
                        delete DDRoom[user[id]['roomId']];
                       }
                   }else{
                       if(DDRoom[user[id]['roomId']]['players'][0] != null){
                        DDRoom[user[id]['roomId']]['players'].splice(1,1);
                       }else{
                        delete DDRoom[user[id]['roomId']];
                       }
                   }
               }else{
                delete DDRoom[user[id]['roomId']];
               } 
           }
            delete user[id].roomId;
        }
        conn.sendText(messages(1,1,"退出房间"));
        break;
        case 'Selfshuju':
        console.log(id+"访问了数据");
        connection.query('SELECT * FROM shuju',function(error,result){
            if(error)
            {
                console.log("查找错误"+error);
                return;
            }
            if(result){
                var str  = JSON.parse(JSON.stringify(result));
                var isTure = false;
                var mysqlid;
                for(var i = 0; i < str.length;i++){
                    if(str[i].name == id){                 
                        mysqlid = i;
                        isTure = true;
                    }
                }
                if(isTure){
                    if(data.start == "cha"){
                        conn.sendText(messages(1,str[mysqlid],"个人数据"));
                    }else{
                        var integral = str[mysqlid].integral;
                        var win = str[mysqlid].win;
                        var times =  str[mysqlid].times;
                        times++;
                        switch(data.start){
                            case "ying":
                            win++;
                            integral++;
                            break;
                            case "shu":
                            if(integral>0){
                                integral--;
                            }
                            break;
                        }
                        var user_ms = [times,win,integral,str[mysqlid].id];
                        var mysqlmingling = "UPDATE shuju SET times = ?,win = ?,integral = ? WHERE id = ?"
                        connection.query(mysqlmingling,user_ms,function(error){
                            if(error){
                                console.log("修改出错"+error.message);
                                return;
                            }
                        });
                        DDRoom[user[id]['roomId']]['isplay'] = false;
                        conn.sendText(messages(1,1,"个人数据"));
                    }
                }else{
                    var win = 0;
                    var times = 0;
                    var integral = 1000;
                    if(data.start != "cha"){
                        times++;
                        switch(data.start){
                            case "ying":
                            win++;
                            integral++;
                            break;
                            case "shu":
                            integral--;
                            break;
                        }
                    }
                    var shujuParams = [id,win,times,integral,str.length+1,0];
                    connection.query(userAddSql,shujuParams,function(error,result){
                        if(error){
                            console.log("增加中的错误"+error);
                            return;
                        }
                        console.log("增加中的返回2"+result);
                        conn.sendText(messages(1,shujuParams,"个人数据"));
                    });
                }    
            }
        });
        // connection.query('DELETE FROM shuju WHERE name  = "wang"');
        break;
        case "SelfRank":
        console.log(id+"访问了排行");
        connection.query("Select * from shuju order by integral desc",
        function(error,result){
            if(error){
                console.log("访问排行是出错了"+error);
                return;
            }
            var str  = JSON.parse(JSON.stringify(result));
            var paihang = 0;
            var strNumber = 0;
            var isTure = false;
            for(var j = 0;j < str.length;j++){
                if(str[j].name == id){  
                    strNumber = j;                      
                    paihang = j + 1;
                    isTure = true;
                }
            }
            if(isTure){
                var userdata = {name:str[strNumber].name,integral:str[strNumber].integral,jifen:paihang,Alllength:str.length};
                if(paihang != str[strNumber].jifen){
                    var mysqlupdate = "UPDATE shuju SET jifen = ? WHERE id = ?";
                    var mysqldata = [paihang,str[strNumber].id];
                    connection.query(mysqlupdate,mysqldata,function(error){
                        if(error){
                            console.log("在修改排名是出错"+error);
                            return;
                        }
                        conn.sendText(messages(1,userdata,"个人排行"));
                    });
                    
                }else{
                    conn.sendText(messages(1,userdata,"个人排行"));
                }
            }else{
                var shujuParams = [id,0,0,1000,str.length + 1,0];
                var userdata = {name:id,integral:1000,jifen:str.length + 1,Alllength:str.length};
                connection.query(userAddSql,shujuParams,function(error,result){
                    if(error){
                    console.log("增加中的错误"+error);
                    return;
                    }
                    console.log("增加中的返回2"+result);
                    conn.sendText(messages(1,userdata,"个人排行"));
                });
            }  
        })
        break;
        case "AllRank":
        connection.query("Select * from shuju order by integral desc",function(error,result){
            if(error){
                console.log("查询总排行时出错");
                return;
            }
            if(result){
                var res = JSON.parse(JSON.stringify(result));
                if(res.length > 20){
                    for(var i = 0;i < 20;i++){
                        conn.sendText(messages(1,res[i],"总排行"));
                    }
                }else{
                    for(var i = 0;i < res.length;i++){
                        conn.sendText(messages(1,res[i],"总排行"));
                    }
                }
            }
        });
        break;
        default:
        console.log("没有进入判断,数据的值为"+data.type);
        break;
    }
}
//用户退出处理
function exitWebsocket(userid){
    //如果userid不为空，则执行
    if(userid!=null){     
        if(Object.values(DDRoom).length>0){
            if(user[userid]!=null){
                var roomid = user[userid]['roomId'];
                var room = DDRoom[roomid];    
                if(room!=null){
                    if(room['playNumber'] > 1){  
                        if(room['isplay']){
                            connection.query('SELECT * FROM shuju',function(error,result){
                                if(error)
                                {
                                    console.log("查找错误"+error);
                                    return;
                                }
                                if(result){
                                    var str  = JSON.parse(JSON.stringify(result));
                                    var isTure = false;
                                    var mysqlid;
                                    for(var i = 0; i < str.length;i++){
                                        if(str[i].name == userid){                 
                                            mysqlid = i;
                                            isTure = true;
                                        }
                                    }
                                    if(isTure){
                                        var integral = str[mysqlid].integral;
                                        var times = str[mysqlid].times;
                                        times++;
                                       if(integral>0){
                                           integral--;   
                                       }
                                       var user_ms = [times,integral,userid];
                                           connection.query("UPDATE shuju SET times = ?,integral = ?WHERE name = ?",user_ms,function(error){
                                            if(error){
                                                console.log("修改出错"+error);
                                            }
                                        });
                                    }else{
                                        var shujuParams = [userid,0,1,999,str.length+1,0];
                                        connection.query(userAddSql,shujuParams,function(error,result){
                                            if(error){
                                                console.log("增加中的错误"+error);
                                                return;
                                            }
                                            console.log("增加中的返回2"+result);
                                        });
                                    }    
                                }
                            });
                        }      
                        if(room['players'][0] == userid){ 
                            if(user[room['players'][1]]!=null){
                                user[room['players'][1]]['conn'].sendText(messages(1,1,"对方退出"));
                            }   
                        }else{     
                            if(user[room['players'][1]]!=null){
                                user[room['players'][0]]['conn'].sendText(messages(1,1,"对方退出"));
                            }     
                        }
                    }                    
                    delete DDRoom[roomid];   
                }
            }
        }  
        console.log(userid+"退出了");
        delete user[userid];
    }
}
//判断是否是json
function isJSON(str){
    if(typeof str == 'string'){
        try{
            var obj = JSON.parse(str);
            if(typeof obj == 'object'&& obj){
                return true;
            }else{
                return false;
            }
        }catch(e){
            return false;
        }
    }
}
//发送私信
function sendMsg(id,str,type) {
    //Object.values(user)
    if(type==0){serviceMap[id].conn.sendText(str);}else{userMap[id].conn.sendText(str);}
}
//发送服务器提示
function messages(a,b,c){
    var msg = JSON.stringify({
        status:a,
        data:b,
        message:c
    });
    return msg;
}
//当前时间