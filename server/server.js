'use strict';

let express = require('express'),
	app = express(),
	mysql = require('mysql'),
	conf = require('../conf/config'),
	parser = require('../controller/parser_router').handle,
	loader = require('../controller/loader').handle;

let router = {
	'parser' : {
		'get' : parser
	},
    'option' : {
        'reload' : loader
    }
}

//localhost:2222/parser/get?page_url=xxx
//localhost:2222/parser/reload?router_name=xxx
let buildRequest = (req, res)=>{
	let path = req.path.split('/').slice(1);
    if(path[0] === 'favicon.ico'){
    	res.sendStatus(200);
        return undefined;
    }
    //路径非法
    if(path.length < 2){
    	res.sendStatus(403);
    	return undefined;
    }

    //赋值方法
    req.option = {
    	model : path[0],
    	controller : path[1],
        func : path[2]
    }
    if(!router[req.option.model] || !router[req.option.model][req.option.controller]){
    	res.sendStatus(403);
    	return undefined;
    }

    if(req.option.controller == "reload"){
    	req.mysql = mysql.createConnection(conf.mysql);
    	req.mysql.connect();
    }
    return req;
}

function handleRequest (req, res, next){
	req = buildRequest(req, res);
	if(!req){
		return ;
	}
	router[req.option['model']][req.option['controller']](req, res);
}

app.get('*', handleRequest);

exports.app = app;