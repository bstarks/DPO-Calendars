/*jshint esversion: 6 */
//

// REMOVE: tmp for lint
var window = window,
	document = document,
	require = require,
	alert = alert,
	console = console,
	global = global;

/*
	TODO:
		1) Remove above vars.
		2) Move index.js to Node.js back end and off of page. This requires reinstating template files?
		3) 
*/

var app = (function (window, document, require, console, alert, app) {
	'use strict';
	var fs = require('fs-extra');

	app.dir.app = global.__dirname;
	app.dir.base = app.dir.app.substr(0, app.dir.app.lastIndexOf('\\'));
	app.dir.project = `${app.dir.base}\\3.0.0`;
	app.dir.src = `${app.dir.project}\\src`;
	app.dir.dest = `${app.dir.project}\\dest`;
	app.file.dest_udcCal_html = `${app.dir.dest}\\udcCal.html`;
	app.file.dest_udcCal_js = `${app.dir.dest}\\udcCal.js`;
	app.file.dest_udcCal_css = `${app.dir.dest}\\udcCal.css`;
	app.file.dest_udcCal_singleFile_html = `${app.dir.dest}\\udcCal_singleFile.html`;
	app.file.src_udcCal_html = `${app.dir.src}\\udcCal.html`;
	app.file.src_udcCal_js = `${app.dir.src}\\udcCal.js`;
	app.file.src_udcCal_css = `${app.dir.src}\\udcCal.css`;
	//app.file.dest_udcCal_css = `${app.dir.project}\\udcCal.css`;
	//app.file.dest_udcCal_css = `${app.dir.project}\\udcCal.css`;




	function saveFile(filePathName, content, callback) {
		function generalSaveCallback(err) {
			if (err) {
				console.error(err);
				alert(`Could not write to file:\n\t${filePathName}\n\n${err.toString()}`);
			}
			console.log(`Saved file: ${filePathName}`);
			if (callback) callback();
		}
		if (/\.json$/gi.test(filePathName)) fs.writeJson(filePathName, content, generalSaveCallback);
		else fs.writeFile(filePathName, content, generalSaveCallback);
	}

	function saveEditedContentSection() {
		saveFile(`${app.dir.current}\\${app.page.current.file}`, document.getElementById(app.id.contentArea).innerHTML);
	}

	function readFile(filePath, callback) {
		function callbackHereForGenericFail(err, result) {
			if (err) {
				console.error(err);
				return false;
			}
			return callback(result);
		}
		fs.readFile(filePath, app.file.txtFormat, callbackHereForGenericFail);
	}

	function createSingleFileHtml() {
		var htmlFile,
			jsFile,
			cssFile;

		function mergeFiles() {
			htmlFile = htmlFile.replace(/\s*\<link rel\=\"stylesheet\" href\=\"udcCal\.css\" \/\>/gi, `<style>\n${cssFile}\n</style>`);
			htmlFile = htmlFile.replace(/\s*\<script src\=\"udcCal\.js\"\>\<\/script\>/gi, `<script>\n${jsFile}\n</script>`);
			saveFile(app.file.dest_udcCal_singleFile_html, htmlFile);
		}

		function checkIfReadyToMerge() {
			if (htmlFile && jsFile && cssFile) mergeFiles();
		}
		
		readFile(app.file.src_udcCal_html, html => {
			htmlFile = html;
			checkIfReadyToMerge();
		});

		readFile(app.file.src_udcCal_js, html => {
			jsFile = html;
			checkIfReadyToMerge();
		});

		readFile(app.file.src_udcCal_css, html => {
			cssFile = html;
			checkIfReadyToMerge();
		});
	}

	function init() {
		createSingleFileHtml();
	}
	
	init();
	return app;
}(window, document, require, console, alert, {'dir': {}, 'file': {}, 'id': {}, 'page': {}}));
