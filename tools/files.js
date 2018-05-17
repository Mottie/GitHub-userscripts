"use strict";

const fs = require("fs");

function getUserscriptsInFolder() {
	return new Promise((resolve, reject) => {
		fs.readdir("./", (err, files) => {
			if (err) {
				console.log(`Error reading root folder`, err);
				reject(err);
			}
			resolve(files.filter(file => file.endsWith("user.js")));
		});
	});
}

function readFile(name) {
	return new Promise((resolve, reject) => {
		fs.readFile(name, "utf8", (err, data) => {
			if (err) {
				return reject(err);
			}
			resolve(data);
		});
	});
}

function writeFile(name, obj) {
	return new Promise((resolve, reject) => {
		fs.writeFile(name, obj, "utf8", err => {
			if (err) {
				console.log(`Error writing ${name}`, err);
				return reject();
			}
			resolve();
		});
	});
}

module.exports = {
	getUserscriptsInFolder,
	readFile,
	writeFile
};
