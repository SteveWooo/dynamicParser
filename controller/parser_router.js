let _url = require('url'),
	domain = require('domain'),
	commonParser = require('./commonParser').handle;

let tryParse = (options, callback)=>{
	let router = global.parser_router,
		url = options.pageUrl,
		host = "/" + _url.parse(url).hostname,
		parserDir = __dirname + "/parser/";

	//匹配路由
	for(var i in router){
		if(host.indexOf("." + router[i]['source']) > -1 || 
			host.indexOf("/" + router[i]['source']) > -1){
			let parse = require(parserDir + i + "/parser.js").parse;
			parse(options, callback);
			return ;
		}
	}
	callback('NO_SUPPORT_URL');
}

function handle(req, res){
	/*
	* 最终响应出口。只有这里能操作res.send方法
	*/
	var callback = (data, message)=>{
		//用于防止重复回调的情况发生。只采用第一次回调的结果
		//理想情况下这只是防护措施。解析器不能出现2次callback的写法。
		if(res.isEnd){
			return ;
		}
		res.isEnd = true;

		//如果返回data是错误信息，就响应客户端吧
		if(typeof data == 'string'){
			res.send(JSON.stringify({
				error : {
					code : data,
					message : message
				}
			}))
			return ;
		}
		//返回data为状态码
		if(typeof data == 'number'){
			res.sendStatus(data);
			return ;
		}
		//为对象的情况
		if(typeof data == 'object'){
			res.send(data);
			return ;
		}
		//补漏
		res.sendStatus(503);
	}

	//解析器模块响应的内容，如果不是对象，就返回错误码或状态码
	var normalCallback = (data, message)=>{
		if(typeof data != 'object'){
			callback(data, message);
			return ;
		}

		//传入子解析模块的callback到公共解析模块中进行解析。
		commonParser(data, callback);
	}

	var options = {
		pageUrl : decodeURIComponent(req.query.page_url),
		query : req.query,
		func : req.func
	}
	
	/*
	* 解析操作入口。domain在此抓取模块异步逻辑中出现的异常
	*/
	let domainRun = domain.create();
	domainRun.on('error', (e)=>{
		console.log(e);
		normalCallback(e.message);
	})
	domainRun.run(()=>{
		//domain不会抓取同步时发生的异常。因此这里需要try catch一下
		try{
			(()=>{ //玄学：try catch中用IIFE性能会好一点儿
				tryParse(options, normalCallback);
			})()
		}catch(e){
			normalCallback(e.message);
		}
	})
}

exports.handle = handle;

var a = {
	x : 'haha',
	show : function(){
		console.log(this.x)
	}
}

var b = {
	x : 'a',
	__proto__ : a
}

b.show();