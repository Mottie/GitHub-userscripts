/*
 * Return the value with the "version" value from
 * https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=634242
 * as seen on https://greasyfork.org/en/scripts/28721-mutations page
 * => [ 634242 ]
 */
"use strict";

const fetch = require("make-fetch-happen");

async function getVersion() {
	const response = await fetch("https://greasyfork.org/en/scripts/28721-mutations");
	const text = await response.text();
	const matches = text.match(/\?version=(\d+)/);
	return matches ? matches[1] : null;
}

module.exports = getVersion;
