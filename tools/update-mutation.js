/*
 * Return the value with the "version" value from
 * https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=634242
 * as seen on https://greasyfork.org/en/scripts/28721-mutations page
 * => [ 634242 ]
 */
"use strict";

async function getVersion() {
	const response = await fetch("https://greasyfork.org/en/scripts/28721-mutations");
	const text = await response.text();
	const matches = text.match(/\?version=(\d+)/);
	return matches ? matches[1] : null;
}

const regexp = /mutations.js\?version=\d+/;

const replace = (content, currentVersion) => {
	const replacement = `mutations.js?version=${currentVersion}`;
	if (!content.includes(replacement)) {
		return {
			content: content.replace(regexp, replacement),
			updated: true
		};
	}
	return {content, updated: false};
};

module.exports = {
	getVersion,
	regexp,
	replace
};
