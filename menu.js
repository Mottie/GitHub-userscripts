/**
 * **** Create a modal menu system to allow customization of values ****
 */
/**
 * Userscript menu options
 * @typedef ghMenu~options
 * @type {Object[]}
 * @property {String} name - Option label
 * @property {String} type - Option input type, e.g. "text", "number" or
 *  "checkbox"
 * @property {Function} get - Option get value function
 * @property {Function} set - Option set value function
 * @property {Object[]} options - 
 */
/* Add menu modal
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
	/**
	 * Initialize menu - adds styling
	 */
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

	/**
	 * Open the menu modal
	 * @param {String} title - Modal menu header text
	 * @param {ghMenu~options} options - Array of options to include in the modal
	 */
	open: (title, options) => {
		if (!$("#ghmenu")) {
			ghMenu._createMenu(title);
			ghMenu._options = options;
		}
		ghMenu._title = title;
		ghMenu._addContent(options);
	},

	/**
	 * Close menu modal
	 * @param {MouseEvent|KeyboardEvent} event 
	 */
	close: event => {
		if (event) {
			event.preventDefault();
		}
		const menu = $("#ghmenu");
		if (menu) {
			menu.remove();
		}
	},

	/**
	 * Append more options to an open modal menu, or open a modal menu
	 * @param {ghMenu~options} options 
	 */
	append: options => {
		const menu = $("#ghmenu");
		if (menu) {
			ghMenu._appendContent(options);
		} else {
			ghMenu.open("", options);
		}
	},

	/**
	 * Refresh modal menu
	 */
	refresh: () => {
		ghMenu._addContent(ghMenu._options);
	},

	/**
	 * form types to add to menu:
	 *  - text, number, checkbox, color or radio (WIP) input
	 *  - select (WIP)
	 *  - group (WIP)
	 */
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
	/**
	 * Create modal menu
	 */
	_createMenu: () => {
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

	/**
 * Create input or select label
 * @param {String} id - Unique ID to match up input & label
 * @param {String} text - Input label text
 * @example `<dt><label for="{ID}-input">{NAME}</label></dt>`
 * @returns {HTMLElement}
 */
	_createLabel: (id, text) =>
		make({ el: "dt" }, [
			make({
				el: "label",
				className: "flex-auto",
				text,
				attrs: {
					for: `${id}-input`
				}
			})
		]),

	/**
	 * Add content to menu modal (clears out existing content)
	 * @param {ghMenu~options} options 
	 */
	_addContent: options => {
		const menu = $("#ghmenu-inner");
		if (menu) {
			menu.innerHTML = "";
			ghMenu._appendContent(options);
		}
	},

	/**
	 * Append content to menu modal (does not clear out existing content)
	 * @param {ghMenu~options} options 
	 */
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