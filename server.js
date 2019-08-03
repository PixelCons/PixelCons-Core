// Core
var fs = require('fs');
var path = require('path');
var uglifyjs = require("uglify-js");
var uglifycss = require('uglifycss');
var uglifyhtml = require('html-minifier');
var express = require('express');
var serverPort = 8080;



// Build Files
var appBuildPath = "build";
var appMinifiedIndex = "src/index.min.html";
var appScriptBuildPath = "build/app.min.js";
var appScripts = [
	"src/app/app.modules.js",
	"src/app/services/ethprice.filter.js",
	"src/app/services/web3.service.js",
	"src/app/services/coreContract.service.js",
	"src/app/services/market.service.js",
	"src/app/pages/details/details.controller.js",
	"src/app/pages/create/create.controller.js",
	"src/app/pages/account/account.controller.js",
	"src/app/pages/collection/collection.controller.js",
	"src/app/pages/creator/creator.controller.js",
	"src/app/pages/search/search.controller.js",
	"src/app/pages/home/home.controller.js",
	"src/app/pages/start/start.controller.js",
	"src/app/pages/terms/terms.controller.js",
	"src/app/shared/header/header.directive.js",
	"src/app/shared/footer/footer.directive.js",
	"src/app/shared/accounticon/accounticon.directive.js",
	"src/app/shared/pixelcon/pixelcon.directive.js",
	"src/app/shared/pixelconcard/pixelconcard.directive.js",
	"src/app/dialogs/pixelcon/pixelcon.controller.js",
	"src/app/dialogs/collection/collection.controller.js",
	"src/app/dialogs/send/send.controller.js"
];
var appStyleSheetsBuildPath = "build/style.min.css";
var appStyleSheets = [
	"src/css/style.css",
	"src/app/pages/details/details.view.css",
	"src/app/pages/create/create.view.css",
	"src/app/pages/account/account.view.css",
	"src/app/pages/collection/collection.view.css",
	"src/app/pages/creator/creator.view.css",
	"src/app/pages/search/search.view.css",
	"src/app/pages/home/home.view.css",
	"src/app/pages/start/start.view.css",
	"src/app/pages/terms/terms.view.css",
	"src/app/shared/header/header.view.css",
	"src/app/shared/footer/footer.view.css",
	"src/app/shared/accounticon/accounticon.view.css",
	"src/app/shared/pixelcon/pixelcon.view.css",
	"src/app/shared/pixelconcard/pixelconcard.view.css",
	"src/app/dialogs/pixelcon/pixelcon.view.css",
	"src/app/dialogs/collection/collection.view.css",
	"src/app/dialogs/send/send.view.css",
];
var appHTMLBuildPath = "build/templates/";
var appHTML = [
	"src/app/pages/home/home.view.html",
	"src/app/pages/details/details.view.html",
	"src/app/pages/collection/collection.view.html",
	"src/app/pages/creator/creator.view.html",
	"src/app/pages/search/search.view.html",
	"src/app/pages/account/account.view.html",
	"src/app/pages/create/create.view.html",
	"src/app/pages/start/start.view.html",
	"src/app/pages/terms/terms.view.html",
	"src/app/shared/footer/footer.view.html",
	"src/app/shared/header/header.view.html",
	"src/app/shared/pixelcon/pixelcon.view.html",
	"src/app/shared/pixelconcard/pixelconcard.view.html",
	"src/app/shared/accounticon/accounticon.view.html",
	"src/app/dialogs/collection/collection.view.html",
	"src/app/dialogs/pixelcon/pixelcon.view.html",
	"src/app/dialogs/send/send.view.html"
];
var appImagesBuildPath = "build/";
var appImagesPath = "src/img/";
var appLibrariesBuildPath = "build/";
var appLibrariesPath = "src/lib/";



// Start/Build Sequence
var args = process.argv.slice(2);
var debugMode = args.indexOf('-debug') > -1;
if(debugMode) {
	
	//start server
	startServer();
	
} else {
	
	//build then start server
	prepBuild().then(function() {
		return minifyScripts();
	}).then(function() {
		return minifyStyleSheets();
	}).then(function() {
		return minifyHTML();
	}).then(function() {
		return copyImages();
	}).then(function() {
		return copyLibraries();
	}).then(function() {
		console.log('Build Complete!');
		console.log('');
		startServer();
	}, function(err) {
		console.log('Failed to build and start server...');
		console.log(err);
	});
	
}



// Server Startup
function startServer() {
	console.log('Starting server...');
	
	// Serve all app files
	var app = express();
	if(debugMode) app.use(express.static(__dirname + '\\src')); 
	app.use(express.static(__dirname + '\\build')); 
	app.use(function (err, req, res, next) {
		if (req.xhr) {
			res.status(500).send('Oops, Something went wrong!');
		} else {
			next(err);
		}
	});
	app.get('*', function(req, res) {
		if(debugMode) res.sendFile(__dirname + '\\src\\index.html');
		else res.sendFile(__dirname + '\\build\\index.min.html');
	})

	// Start Express App Server
	app.listen(serverPort);
	console.log('Hosting on port ' + serverPort);
}



// Build Steps
function prepBuild() {
	return new Promise(function(resolve, reject) {
		if(!fs.existsSync(appBuildPath)) fs.mkdirSync(appBuildPath);
		if(!fs.existsSync(appHTMLBuildPath)) fs.mkdirSync(appHTMLBuildPath);
		copyFileSync(appMinifiedIndex, appBuildPath);
		
		resolve({});
	});
}
function minifyScripts() {
	console.log("Minifying scripts...");
	return new Promise(function(resolve, reject) {
		var filePromises = [];
		for(var i=0; i<appScripts.length; i++) filePromises.push(readFilePromise(appScripts[i]));
		Promise.all(filePromises).then(function(results) {
			var code = {};
			for(var i=0; i<results.length; i++) code[results[i].file] = results[i].data;
			
			var uglified = uglifyjs.minify(code);
			fs.writeFile(appScriptBuildPath, uglified.code, function(err) {
				if(err) {
					console.log("Failed to minify scripts!");
					reject(err);
				} else {
					resolve({});
				}      
			});
			
		});
	});
}
function minifyStyleSheets() {
	console.log("Minifying style sheets...");
	return new Promise(function(resolve, reject) {
		
		var uglified = uglifycss.processFiles(appStyleSheets);
		fs.writeFile(appStyleSheetsBuildPath, uglified, function(err) {
			if(err) {
				console.log("Failed to minify style sheets!");
				reject(err);
			} else {
				resolve({});
			}      
		});
	});
}
function minifyHTML() {
	console.log("Minifying html templates...");
	return new Promise(function(resolve, reject) {
			
		var filePromises = [];
		for(var i=0; i<appHTML.length; i++) filePromises.push(readFilePromise(appHTML[i]));
		Promise.all(filePromises).then(function(results) {
			try {
				var fileWritePromises = [];
				for(var r=0; r<results.length; r++) {
					var filePath = results[r].file.split('/');
					var firstPathPart = true;
					var copyFile = appHTMLBuildPath;
					for(var i=0; i<filePath.length; i++) {
						if(i == filePath.length-2) {
							var fileName = filePath[filePath.length-1];
							if(fileName.indexOf(filePath[i]) != 0) { 
								if(!firstPathPart) copyFile += "_";
								copyFile += filePath[i];
								firstPathPart = false;
							}
						} else {
							if(filePath[i] != 'src' && filePath[i] != 'app') { 
								if(!firstPathPart) copyFile += "_";
								copyFile += filePath[i];
								firstPathPart = false;
							}
						}
					}
					
					var uglified = uglifyhtml.minify(results[r].data, {collapseWhitespace:true, preserveLineBreaks:true, removeComments:true});
					fileWritePromises.push(writeFilePromise(copyFile, uglified));
				}
				Promise.all(fileWritePromises).then(function(results) {
					resolve({});
				}, function() {
					console.log("Failed to minify style sheets!");
					reject(err);
				});
			} catch(err) {
				console.log("Failed to minifying html templates!");
				reject(err);
			}
		
		});
			
	});
}
function copyImages() {
	console.log("Copying images...");
	return new Promise(function(resolve, reject) {
		try {
			copyFolderRecursiveSync(appImagesPath, appImagesBuildPath);
			resolve({});
		} catch(err) {
			console.log("Failed to copy images!");
			reject(err);
		}
	});
}
function copyLibraries() {
	console.log("Copying libraries...");
	return new Promise(function(resolve, reject) {
		try {
			copyFolderRecursiveSync(appLibrariesPath, appLibrariesBuildPath);
			resolve({});
		} catch(err) {
			console.log("Failed to copy libraries!");
			reject(err);
		}
	});
}



// Utils
function readFilePromise(file) {
	return new Promise(function(resolve, reject) {
		fs.readFile(file, "utf8", function(err, data) {
			if(err) reject(err);
			else resolve({file:file, data:data});
		});
	});
}
function writeFilePromise(file, data) {
	return new Promise(function(resolve, reject) {
		fs.writeFile(file, data, function(err) {
			if(err) reject(err);
			else resolve({file:file});
		});
	});
}
function copyFileSync(source, target) {
	var targetFile = target;

	//if target is a directory a new file with the same name will be created
	if(fs.existsSync(target)) {
		if(fs.lstatSync(target).isDirectory()) {
			targetFile = path.join(target, path.basename(source));
		}
	}

	fs.writeFileSync(targetFile, fs.readFileSync(source));
}
function copyFolderRecursiveSync(source, target) {
	var files = [];

	//check if folder needs to be created or integrated
	var targetFolder = path.join(target, path.basename(source));
	if(!fs.existsSync(targetFolder)) {
		fs.mkdirSync(targetFolder);
	}

	//copy
	if(fs.lstatSync(source).isDirectory()) {
		files = fs.readdirSync(source);
		files.forEach(function(file) {
			var curSource = path.join(source, file);
			if(fs.lstatSync(curSource).isDirectory()) {
				copyFolderRecursiveSync(curSource, targetFolder);
			} else {
				copyFileSync(curSource, targetFolder);
			}
		});
	}
}
