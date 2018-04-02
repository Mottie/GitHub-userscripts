"use strict";

const fs = require("fs");

function readFile(name) {
	return new Promise((resolve, reject) => {
		fs.readFile(name, "utf8", (err, file) => {
			if (err) {
				return reject(err);
			}
			resolve(file);
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
	readFile,
	writeFile
};
