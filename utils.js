/* GitHub userscript utilities v0.2.0
 * Copyright © 2021 Rob Garrison
 * License: MIT
 */
/* exported
 * $ $$
 * addClass removeClass toggleClass
 * removeEls removeSelection
 * on off make
 * debounce
 */
"use strict";

const REGEX = {
	WHITESPACE: /\s+/,
	NAMESPACE: /[.:]/,
	COMMA: /\s*,\s*/
};

/* DOM utilities */
/**
 * Find & return a single DOM node
 * @param {String} selector - CSS selector string
 * @param {HTMLElement} el - DOM node to start the query (defaults to document)
 * @returns {HTMLElement|null}
 */
const $ = (selector, el) => (el || document).querySelector(selector);

/**
 * Find & return multiple DOM nodes
 * @param {String} selector - CSS selector string
 * @param {HTMLElement} el - DOM node to start the query (defaults to document) 
 * @returns {HTMLElement[]}
 */
const $$ = (selector, el) => [...(el || document).querySelectorAll(selector)];

/**
 * Common functions
 */
const _ = {};
/**
* Return an array of elements
* @param {HTMLElement|HTMLElement[]|NodeList} elements 
* @returns {HTMLElement[]}
*/
_.createElementArray = elements => {
	if (Array.isArray(elements)) {
		return elements;
	}
	return elements instanceof NodeList ? [...elements] : [elements];
};
/**
* Common event listener code
* @param {String} type - "add" or "remove" event listener
* @param {HTMLElement[]} els - DOM node array that need listeners
* @param {String} name - Event name, e.g. "click", "mouseover", etc
* @param {Function} handler - Event callback
* @param {Object} options - Event listener options or useCapture - see
*   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
*/
_.eventListener = (type, els, name, handler, options) => {
	const events = name.split(REGEX.WHITESPACE);
	_.createElementArray(els).forEach(el => {
		events.forEach(ev => {
			el?.[`${type}EventListener`](ev, handler, options);
		});
	});
};
/**
* Create an array of classes/event types from a space or comma separated string
* @param {String} classes - space or comma separated list of classes or events
* @returns {String[]}
*/
_.getClasses = classes => {
	if (Array.isArray(classes)) {
		return classes;
	}
	const names = classes.toString();
	return names.includes(",") ? names.split(REGEX.COMMA) : [names];
};

/**
 * Add class name(s) to one or more elements
 * @param {HTMLElements[]|Nodelist|HTMLElement|Node} elements 
 * @param {string|array} classes - class name(s) to add; string can contain a
 *  comma separated list
 */
const addClass = (elements, classes) => {
	const classNames = _.getClasses(classes);
	const els = _.createElementArray(elements);
	let index = els.length;
	while (index--) {
		els[index]?.classList.add(...classNames);
	}
};

/**
 * Remove class name(s) from one or more elements
 * @param {HTMLElements[]|NodeList|HTMLElement|Node} elements
 * @param {string|array} classes - class name(s) to add; string can contain a
 *  comma separated list
 */
const removeClass = (elements, classes) => {
	const classNames = _.getClasses(classes);
	const els = _.createElementArray(elements);
	let index = els.length;
	while (index--) {
		els[index]?.classList.remove(...classNames);
	}
};

/**
 * Toggle class name of DOM element(s)
 * @param {HTMLElement|HTMLElement[]|NodeList} els 
 * @param {string} name - class name to toggle (toggle only accepts one name)
 * @param {boolean} flag - force toggle; true = add class, false = remove class;
 *  if undefined, the class will be toggled based on the element's class name
 */
// flag = true, then add class
const toggleClass = (elements, className, flag) => {
	const els = _.createElementArray(elements);
	let index = elms.length;
	while (index--) {
		els[index]?.classList.toggle(className, flag);
	}
};

/**
 * Remove DOM nodes
 * @param {String} selector - CSS selector string
 * @param {HTMLElement|undefined} el - parent DOM node (defaults to document)
 */
const removeEls = (selector, el) => {
	let els = $$(selector, el);
	let index = els.length;
	while (index--) {
		els[index].parentNode.removeChild(els[index]);
	}
};

/**
 * Remove text selection
 */
const removeSelection = () => {
	// remove text selection - https://stackoverflow.com/a/3171348/145346
	const sel = window.getSelection
		? window.getSelection()
		: document.selection;
	if (sel) {
		if (sel.removeAllRanges) {
			sel.removeAllRanges();
		} else if (sel.empty) {
			sel.empty();
		}
	}
};

/**
 * Add/remove event listener
 * @param {HTMLElement|HTMLElement[]|NodeList} els
 * @param {string} name - event name(s) to bind, e.g. "mouseup mousedown"; also
 *   accpets a comma separated string, e.g. "mouseup, mousedown"
 * @param {function} handler - event handler
 * @param {options} eventListener options
 */
const on = (els, name = "", handler, options) => {
	_.eventListener("add", els, name, handler, options);
};
const off = (els, name = "", handler, options) => {
	_.eventListener("remove", els, name, handler, options);
}

/**
 * **** Helpers ****
 */
/**
 * Debounce
 * @param {Function} fxn - callback executed after debounce
 * @param {Number} time - time (in ms) to delay
 * @returns {Function} debounced function
 */
const debounce = (fxn, time = 500) => {
	let timer;
	return function() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			fxn.apply(this, arguments);
		}, time);
	}
}

/**
 * @typedef Utils~makeOptions
 * @type {object}
 * @property {string} el - HTML element tag, e.g. "div" (default)
 * @property {string} appendTo - selector of target element to append menu
 * @property {string} className - CSS classes to add to the element
 * @property {object} attrs - HTML attributes (as key/value paries) to set
 * @property {object} text - string added to el using textContent
 * @property {string} html - html to be added using `innerHTML` (overrides `text`)
 * @property {array} children - array of elements to append to the created element
 */
/**
 * Create a DOM element
 * @param {Utils~makeOptions}
 * @returns {HTMLElement} (may be already inserted in the DOM)
 * @example
	make({ el: 'ul', className: 'wrapper', appendTo: 'body' }, [
		make({ el: 'li', text: 'item #1' }),
		make({ el: 'li', text: 'item #2' })
	]);
 */
const make = (obj, children) => {
	const el = document.createElement(obj.el || "div");
	const xref = {
		className: "className",
		id: "id",
		text: "textContent",
		html: "innerHTML", // overrides text setting
	};
	Object.keys(xref).forEach(key => {
		if (obj[key]) {
			el[xref[key]] = obj[key];
		}
	})
	if (obj.attrs) {
		for (let key in obj.attrs) {
			if (obj.attrs.hasOwnProperty(key)) {
				el.setAttribute(key, obj.attrs[key]);
			}
		}
	}
	if (Array.isArray(children) && children.length) {
		children.forEach(child => el.appendChild(child));
	}
	if (obj.appendTo) {
		const wrap = typeof obj.appendTo === "string" ? $(el) : el;
		if (wrap) {
			wrap.appendChild(el);
		}
	}
	return el;
}
