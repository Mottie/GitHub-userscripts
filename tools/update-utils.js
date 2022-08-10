/*
 * Return the value with the "version" value from
 * https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=1079637
 * as seen on https://greasyfork.org/en/scripts/398877-utils-js page
 * => [ 1079637 ]
 */
"use strict";

async function getVersion() {
	const response = await fetch("https://greasyfork.org/en/scripts/398877-utils-js");
	const text = await response.text();
	const matches = text.match(/\?version=(\d+)/);
	return matches ? matches[1] : null;
}

const regexp = /utilsjs.js\?version=\d+/;

const replace = (content, currentVersion) => {
	const replacement = `utilsjs.js?version=${currentVersion}`;
	if (!content.includes(replacement)) {
		return {
			content: content.replace(regexp, replacement),
			updated: true
		};
	}
	return {content, updated: false};
}

module.exports = {
	getVersion,
	regexp,
	replace
};
