/* global require */
"use strict";

const reservedNames = JSON.stringify(require("github-reserved-names").all),
	reservedNamesVersion = require("../node_modules/github-reserved-names/package.json"),

	{
		readFile,
		writeFile
	} = require("./files");

function cleanupNames() {
	return reservedNames
		.substring(1, reservedNames.length - 1)
		.replace(/,/g, ", ")
		// wrap reserved name list to keep it readable
		// https://rosettacode.org/wiki/Word_wrap#Simple_regex
		.match(/.{1,70}(\s|$)/g)
		.join("\n\t\t\t");
}

function updateReservedNames(data) {
	return data.replace(
		/\/\*\sBUILD:RESERVED-NAMES-START[^/]+\/[\s\S]+\/\*\sBUILD:RESERVED-NAMES-END\s\*\//,
		`/* BUILD:RESERVED-NAMES-START (v${reservedNamesVersion.version}) */
			${cleanupNames()}
			/* BUILD:RESERVED-NAMES-END */`
	);
}

readFile("github-custom-hotkeys.user.js")
	.then(data => updateReservedNames(data))
	.then(data => writeFile("github-custom-hotkeys.user.js", data))
	.then(() => console.log("\x1b[32m%s\x1b[0m", "Reserved names updated"));
