/*
 * Return cross-reference from readme:
 * "Userscript @name" : "README 3 letter designation";
 * Example, given this table entry "| [GitHub code colors][ccr-wiki] |"
 * extract the userscript name ("GitHub code colors") & letter designation ("ccr")
 */
"use strict";

const {readFile} = require("./files");

async function getXrefs() {
	const readme = await readFile("./README.md");
	const matches = readme.match(/\[((?:GitHub|Gist)[^\]]+)\]\[(\w+)-wiki\]/g);
	return matches.length ? matches.reduce((acc, match) => {
		const [name, abbr] = match
			.substring(1, match.length - 1)
			.toLowerCase()
			.replace("-wiki", "")
			.split("][");
		acc[name] = abbr;
		return acc;
	}, {}) : {};
}

module.exports = getXrefs;
