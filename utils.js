/* GitHub userscript utilities v0.1.2-alpha
 * Copyright © 2021 Rob Garrison
 * License: MIT
 */
/* exported
 * $ $$
 * addClass removeClass toggleClass
 * on off make
 * debounce
 * addMenu
 */
"use strict";

const REGEX = {
	WHITESPACE: /\s+/,
	NAMESPACE: /[.:]/,
	COMMA: /\s*,\s*/
};

/* DOM utilities */
const $ = (selector, el) => (el || document).querySelector(selector);
const $$ = (selector, el) => [...(el || document).querySelectorAll(selector)];

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
 * Add/remove event listener
 * @param {HTMLElement|HTMLElement[]|NodeList} els
 * @param {string} name - event name(s) to bind, e.g. "mouseup mousedown"
 * @param {function} handler - event handler
 * @param {options} eventListener options
 */
const on = (els, name = "", handler, options) => {
	_.eventListener("add", els, name, handler, options);
};
const off = (els, name = "", handler, options) => {
	_.eventListener("remove", els, name, handler, options);
}

const _ = {};
_.createElementArray = elements => {
	if (Array.isArray(elements)) {
		return elements;
	}
	return elements instanceof NodeList ? [...elements] : [elements];
};
_.eventListener = (type, els, name, handler, options) => {
	const events = name.split(REGEX.WHITESPACE);
	_.createElementArray(els).forEach(el => {
		events.forEach(ev => {
			el?.[`${type}EventListener`](ev, handler, options);
		});
	});
};
_.getClasses = classes => {
	if (Array.isArray(classes)) {
		return classes;
	}
	const names = classes.toString();
	return names.includes(",") ? names.split(REGEX.COMMA) : [names];
};

/**
 * Helpers
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

/* Add GitHub menu
 * Example set up
ghMenu.open(
	"Popup Title",
	[{
		name: "Title",
		type: "text",
		get: () => GM_getValue("title"),
		set: value => GM_setValue("title", value)
	}, {
		name: "Border width (px)",
		type: "number",
		get: () => GM_getValue("border-width"),
		set: value => GM_setValue("border-width", value)
	}, {
		name: "Is enabled?",
		type: "checkbox",
		get: () => GM_getValue("enabled"),
		set: value => GM_setValue("enabled", value)
	}, {
		name: "Background Color",
		type: "color",
		get: () => GM_getValue("bkg-color"),
		set: value => GM_setValue("bkg-color", value)
	}, {
		name: "Widget enabled",
		type: "checkbox",
		get: () => GM_getValue("widget-is-enabled"),
		set: value => GM_setValue("widget-is-enabled", value)
	}, {
		name: "Image choice",
		type: "select",
		get: () => GM_getValue("img-choice"),
		set: value => GM_setValue("img-choice", value),
		options: [
			{ label: "Car", value: "/images/car.jpg" },
			{ label: "Jet", value: "/images/jet.jpg" },
			{ label: "Cat", value: "/images/cat.jpg" }
		]
	}]
);
*/
const ghMenu = {
	init: () => {
		if (!$("#ghmenu-style")) {
			make({
				el: "style",
				id: "ghmenu-style",
				textContent: `
					#ghmenu, #ghmenu summary { cursor: default; }
					#ghmenu summary:before { cursor: pointer; }
					#ghmenu-inner input[type="color"] { border: 0; padding: 0 }
					#ghmenu-inner ::-webkit-color-swatch-wrapper { border: 0; padding: 0; }
					#ghmenu-inner ::-moz-color-swatch-wrapper { border: 0; padding: 0; }
					}
				`,
				appendTo: "body"
			});
		}
	},

	open: (title, options) => {
		if (!$("#ghmenu")) {
			ghMenu._createMenu(title);
			ghMenu._options = options;
		}
		ghMenu._title = title;
		ghMenu._addContent(options);
	},
	close: event => {
		if (event) {
			event.preventDefault();
		}
		const menu = $("#ghmenu");
		if (menu) {
			menu.remove();
		}
	},
	append: options => {
		const menu = $("#ghmenu");
		if (menu) {
			ghMenu._appendContent(options);
		} else {
			ghMenu.open("", options);
		}
	},
	refresh: () => {
		ghMenu._addContent(ghMenu._options);
	},

	_types: {
		_input: (type, eventType, opts) => {
			const elm = make({
				el: "input",
				id: `${opts.id}-input`,
				className: `ghmenu-${type} ${type === "checkbox"
					? "m-2"
					: "form-control input-block width-full"
				}`,
				attrs: {
					type,
					value: opts.get()
				},
			});
			const handler = e => opts.set(type === "checkbox"
				? e.target.checked
				: e.target.value
			);
			on(elm, eventType, handler);
			return elm;
		},
		text: opts => ghMenu._types._input("text", "input", opts),
		number: opts => ghMenu._types._input("number", "input", opts),
		checkbox: opts => ghMenu._types._input("checkbox", "change", opts),
		color: opts => ghMenu._types._input("color", "change", opts),
		radio: opts => {}, // TO DO
		select: opts => {
			const elm = make({
				el: "select",
				className: "width-full ghmenu-select",
				attrs: {
					value: opts.get()
				}
			}, opts.options.map(obj => (
				make({
					el: "option",
					text: obj.label,
					attrs: {
						value: obj.value
					}
				})
			)));
			on(elm, "change", e => opts.set(e.target.value));
			return elm;
		},

		/* TO DO
		* - add multiple?
		*   colors: ['#000', '#fff']
		*   guideline: { width: '.2', color: '#a00', chars: 80 }
		* - link to more details/docs?
		*/
		group: opts => {
			const group = opts.group;
			if (Array.isArray(group) && group.length) {
				const fragment = document.createDocumentFragment();
				fragment.appendChild(make({ el: "strong", text: opts.name }));
				group.forEach(entry => {
					const row = make({
						className: "Box-row d-flex flex-row pr-0"
					}, [
						ghMenu._createLabel(entry.id, entry.name),
						make({
							id,
							className: `ml-2 no-wrap${
								// align checkbox to right edge
								opt.type === "checkbox" ? " d-flex flex-justify-end" : ""
							}`,
						})
					])
				})
			}
		},
	},
	_options: [],
	_createMenu: () => {
		// create menu
		make({
			el: "details",
			id: "ghmenu",
			className: "details-reset details-overlay details-overlay-dark lh-default text-gray-dark",
			attrs: {
				open: true
			},
			html: `
				<summary role="button" aria-label="Close dialog" />
				<details-dialog
					id="ghmenu-dialog"
					class="Box Box--overlay d-flex flex-column anim-fade-in fast container-xl"
					role="dialog"
					aria-modal="true"
					tab-index="-1"
				>
					<div class="readability-extra d-flex flex-auto flex-column overflow-hidden">
						<div class="Box-header">
							<h2 id="ghmenu-title" class="Box-title"></h2>
						</div>
						<div class="Box-body p-0 overflow-scroll">
							<div class="container-lg p-responsive advanced-search-form">
								<fieldset id="ghmenu-inner" class="pb-2 mb-2 min-width-0" />
							</div>
						</div>
					</div>
					<button id="ghmenu-close-menu" class="Box-btn-octicon m-0 btn-octicon position-absolute right-0 top-0" type="button" aria-label="Close dialog" data-close-dialog="">
						<svg class="octicon octicon-x" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true">
							<path fill-rule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z" />
						</svg>
					</button>
				</details-dialog>`,
			appendTo: "body"
		});
		on($("#ghmenu-close-menu"), "click", e => ghMenu.close(e), { once: true });
		on($("#ghmenu summary"), "click", e => {
			e.preventDefault();
			e.stopPropagation();
			const target = e.target;
			if (target && !target.closest("#ghmenu-dialog")) {
				ghMenu.close(e);
			}
		});
	},
	_addContent: options => {
		const menu = $("#ghmenu-inner");
		if (menu) {
			menu.innerHTML = "";
			ghMenu._appendContent(options);
		}
	},
	/* <dt><label for="{ID}-input">{NAME}</label></dt> */
	_createLabel: (id, text) => make({
		el: "dt",
	}, [
		make({
			el: "label",
			className: "flex-auto",
			text,
			attrs: {
				for: `${id}-input`
			}
		})
	]),
	_appendContent: options => {
		const container = $("#ghmenu-inner");
		if (container) {
			// update title, if needed
			$("#ghmenu-title").textContent = ghMenu._title;

			const fragment = document.createDocumentFragment();
			options.forEach((opt, indx) => {
				const id = `ghmenu-${opt.name.replace(/\s/g, "")}-${indx}`;
				const output = opt.type === "group"
					? ghMenu._types.group({ ...opt, id })
					: make({
						el: "dl",
						className: "form-group flattened d-flex d-md-block flex-column border-bottom my-0 py-2",
					}, [
						ghMenu._createLabel(id, opt.name),
						make({
							el: "dd",
							id,
							className: opt.type === "checkbox"
								? "d-flex flex-justify-end"
								: "",
						}, [
							ghMenu._types[opt.type || "text"]({ ...opt, id })
						])
					]);
				fragment.appendChild(output);
			});
			container.appendChild(fragment);
		}
	}
};

/*
TESTING
ghMenu.init();
ghMenu.open('Testing',[{name:'test color',type:'color',get:()=>'#ddd',set:v=>console.log('setting to',v)},{name:'test number',type:'checkbox',get:()=>true,set:v=>console.log('setting cb to',v)}]);
ghMenu.append([{name:"Image choice",type:"select",get:()=>"Car",set:v=>console.log("img-choice", v),options:[{label:"Car",value:"/images/car.jpg"},{label:"Jet",value:"/images/jet.jpg"},{label:"Cat",value:"/images/cat.jpg"}]}]);
*/