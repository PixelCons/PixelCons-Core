/***********************************************************************
 * webbuild.js
 * Compiles all JS, CSS, HTML and other resources for the web app
 ***********************************************************************/
const fs = require('fs');
const path = require('path');
const uglifyjs = require('uglify-js');
const uglifycss = require('uglifycss');
const uglifyhtml = require('html-minifier');
const watch = require('node-watch');

// Build Files
const appBuildPath = resolvePath("build");
const appSourcePath = resolvePath("src");
const appMinifiedIndex = resolvePath("src/index.min.html");
const appImagesPath = resolvePath("src/img");
const appLibrariesPath = resolvePath("src/lib");
const appDataPath = resolvePath("src/data");
const appScriptBuildPath = resolvePath("build/app.min.js");
const appScripts = [
	resolvePath("src/app/app.modules.js"),
	resolvePath("src/app/services/ethprice.filter.js"),
	resolvePath("src/app/services/web3.service.js"),
	resolvePath("src/app/services/coreContract.service.js"),
	resolvePath("src/app/services/market.service.js"),
	resolvePath("src/app/services/decoder.service.js"),
	resolvePath("src/app/services/similarities.service.js"),
	resolvePath("src/app/pages/details/details.controller.js"),
	resolvePath("src/app/pages/create/create.controller.js"),
	resolvePath("src/app/pages/account/account.controller.js"),
	resolvePath("src/app/pages/collection/collection.controller.js"),
	resolvePath("src/app/pages/creator/creator.controller.js"),
	resolvePath("src/app/pages/owner/owner.controller.js"),
	resolvePath("src/app/pages/search/search.controller.js"),
	resolvePath("src/app/pages/home/home.controller.js"),
	resolvePath("src/app/pages/start/start.controller.js"),
	resolvePath("src/app/pages/terms/terms.controller.js"),
	resolvePath("src/app/shared/header/header.directive.js"),
	resolvePath("src/app/shared/footer/footer.directive.js"),
	resolvePath("src/app/shared/accounticon/accounticon.directive.js"),
	resolvePath("src/app/shared/pixelcon/pixelcon.directive.js"),
	resolvePath("src/app/shared/pixelconcard/pixelconcard.directive.js"),
	resolvePath("src/app/dialogs/pixelcon/pixelcon.controller.js"),
	resolvePath("src/app/dialogs/collection/collection.controller.js"),
	resolvePath("src/app/dialogs/send/send.controller.js"),
	resolvePath("src/app/dialogs/similarities/similarities.controller.js"),
	resolvePath("src/app/dialogs/settings/settings.controller.js")
];
const appStyleSheetsBuildPath = resolvePath("build/style.min.css");
const appStyleSheets = [
	resolvePath("src/css/style.css"),
	resolvePath("src/app/pages/details/details.view.css"),
	resolvePath("src/app/pages/create/create.view.css"),
	resolvePath("src/app/pages/account/account.view.css"),
	resolvePath("src/app/pages/collection/collection.view.css"),
	resolvePath("src/app/pages/creator/creator.view.css"),
	resolvePath("src/app/pages/owner/owner.view.css"),
	resolvePath("src/app/pages/search/search.view.css"),
	resolvePath("src/app/pages/home/home.view.css"),
	resolvePath("src/app/pages/start/start.view.css"),
	resolvePath("src/app/pages/terms/terms.view.css"),
	resolvePath("src/app/shared/header/header.view.css"),
	resolvePath("src/app/shared/footer/footer.view.css"),
	resolvePath("src/app/shared/accounticon/accounticon.view.css"),
	resolvePath("src/app/shared/pixelcon/pixelcon.view.css"),
	resolvePath("src/app/shared/pixelconcard/pixelconcard.view.css"),
	resolvePath("src/app/dialogs/pixelcon/pixelcon.view.css"),
	resolvePath("src/app/dialogs/collection/collection.view.css"),
	resolvePath("src/app/dialogs/send/send.view.css"),
	resolvePath("src/app/dialogs/similarities/similarities.view.css"),
	resolvePath("src/app/dialogs/settings/settings.view.css")
];
const appHTMLBuildPath = resolvePath("build/templates");
const appHTML = [
	resolvePath("src/app/pages/home/home.view.html"),
	resolvePath("src/app/pages/details/details.view.html"),
	resolvePath("src/app/pages/collection/collection.view.html"),
	resolvePath("src/app/pages/creator/creator.view.html"),
	resolvePath("src/app/pages/owner/owner.view.html"),
	resolvePath("src/app/pages/search/search.view.html"),
	resolvePath("src/app/pages/account/account.view.html"),
	resolvePath("src/app/pages/create/create.view.html"),
	resolvePath("src/app/pages/start/start.view.html"),
	resolvePath("src/app/pages/terms/terms.view.html"),
	resolvePath("src/app/shared/footer/footer.view.html"),
	resolvePath("src/app/shared/header/header.view.html"),
	resolvePath("src/app/shared/pixelcon/pixelcon.view.html"),
	resolvePath("src/app/shared/pixelconcard/pixelconcard.view.html"),
	resolvePath("src/app/shared/accounticon/accounticon.view.html"),
	resolvePath("src/app/dialogs/collection/collection.view.html"),
	resolvePath("src/app/dialogs/pixelcon/pixelcon.view.html"),
	resolvePath("src/app/dialogs/send/send.view.html"),
	resolvePath("src/app/dialogs/similarities/similarities.view.html"),
	resolvePath("src/app/dialogs/settings/settings.view.html")
];
const appContractsBuildPath = resolvePath("build/contracts");
const appContracts = [
	resolvePath("contracts/deploy/deployments.json"),
	resolvePath("artifacts/contracts/PixelCons.sol/PixelCons.json")
];

// Start/Build Sequence
if (require.main === module) {
	const args = process.argv.slice(2);
	const watchMode = args.indexOf('-watch') > -1;
	(async function () {
		try {
			//build
			await build(watchMode);
			
		} catch (err) {
			console.log('Failed to build...');
			console.log(err);
		}
	})();
}

// Build Steps
async function build(watchMode) {
	//build
	await startBuildProcess();
	
	//start watching for changes
	if(watchMode) {
		console.log('');
		console.log('Watching for changes...');
		var doBuild = false;
		var doCopyContracts = false;
		watch(appSourcePath, { recursive: true }, function (evt, name) {
			doBuild = true;
		});
		watch(resolvePath(""), { recursive: true }, function (evt, name) {
			for (let i = 0; i < appContracts.length; i++) {
				if (name == appContracts[i]) {
					doCopyContracts = true;
				}
			}
		});
		
		//check if build flags were set at regular intervals
		async function checkForBuild() {
			if (doBuild) {
				console.log('');
				console.log("Source files changed");
				doBuild = false;
				await startBuildProcess();
				
			} else if (doCopyContracts) {
				console.log('');
				console.log("Contract files changed");
				doCopyContracts = false;
				await copyContracts();
				console.log('Build complete!');
			}
		}
		setInterval(checkForBuild, 2000);
	}
}
async function startBuildProcess() {
	console.log('Starting build');

	//ensure build directories exist
	if (!fs.existsSync(appBuildPath)) fs.mkdirSync(appBuildPath);
	if (!fs.existsSync(appHTMLBuildPath)) fs.mkdirSync(appHTMLBuildPath);
	if (!fs.existsSync(appContractsBuildPath)) fs.mkdirSync(appContractsBuildPath);

	//copy over the minified index.html
	copyFileSync(appMinifiedIndex, appBuildPath, 'index.html');

	//run build steps in parallel
	await Promise.all([minifyScripts(), minifyStyleSheets(), minifyHTML(), copyImages(), copyLibraries(), copyData(), copyContracts()]);
	console.log('Build complete!');
}
function minifyScripts() {
	console.log("Minifying scripts...");
	return new Promise(function (resolve, reject) {
		let filePromises = [];
		for (let i = 0; i < appScripts.length; i++) filePromises.push(readFilePromise(appScripts[i]));
		Promise.all(filePromises).then(function (results) {
			let code = {};
			for (let i = 0; i < results.length; i++) code[results[i].file] = results[i].data;

			let uglified = uglifyjs.minify(code);
			fs.writeFile(appScriptBuildPath, uglified.code, function (err) {
				if (err) {
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
	return new Promise(function (resolve, reject) {

		let uglified = uglifycss.processFiles(appStyleSheets);
		fs.writeFile(appStyleSheetsBuildPath, uglified, function (err) {
			if (err) {
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
	return new Promise(function (resolve, reject) {

		let filePromises = [];
		for (let i = 0; i < appHTML.length; i++) filePromises.push(readFilePromise(appHTML[i]));
		Promise.all(filePromises).then(function (results) {
			try {
				let fileWritePromises = [];
				for (let r = 0; r < results.length; r++) {
					let file = results[r].file;
					let pDir = path.dirname(path.join(file, '..'));
					let ppDir = path.dirname(path.join(file, '..', '..'));
					let copyFile = path.join(appHTMLBuildPath, pDir.substring(ppDir.length, pDir.length) + '_' + path.basename(file));
					let uglified = uglifyhtml.minify(results[r].data, { collapseWhitespace: true, preserveLineBreaks: true, removeComments: true });
					fileWritePromises.push(writeFilePromise(copyFile, uglified));
				}
				Promise.all(fileWritePromises).then(function (results) {
					resolve({});
				}, function () {
					console.log("Failed to minify style sheets!");
					reject(err);
				});
			} catch (err) {
				console.log("Failed to minifying html templates!");
				reject(err);
			}

		});

	});
}
function copyImages() {
	console.log("Copying images...");
	return new Promise(function (resolve, reject) {
		try {
			copyFolderRecursiveSync(appImagesPath, appBuildPath);
			resolve({});
		} catch (err) {
			console.log("Failed to copy images!");
			reject(err);
		}
	});
}
function copyLibraries() {
	console.log("Copying libraries...");
	return new Promise(function (resolve, reject) {
		try {
			copyFolderRecursiveSync(appLibrariesPath, appBuildPath);
			resolve({});
		} catch (err) {
			console.log("Failed to copy libraries!");
			reject(err);
		}
	});
}
function copyData() {
	console.log("Copying data...");
	return new Promise(function (resolve, reject) {
		try {
			copyFolderRecursiveSync(appDataPath, appBuildPath);
			resolve({});
		} catch (err) {
			console.log("Failed to copy app data!");
			reject(err);
		}
	});
}
function copyContracts() {
	console.log("Copying contracts...");
	return new Promise(function (resolve, reject) {
		try {
			for (let i = 0; i < appContracts.length; i++) {
				if (fs.existsSync(appContracts[i])) copyFileSync(appContracts[i], appContractsBuildPath);
			}
			resolve({});
		} catch (err) {
			console.log("Failed to copy contracts!");
			reject(err);
		}
	});
}

// Utils
function resolvePath(p) {
	let paths = [path.join(__dirname, '..')];
	paths = paths.concat(p.split('/'));
	return path.join.apply(null, paths);
}
function readFilePromise(file) {
	return new Promise(function (resolve, reject) {
		fs.readFile(file, "utf8", function (err, data) {
			if (err) reject(err);
			else resolve({ file: file, data: data });
		});
	});
}
function writeFilePromise(file, data) {
	return new Promise(function (resolve, reject) {
		fs.writeFile(file, data, function (err) {
			if (err) reject(err);
			else resolve({ file: file });
		});
	});
}
function copyFileSync(source, target, newFilename) {
	let targetFile = target;

	//if target is a directory a new file with the same name will be created
	if (fs.existsSync(target)) {
		if (fs.lstatSync(target).isDirectory()) {
			if(newFilename) targetFile = path.join(target, newFilename);
			else targetFile = path.join(target, path.basename(source));
		}
	}

	fs.writeFileSync(targetFile, fs.readFileSync(source));
}
function copyFolderRecursiveSync(source, target) {
	let files = [];

	//check if folder needs to be created or integrated
	let targetFolder = path.join(target, path.basename(source));
	if (!fs.existsSync(targetFolder)) {
		fs.mkdirSync(targetFolder);
	}

	//copy
	if (fs.lstatSync(source).isDirectory()) {
		files = fs.readdirSync(source);
		files.forEach(function (file) {
			let curSource = path.join(source, file);
			if (fs.lstatSync(curSource).isDirectory()) {
				copyFolderRecursiveSync(curSource, targetFolder);
			} else {
				copyFileSync(curSource, targetFolder);
			}
		});
	}
}

// Export functions
module.exports = {
    build: build,
	appBuildPath: appBuildPath,
	appSourcePath: appSourcePath,
	appMinifiedIndex: appMinifiedIndex,
	appImagesPath: appImagesPath,
	appLibrariesPath: appLibrariesPath,
	appDataPath: appDataPath,
	appScriptBuildPath: appScriptBuildPath,
	appScripts: appScripts,
	appStyleSheetsBuildPath: appStyleSheetsBuildPath,
	appStyleSheets: appStyleSheets,
	appHTMLBuildPath: appHTMLBuildPath,
	appHTML: appHTML,
	appContractsBuildPath: appContractsBuildPath,
	appContracts: appContracts
}
