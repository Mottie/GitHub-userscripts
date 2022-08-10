/* global require */
"use strict";

const { getUserscriptsInFolder, readFile, writeFile } = require("./files");
const mutations = require("./update-mutation");
const utils = require("./update-utils");
const getXrefs = require("./get-xrefs");

let processes = [
	mutations,
	utils
];

let usXref;
const updatedList = [];

const regexpPatch = /(@version\s+)([\d.]+)/;
const regexpName = /(@name\s+)([\w ]+)/;
const today = (new Date()).toISOString().substring(0, 10).replace(/-/g, ".");

function updateFile(name) {
	return new Promise((resolve, reject) => {
		readFile("./" + name)
			.then(data => {
				let wasUpdated = false;
				let content = data;
				processes.forEach(process => {
					if (process.regexp.test(content)) {
						const result = process.replace(content, process.version);
						if (result.updated) {
							content = result.content;
							wasUpdated = true;
						}
					}
				});
				if (wasUpdated) {
					// Only update userscript patch if the file version was modified
					content = updatePatch(content);
					updatedList.push(content.match(regexpName)[2]);
					return writeFile(name, content).then(resolve);
				}
				resolve();
			})
			.catch(err => {
				reject(err);
				exit(err);
			});
	});
}

function updatePatch(data) {
	// @version x.x.0 => @version x.x.1
	let [major, minor, patch] = data.match(regexpPatch)[2].split(".");
	return data.replace(
		regexpPatch,
		`$1${major}.${minor}.${parseInt(patch, 10) + 1}`
	);
}

function updateEntry({readme, name}) {
	if (!usXref[name]) {
		console.log(`Missing cross-reference for file "${name}"`);
	} else {
		// Find [{xref}-ou] in OpenUserJS column
		const txt = `[${usXref[name]}-ou] | `;
		// Index at created column date + 13 (start of Updated column)
		const indx = readme.indexOf(txt) + txt.length + 13;
		readme = readme.substring(0, indx) +
			today +
			readme.substring(indx + today.length);
	}
	return readme;
}

function updateReadme() {
	return readFile("./README.md")
		.then(readme => new Promise((resolve, reject) => {
			if (!updatedList.length || !readme) {
				reject();
			}
			updatedList.forEach(name => {
				readme = updateEntry({readme, name: name.toLowerCase()});
			});
			resolve(readme);
		}))
		.then(readme => writeFile("./README.md", readme))
		.catch(exit)
}

function processUserscripts(list) {
	return Promise.all(list.map(file => updateFile(file)))
		.then(() => console.log("\x1b[32m%s\x1b[0m", "Require URLs updated"))
		.then(updateReadme)
		.then(() => console.log("\x1b[32m%s\x1b[0m", "Readme updated"));
}

function exit(err) {
	if (err) {
		console.error(err);
	}
	process.exit(err ? 1 : 0);
}

Promise.all([
	getUserscriptsInFolder(),
	getXrefs(),
	...processes.map(process => process.getVersion()),
]).then(([list, xrefs, ...versions]) => {
	usXref = xrefs;
	processes = processes.map((process, index) => {
		process.version = versions[index];
		return process;
	});
	return processUserscripts(list);
}).catch(exit);
