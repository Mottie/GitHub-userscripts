// ==UserScript==
// @name          GitHub Indent Comment Blocks
// @version       1.0.0
// @description   A userscript that allows you to indent & outdent blocks in the comment editor
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @include       https://gist.github.com/*
// @run-at        document-idle
// @grant         GM_addStyle
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_registerMenuCommand
// @connect       github.com
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-indent-comments.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-indent-comments.user.js
// ==/UserScript==
/* global GM_addStyle, GM_getValue, GM_setValue, GM_registerMenuCommand */
/* jshint unused:true, esnext:true */
(function() {
	"use strict";

	let timer,
		busy = false,

		spaceSize = GM_getValue('space-size', 2);

	const icons = {
		indent: `
			<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16">
				<path d="M12 13c0 .6 0 1-.9 1H.9c-.9 0-.9-.4-.9-1s0-1 .9-1h10.2c.88 0 .88.4.88 1zM.92 4h10.2C12 4 12 3.6 12 3s0-1-.9-1H.92c-.9 0-.9.4-.9 1s0 1 .9 1zM11.5 7h-5C6 7 6 7.4 6 8s0 1 .5 1h5c.5 0 .5-.4.5-1s0-1-.5-1zm-7 1L0 5v6z"/>
			</svg>`,
		outdent: `
			<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16">
				<path d="M12 13c0 .6 0 1-.9 1H.9c-.9 0-.9-.4-.9-1s0-1 .9-1h10.2c.88 0 .88.4.88 1zM.92 4h10.2C12 4 12 3.6 12 3s0-1-.9-1H.92c-.9 0-.9.4-.9 1s0 1 .9 1zm10.7 3H6.4c-.46 0-.4.4-.4 1s-.06 1 .4 1h5.2c.47 0 .4-.4.4-1s.07-1-.4-1zM0 8l4.5-3v6z"/>
			</svg>`
	};

	GM_addStyle(".ghio-in-outdent * { pointer-events:none; }");

	// Add indent & outdent buttons
	function addButtons() {
		busy = true;
		createButton("Outdent");
		createButton("Indent");
		busy = false;
	}

	function createButton(name) {
		const toolbars = $$(".toolbar-commenting"),
			nam = name.toLowerCase(),
			button = document.createElement("button");
		let el,
			indx = toolbars.length;
		if (indx) {
			button.type = "button";
			button.className = `ghio-${nam.toLowerCase()} ghio-in-outdent toolbar-item tooltipped tooltipped-n`;
			button.setAttribute("aria-label", `${name} Selected Text`);
			button.setAttribute("tabindex", "-1");
			button.innerHTML = icons[nam.toLowerCase()];
			while (indx--) {
				el = toolbars[indx];
				if (!$(`.ghio-${nam.toLowerCase()}`, el)) {
					el.insertBefore(button.cloneNode(true), el.childNodes[0]);
				}
			}
		}
	}

	function indent(text) {
		let result = [],
			block = new Array(parseInt(spaceSize, 10) + 1).join(" ");
		(text || "").split(/\r*\n/).forEach(line => {
			result.push(block + line);
		});
		return result.join("\n");
	}

	function outdent(text) {
		let regex = new RegExp(`^\\s{0,${spaceSize}}`),
			result = [];
		(text || "").split(/\r*\n/).forEach(line => {
			result.push(line.replace(regex, ""));
		});
		return result.join("\n");
	}

	function addBindings() {
		$("body").addEventListener("click", function(event) {
			let textarea,
				target = event.target;
			if (target && target.classList.contains("ghio-in-outdent")) {
				textarea = closest(".previewable-comment-form", target);
				textarea = $(".comment-form-textarea", textarea);
				textarea.focus();
				setTimeout(() => {
					surroundSelectedText(
						textarea,
						target.classList.contains("ghio-indent") ? "indent" : "outdent"
					);
				}, 100);
				return false;
			}
		});
		// Add Tab & Shift + Tab
		$("body").addEventListener("keydown", function(event) {
			if (event.key === "Tab") {
				let target = event.target;
				if (target && target.classList.contains("comment-form-textarea")) {
					event.preventDefault();
					target.focus();
					setTimeout(() => {
						surroundSelectedText(
							target,
							// shift + tab = outdent
							event.getModifierState("Shift") ? "outdent" : "indent"
						);
					}, 100);
				}
			}
		});
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}
	function $$(selector, el) {
		return Array.from((el || document).querySelectorAll(selector));
	}
	function closest(selector, el) {
		while (el && el.nodeType === 1) {
			if (el.matches(selector)) {
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	// Add GM options
	GM_registerMenuCommand(
		"Indent or outdent size",
		() => {
			const spaces = GM_getValue("indentOutdentSize", "2");
			let val = prompt("Enter number of spaces to indent or outdent:", spaces);
			if (val !== null && typeof val === "string") {
				val =
				spaceSize = val;
				GM_setValue('space-size', val);
			}
		}
	);

	$$("#js-repo-pjax-container, #js-pjax-container, .js-preview-body").forEach(target => {
		new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				let mtarget = mutation.target;
				// preform checks before adding code wrap to minimize function calls
				// update after comments are edited
				if (mtarget === target || mtarget.matches(".js-comment-body, .js-preview-body")) {
					clearTimeout(timer);
					setTimeout(() => {
						if (!busy) {
							addButtons();
						}
					}, 100);
				}
			});
		}).observe(target, {
			childList: true,
			subtree: true
		});
	});

	addBindings();
	addButtons();

	/*eslint-disable */
	/* HEAVILY MODIFIED from https://github.com/timdown/rangyinputs
	 code was unwrapped & unneeded code was removed
	*/
	/**
	* @license Rangy Inputs, a jQuery plug-in for selection and caret manipulation within textareas and text inputs.
	*
	* https://github.com/timdown/rangyinputs
	*
	* For range and selection features for contenteditable, see Rangy.
	* http://code.google.com/p/rangy/
	*
	* Depends on jQuery 1.0 or later.
	*
	* Copyright 2014, Tim Down
	* Licensed under the MIT license.
	* Version: 1.2.0
	* Build date: 30 November 2014
	*/
	var UNDEF = "undefined";
	var getSelection, setSelection, surroundSelectedText;

	// Trio of isHost* functions taken from Peter Michaux's article:
	// http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
	function isHostMethod(object, property) {
		var t = typeof object[property];
		return t === "function" || (!!(t == "object" && object[property])) || t == "unknown";
	}
	function isHostProperty(object, property) {
		return typeof(object[property]) != UNDEF;
	}
	function isHostObject(object, property) {
		return !!(typeof(object[property]) == "object" && object[property]);
	}
	function fail(reason) {
		if (window.console && window.console.log) {
			window.console.log("RangyInputs not supported in your browser. Reason: " + reason);
		}
	}

	function adjustOffsets(el, start, end) {
		if (start < 0) {
			start += el.value.length;
		}
		if (typeof end == UNDEF) {
			end = start;
		}
		if (end < 0) {
			end += el.value.length;
		}
		return { start: start, end: end };
	}

	function makeSelection(el, start, end) {
		return {
			start: start,
			end: end,
			length: end - start,
			text: el.value.slice(start, end)
		};
	}

	function getBody() {
		return isHostObject(document, "body") ? document.body : document.getElementsByTagName("body")[0];
	}

	var testTextArea = document.createElement("textarea");
	getBody().appendChild(testTextArea);

	if (isHostProperty(testTextArea, "selectionStart") && isHostProperty(testTextArea, "selectionEnd")) {
		getSelection = function(el) {
			var start = el.selectionStart, end = el.selectionEnd;
			return makeSelection(el, start, end);
		};

		setSelection = function(el, startOffset, endOffset) {
			var offsets = adjustOffsets(el, startOffset, endOffset);
			el.selectionStart = offsets.start;
			el.selectionEnd = offsets.end;
		};
	} else if (isHostMethod(testTextArea, "createTextRange") && isHostObject(document, "selection") &&
		isHostMethod(document.selection, "createRange")) {

		getSelection = function(el) {
			var start = 0, end = 0, normalizedValue, textInputRange, len, endRange;
			var range = document.selection.createRange();

			if (range && range.parentElement() == el) {
				len = el.value.length;

				normalizedValue = el.value.replace(/\r\n/g, "\n");
				textInputRange = el.createTextRange();
				textInputRange.moveToBookmark(range.getBookmark());
				endRange = el.createTextRange();
				endRange.collapse(false);
				if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
					start = end = len;
				} else {
					start = -textInputRange.moveStart("character", -len);
					start += normalizedValue.slice(0, start).split("\n").length - 1;
					if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
						end = len;
					} else {
						end = -textInputRange.moveEnd("character", -len);
						end += normalizedValue.slice(0, end).split("\n").length - 1;
					}
				}
			}

			return makeSelection(el, start, end);
		};

		// Moving across a line break only counts as moving one character in a TextRange, whereas a line break in
		// the textarea value is two characters. This function corrects for that by converting a text offset into a
		// range character offset by subtracting one character for every line break in the textarea prior to the
		// offset
		var offsetToRangeCharacterMove = function(el, offset) {
			return offset - (el.value.slice(0, offset).split("\r\n").length - 1);
		};

		setSelection = function(el, startOffset, endOffset) {
			var offsets = adjustOffsets(el, startOffset, endOffset);
			var range = el.createTextRange();
			var startCharMove = offsetToRangeCharacterMove(el, offsets.start);
			range.collapse(true);
			if (offsets.start == offsets.end) {
				range.move("character", startCharMove);
			} else {
				range.moveEnd("character", offsetToRangeCharacterMove(el, offsets.end));
				range.moveStart("character", startCharMove);
			}
			range.select();
		};
	} else {
		getBody().removeChild(testTextArea);
		fail("No means of finding text input caret position");
		return;
	}
	// Clean up
	getBody().removeChild(testTextArea);

	function getValueAfterPaste(el, text) {
		var val = el.value, sel = getSelection(el), selStart = sel.start;
		return {
			value: val.slice(0, selStart) + text + val.slice(sel.end),
			index: selStart,
			replaced: sel.text
		};
	}

	function pasteTextWithCommand(el, text) {
		el.focus();
		var sel = getSelection(el);

		// Hack to work around incorrect delete command when deleting the last word on a line
		setSelection(el, sel.start, sel.end);
		if (text === "") {
			document.execCommand("delete", false, null);
		} else {
			document.execCommand("insertText", false, text);
		}

		return {
			replaced: sel.text,
			index: sel.start
		};
	}

	function pasteTextWithValueChange(el, text) {
		el.focus();
		var valueAfterPaste = getValueAfterPaste(el, text);
		el.value = valueAfterPaste.value;
		return valueAfterPaste;
	}

	var pasteText = function(el, text) {
		var valueAfterPaste = getValueAfterPaste(el, text);
		try {
			var pasteInfo = pasteTextWithCommand(el, text);
			if (el.value == valueAfterPaste.value) {
				pasteText = pasteTextWithCommand;
				return pasteInfo;
			}
		} catch (ex) {
			// Do nothing and fall back to changing the value manually
		}
		pasteText = pasteTextWithValueChange;
		el.value = valueAfterPaste.value;
		return valueAfterPaste;
	};

	var updateSelectionAfterInsert = function(el, startIndex, text, selectionBehaviour) {
		var endIndex = startIndex + text.length;

		selectionBehaviour = (typeof selectionBehaviour == "string") ?
		selectionBehaviour.toLowerCase() : "";

		if ((selectionBehaviour == "collapsetoend" || selectionBehaviour == "select") && /[\r\n]/.test(text)) {
			// Find the length of the actual text inserted, which could vary
			// depending on how the browser deals with line breaks
			var normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
			endIndex = startIndex + normalizedText.length;
			var firstLineBreakIndex = startIndex + normalizedText.indexOf("\n");

			if (el.value.slice(firstLineBreakIndex, firstLineBreakIndex + 2) == "\r\n") {
				// Browser uses \r\n, so we need to account for extra \r characters
				endIndex += normalizedText.match(/\n/g).length;
			}
		}

		switch (selectionBehaviour) {
			case "collapsetostart":
				setSelection(el, startIndex, startIndex);
				break;
			case "collapsetoend":
				setSelection(el, endIndex, endIndex);
				break;
			case "select":
				setSelection(el, startIndex, endIndex);
				break;
		}
	};

	surroundSelectedText = function(el, type, selectionBehaviour) {
		let sel = getSelection(el),
			result = type === "indent" ? indent(sel.text) : outdent(sel.text),
			pasteInfo = pasteText(el, result);
		updateSelectionAfterInsert(el, pasteInfo.index, result, selectionBehaviour || "select");
	};
	/*eslint-enable */

})();
