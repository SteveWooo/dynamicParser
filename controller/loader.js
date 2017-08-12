let request = require('request'),
	mysqlLib = require('mysql'),
	fs = require('fs'),
	conf = require('../conf/config'),
	complieFile = require('./complieFile').handle;

var requireReload = function (name) {
    var id = require.resolve(name),
        old_cache = require.cache[id];
    delete require.cache[id];
};

//过滤情况：关闭解析器，修改解析器版本号为当前版本号
let cacheReload = (rows, callback)=>{
	if(rows.length == 0){
		callback('ROUTER_NOT_FOUND');
		return ;
	}
	rows.forEach((data)=>{
		//关闭解析器
		if(data['use_version'] == -1){
			delete global.parser_router[data['router_name']];
			return ;
		}

		//获取正在使用的对应版本号
		if(data['use_version'] != data['version']){
			return ;
		}
		//更换解析器版本
		data['parser'] = complieFile(data['parser']);//统一封装加载回来的文件
		//检查文件夹是否存在，不存在则创建
		var floderName = __dirname + "/parser/" + data['router_name'];
		if(!fs.existsSync(floderName)){
			fs.mkdirSync(floderName);
		}

		let filePath = floderName + "/parser.js";
		fs.writeFile(filePath, data['parser'], function(err){
			if(err){
				callback(err.code);
				return ;
			}

			requireReload(filePath);
			//TODO::::global parser_router中要添加这个路由
			callback('success');
		});
	})
}

let getNewParser = (req, callback)=>{
	let sql = "SELECT * FROM router WHERE router_name=" + mysqlLib.escape(req.query.router_name) + ";";
	req.mysql.query(sql, function(err, rows, field){
		if(err){
			callback(err.code);
			return ;
		}

		cacheReload(rows, callback);
	})
}

function handle(req, res){
	let callback = (data, message)=>{
		res.send(data);
		return ;
	}

	getNewParser(req, callback);
}


//都是同步的：：：：
//同步初始化创建文件夹和文件
let buildFile = (rows, callback)=>{
	var router = {};
	rows.forEach((data)=>{
		if(data['use_version'] != data['version']){
			return ;
		}
		router[data['router_name']] = {
			source : data['source']
		};
		data['parser'] = complieFile(data['parser']);//统一封装加载回来的文件
		
		let floderName = __dirname + "/parser/" + data['router_name'];
		if(!fs.existsSync(floderName)){
			fs.mkdirSync(floderName);
		}
		fs.writeFileSync(floderName + "/parser.js", data['parser']);
	})

	callback({
		router : router,
		err : undefined
	});
}
/*

1、查询route表
2、递归查询route表中各个路由表
3、递归过程中创建本地解析器
4、创建全局路由器 
	global.parser_router : {
		'video_parser':[],
		'list_parser' : []
	}

*/
function init(){
	return new Promise((callback)=>{
		let mysql = mysqlLib.createConnection(conf.mysql);
		mysql.connect();

		let sql = "SELECT * FROM router";
		mysql.query(sql, (err, rows, field)=>{
			if(err){
				callback(err.message);
				return ;
			}
			buildFile(rows, callback);
		})
	})
}

exports.init = init;
exports.handle = handle;