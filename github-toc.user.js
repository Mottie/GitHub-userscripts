// ==UserScript==
// @name          GitHub TOC
// @version       1.0.1
// @description   A userscript that adds a table of contents to readme & wiki pages
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_registerMenuCommand
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_addStyle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toc.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toc.user.js
// ==/UserScript==
/* global GM_registerMenuCommand, GM_getValue, GM_setValue, GM_addStyle */
/*jshint unused:true */
(function() {
  "use strict";

  GM_addStyle([
    ".github-toc { position:fixed; z-index:75; min-width:200px; top:55px; right:10px; }",
    ".github-toc h3 { cursor:move; }",
    // icon toggles TOC container & subgroups
    ".github-toc h3 svg, .github-toc li.collapsible .github-toc-icon { cursor:pointer; }",
    // move collapsed TOC to top right corner
    ".github-toc.collapsed {",
      "width:30px; height:30px; min-width:auto; overflow:hidden; top:10px !important; left:auto !important;",
      "right:10px !important; border:1px solid #d8d8d8; border-radius:3px;",
    "}",
    ".github-toc.collapsed > h3 { cursor:pointer; padding-top:5px; border:none; }",
    // move header text out-of-view when collapsed
    ".github-toc.collapsed > h3 svg { margin-bottom: 10px; }",
    ".github-toc-hidden, .github-toc.collapsed .boxed-group-inner,",
     ".github-toc li:not(.collapsible) .github-toc-icon { display:none; }",
    ".github-toc .boxed-group-inner { max-width:250px; max-height:400px; overflow-y:auto; overflow-x:hidden; }",
    ".github-toc ul { list-style:none; }",
    ".github-toc li { max-width:230px; white-space:nowrap; overflow-x:hidden; text-overflow:ellipsis; }",
    ".github-toc .github-toc-h1 { padding-left:15px; }",
    ".github-toc .github-toc-h2 { padding-left:30px; }",
    ".github-toc .github-toc-h3 { padding-left:45px; }",
    ".github-toc .github-toc-h4 { padding-left:60px; }",
    ".github-toc .github-toc-h5 { padding-left:75px; }",
    ".github-toc .github-toc-h6 { padding-left:90px; }",
    // anchor collapsible icon
    ".github-toc li.collapsible .github-toc-icon {",
      "width:16px; height:16px; display:inline-block; margin-left:-16px;",
      "background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSdvY3RpY29uJyBoZWlnaHQ9JzE0JyB2aWV3Qm94PScwIDAgMTIgMTYnPjxwYXRoIGQ9J00wIDVsNiA2IDYtNkgweic+PC9wYXRoPjwvc3ZnPg==) left center no-repeat;",
    "}",
    // on rotate, height becomes width, so this is keeping things lined up
    ".github-toc li.collapsible.collapsed .github-toc-icon { -webkit-transform:rotate(-90deg); transform:rotate(-90deg); height:10px; width:12px; margin-right:2px; }",
    ".github-toc-no-selection { -webkit-user-select:none !important; -moz-user-select:none !important; user-select:none !important; }"
  ].join(""));

  var targets,

  // modifiable title
  title = GM_getValue("github-toc-title", "Table of Contents"),

  container = document.createElement("div"),
  busy = false,
  tocInit = false,

  // keyboard shortcuts
  keyboard = {
    toggle  : "g+t",
    restore : "g+r",
    timer   : null,
    lastKey : null,
    delay   : 1000 // ms between keyboard shortcuts
  },

  // drag variables
  drag = {
    el   : null,
    pos  : [ 0, 0 ],
    elm  : [ 0, 0 ],
    time : 0,
    unsel: null
  };

  // drag code adapted from http://jsfiddle.net/tovic/Xcb8d/light/
  function dragInit() {
    if (!container.classList.contains("collapsed")) {
      drag.el = container;
      drag.elm[0] = drag.pos[0] - drag.el.offsetLeft;
      drag.elm[1] = drag.pos[1] - drag.el.offsetTop;
      selectionToggle(true);
    } else {
      drag.el = null;
    }
    drag.time = new Date().getTime() + 500;
  }
  function dragMove(event) {
    drag.pos[0] = document.all ? window.event.clientX : event.pageX;
    drag.pos[1] = document.all ? window.event.clientY : event.pageY;
    if (drag.el !== null) {
      drag.el.style.left = (drag.pos[0] - drag.elm[0]) + "px";
      drag.el.style.top = (drag.pos[1] - drag.elm[1]) + "px";
      drag.el.style.right = "auto";
    }
  }
  function dragStop() {
    if (drag.el !== null) {
      dragSave();
      selectionToggle();
    }
    drag.el = null;
  }
  function dragSave(clear) {
    var val = clear ? null : [container.style.left, container.style.top];
    GM_setValue("github-toc-location", val);
  }

  // stop text selection while dragging
  function selectionToggle(disable) {
    var body = $("body");
    if (disable) {
      // save current "unselectable" value
      drag.unsel = body.getAttribute("unselectable");
      body.setAttribute("unselectable", "on");
      body.classList.add("github-toc-no-selection");
      on(body, "onselectstart", selectionStop);
    } else {
      if (drag.unsel) {
        body.setAttribute("unselectable", drag.unsel);
      }
      body.classList.remove("github-toc-no-selection");
      body.removeEventListener("onselectstart", selectionStop);
    }
    removeSelection();
  }
  function selectionStop() {
    return false;
  }
  function removeSelection() {
    // remove text selection - http://stackoverflow.com/a/3171348/145346
    var sel = window.getSelection ? window.getSelection() : document.selection;
    if ( sel ) {
      if ( sel.removeAllRanges ) {
        sel.removeAllRanges();
      } else if ( sel.empty ) {
        sel.empty();
      }
    }
  }

  function tocShow() {
    container.classList.remove("collapsed");
    GM_setValue("github-toc-hidden", false);
  }
  function tocHide() {
    container.classList.add("collapsed");
    GM_setValue("github-toc-hidden", true);
  }
  function tocToggle() {
    // don't toggle content on long clicks
    if (drag.time > new Date().getTime()) {
      if (container.classList.contains("collapsed")) {
        tocShow();
      } else {
        tocHide();
      }
    }
  }
  // hide TOC entirely, if no rendered markdown detected
  function tocView(mode) {
    var toc = $(".github-toc");
    if (toc) {
      toc.style.display = mode || "none";
    }
  }

  function tocAdd() {
    // make sure the script is initialized
    init();
    if (!tocInit) {
      return;
    }
    if ($("#wiki-content, #readme")) {
      var indx, header, anchor, txt,
        content = "<ul>",
        anchors = $$(".markdown-body .anchor"),
        len = anchors.length;
      if (len) {
        busy = true;
        for (indx = 0; indx < len; indx++) {
          anchor = anchors[indx];
          if (anchor.parentNode) {
            header = anchor.parentNode;
            // replace single & double quotes with right angled quotes
            txt = header.textContent.trim().replace(/'/g, "&#8217;").replace(/"/g, "&#8221;");
            content += [
              "<li class='github-toc-" + header.nodeName.toLowerCase() + "'>",
                // using a ZenHub class here to invert the icon for the dark theme
                "<span class='github-toc-icon octicon zh-octicon-grey'></span>",
                "<a href='" + anchor.hash + "' title='" + txt + "'>" + txt + "</a>",
              "</li>"
            ].join("");
          }
        }
        $(".boxed-group-inner", container).innerHTML = content + "</ul>";
        tocView("block");
        listCollapsible();
        busy = false;
      } else {
        tocView();
      }
    } else {
      tocView();
    }
  }

  function $(str, el) {
    return (el || document).querySelector(str);
  }
  function $$(str, el) {
    return Array.from((el || document).querySelectorAll(str));
  }
  function on(el, name, handler) {
    el.addEventListener(name, handler);
  }
  function addClass(els, name) {
    var indx,
      len = els.length;
    for (indx = 0; indx < len; indx++) {
      els[indx].classList.add(name);
    }
  }
  function removeClass(els, name) {
    var indx,
      len = els.length;
    for (indx = 0; indx < len; indx++) {
      els[indx].classList.remove(name);
    }
  }

  function listCollapsible() {
    var indx, el, next, count, num, group,
      els = $$("li", container),
      len = els.length;
    for (indx = 0; indx < len; indx++) {
      count = 0;
      group = [];
      el = els[indx];
      next = el && el.nextSibling;
      if (next) {
        num = el.className.match(/\d/)[0];
        while (next && !next.classList.contains("github-toc-h" + num)) {
          count += next.className.match(/\d/)[0] > num ? 1 : 0;
          group[group.length] = next;
          next = next.nextSibling;
        }
        if (count > 0) {
          el.className += " collapsible collapsible-" + indx;
          addClass(group, "github-toc-childof-" + indx);
        }
      }
    }
    group = [];
    on(container, "click", function(event) {
      if (event.target.classList.contains("github-toc-icon")) {
        // click on icon, then target LI parent
        var item = event.target.parentNode,
          num = item.className.match(/collapsible-(\d+)/),
          els = num ? $$(".github-toc-childof-" + num[1], container) : null;
        if (els) {
          if (item.classList.contains("collapsed")) {
            item.classList.remove("collapsed");
            removeClass(els, "github-toc-hidden");
          } else {
            item.classList.add("collapsed");
            addClass(els, "github-toc-hidden");
          }
        }
      }
    });
  }

  // keyboard shortcuts
  // GitHub hotkeys are set up to only go to a url, so rolling our own
  function keyboardCheck(event) {
    clearTimeout(keyboard.timer);
    // use "g+t" to toggle the panel; "g+r" to reset the position
    // keypress may be needed for non-alphanumeric keys
    var tocToggle = keyboard.toggle.split("+"),
      tocReset = keyboard.restore.split("+"),
      key = String.fromCharCode(event.which).toLowerCase(),
      panelHidden = container.classList.contains("collapsed");

    // press escape to close the panel
    if (event.which === 27 && !panelHidden) {
      tocHide();
      return;
    }
    // prevent opening panel while typing in comments
    if (/(input|textarea)/i.test(document.activeElement.nodeName)) {
      return;
    }
    // toggle TOC (g+t)
    if (keyboard.lastKey === tocToggle[0] && key === tocToggle[1]) {
      if (panelHidden) {
        tocShow();
      } else {
        tocHide();
      }
    }
    // reset TOC window position (g+r)
    if (keyboard.lastKey === tocReset[0] && key === tocReset[1]) {
      container.setAttribute("style", "");
      dragSave(true);
    }
    keyboard.lastKey = key;
    keyboard.timer = setTimeout(function() {
      keyboard.lastKey = null;
    }, keyboard.delay);
  }

  function init() {
    // there is no ".header" on github.com/contact; and some other pages
    if (!$(".header") || tocInit) {
      return;
    }
    // insert TOC after header
    var tmp = GM_getValue("github-toc-location", null);
    // restore last position
    if (tmp) {
      container.style.left = tmp[0];
      container.style.top = tmp[1];
      container.style.right = "auto";
    }

    // TOC saved state
    tmp = GM_getValue("github-toc-hidden", false);
    container.className = "github-toc boxed-group wiki-pages-box readability-sidebar" + (tmp ? " collapsed" : "");
    container.setAttribute("role", "navigation");
    container.setAttribute("unselectable", "on");
    container.innerHTML = [
      "<h3 class='js-wiki-toggle-collapse wiki-auxiliary-content' data-hotkey='g t'>",
        "<svg class='octicon github-toc-icon' height='14' width='14' xmlns='http://www.w3.org/2000/svg' viewbox='0 0 16 12'><path d='M2 13c0 .6 0 1-.6 1H.6c-.6 0-.6-.4-.6-1s0-1 .6-1h.8c.6 0 .6.4.6 1zm2.6-9h6.8c.6 0 .6-.4.6-1s0-1-.6-1H4.6C4 2 4 2.4 4 3s0 1 .6 1zM1.4 7H.6C0 7 0 7.4 0 8s0 1 .6 1h.8C2 9 2 8.6 2 8s0-1-.6-1zm0-5H.6C0 2 0 2.4 0 3s0 1 .6 1h.8C2 4 2 3.6 2 3s0-1-.6-1zm10 5H4.6C4 7 4 7.4 4 8s0 1 .6 1h6.8c.6 0 .6-.4.6-1s0-1-.6-1zm0 5H4.6c-.6 0-.6.4-.6 1s0 1 .6 1h6.8c.6 0 .6-.4.6-1s0-1-.6-1z'/></svg> ",
        "<span>" + title + "</span>",
      "</h3>",
      "<div class='boxed-group-inner wiki-auxiliary-content wiki-auxiliary-content-no-bg'></div>"
    ].join("");

    // add container
    tmp = $(".header");
    tmp.parentNode.insertBefore(container, tmp);

    // make draggable
    on($("h3", container), "mousedown", dragInit);
    on(document, "mousemove", dragMove);
    on(document, "mouseup", dragStop);
    // toggle TOC
    on($(".github-toc-icon", container), "mouseup", tocToggle);
    // prevent container content selection
    on(container, "onselectstart", function() { return false; });
    // keyboard shortcuts
    on(document, "keydown", keyboardCheck);
    tocInit = true;
  }

  // DOM targets - to detect GitHub dynamic ajax page loading
  targets = $$([
    "#js-repo-pjax-container",
    // targeted by ZenHub
    "#js-repo-pjax-container > .container",
    "#js-pjax-container",
    ".js-preview-body"
  ].join(","));

  // update TOC when content changes
  Array.prototype.forEach.call(targets, function(target) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // preform checks before adding code wrap to minimize function calls
        if (!busy && mutation.target === target) {
          tocAdd();
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  // Add GM options
  GM_registerMenuCommand("Set Table of Contents Title", function() {
    title = prompt("Table of Content Title:", title);
    GM_setValue("toc-title", title);
    $("h3 span", container).textContent = title;
  });

  tocAdd();

})();
