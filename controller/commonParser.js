
/*

爬取列表页的爬虫。
options : {
	//种子页以及pageUrl的正则
	seeds : {
		'seed1' : ['pageUrl1', 'pageUrl2'],
		'seed2' : ['pageUrl3', 'pageUrl4']
	},
	souce : "domain.com".
}

result : {
	//种子页以及结果（一堆真实能用的pageUrl）
	result : {
		'seed1' : ['pageUrl1', 'pageUrl2'],
		'seed2' : ['pageUrl3', 'pageUrl4']
	},
	source : "domain.com",
}

*/

let handle = (options, callback)=>{
	callback('haha')
}

exports.handle = handle;