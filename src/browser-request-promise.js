const br = require('browser-request');
brp = function(options) {
	return new Promise(function(resolve, reject) {
		br(options, function(er, response, body){
			if(er)
				reject(er);
			else
				resolve(body, response);
		});
	});
}

module.exports = brp;