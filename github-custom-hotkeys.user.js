// ==UserScript==
// @name          GitHub Custom Hotkeys
// @version       0.2.0
// @description   A userscript that allows you to add custom GitHub keyboard hotkeys
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @include       https://*.github.com/*
// @grant         GM_addStyle
// @grant         GM_getValue
// @grant         GM_setValue
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-custom-hotkeys.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-custom-hotkeys.user.js
// ==/UserScript==
/* global GM_addStyle, GM_getValue, GM_setValue */
/*jshint unused:true */
(function() {
  "use strict";
  /* "g p" here overrides the GitHub default "g p" which takes you to the Pull Requests page
  {
    "all": [
      { "f1" : "#hotkey-settings" },
      { "g g": "{repo}/graphs" },
      { "g p": "{repo}/pulse" },
      { "g u": "{user}" },
      { "g s": "{upstream}" }
    ],
    "{repo}/issues": [
      { "g right": "{issue+1}" },
      { "g left" : "{issue-1}" }
    ],
    "{root}/search": [
      { "g right": "{page+1}" },
      { "g left" : "{page-1}" }
    ]
  }
  */
  var data = GM_getValue("github-hotkeys", {
    "f1": "#hotkey-settings"
  }),

  openHash = "#hotkey-settings",

  templates = {
    remove : "<svg class='ghch-remove octicon' fill='currentColor' xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 9 9'><path d='M9 1L5.4 4.4 9 8 8 9 4.6 5.4 1 9 0 8l3.6-3.5L0 1l1-1 3.5 3.6L8 0l1 1z'/></svg>",
    hotkey : "Hotkey: <input type='text' class='ghch-hotkey form-control'>&nbsp; URL: <input type='text' class='ghch-url form-control'>",
    scope : "<ul><li class='ghch-hotkey-add'>+ Click to add a new hotkey</li></ul>"
  },

  // https://github.com/{nonUser}
  nonUser = new RegExp("(" + [
    "about",
    "account",
    "blog",
    "business",
    "contact"
    "explore",
    "integrations",
    "issues",
    "new",
    "notifications",
    "open-source",
    "personal",
    "pricing",
    "pulls",
    "search",
    "security",
    "settings",
    "site",
    "stars",
    "watching",
  ].join("|") + ")"),

  getUrlParts = function() {
    var loc = window.location,
      root = "https://github.com",
      parts = {
        root   : root,
        origin : loc.origin,
        page   : ""
      },
      // pathname "should" always start with a "/"
      tmp = loc.pathname.split("/");
    // me
    parts.m = document.querySelector("meta[name='user-login']").getAttribute("content") || "";
    parts.me = parts.me ? parts.root + "/" + parts.m : "";
    // user name
    if (nonUser.test(tmp[1] || "")) {
      // invalid user! clear out the values
      tmp = [];
    }
    parts.u = tmp[1] || "";
    parts.user = tmp[1] ? root + "/" + tmp[1] : "";
    // repo name
    parts.r = tmp[2] || "";
    parts.repo = tmp[1] && tmp[2] ? parts.user + "/" + tmp[2] : "";
    // tab?
    parts.t = tmp[3] || "";
    parts.tab = tmp[3] ? parts.repo + "/" + tmp[3] : "";
    if (parts.t === "issues") {
      // issue number
      parts.issue = tmp[4] || "";
    }
    // forked from
    tmp = document.querySelector(".repohead .fork-flag a");
    parts.upstream = tmp ? tmp.getAttribute("href") : "";
    // current page
    if (loc.search.match(/[&?]q=/)) {
      tmp = loc.search.match(/[&?]p=(\d+)/);
      parts.page = tmp ? tmp[1] || "1" : "1";
    }
    return parts;
  },

  // pass true to initialize; false to remove everything
  checkScope = function() {
    var key, url,
      parts = getUrlParts();
    removeElms(document.querySelector("body"), ".ghch-link");
    for (key in data) {
      if (data.hasOwnProperty(key)) {
        url = fixUrl(parts, key === "all" ? "{root}" : key);
        if (window.location.href.indexOf(url) > -1) {
          debug("Checking custom hotkeys for " + key);
          addHotkeys(parts, url, data[key]);
        }
      }
    }
  },

  fixUrl = function(parts, url) {
    var valid = true; // use true in case a full URL is used
    url = url
      // allow {issues+#} to go inc or desc
      .replace(/\{issue([\-+]\d+)?\}/, function(s, n) {
        var val = n ? parseInt(parts.issue || "", 10) + parseInt(n, 10) : "";
        valid = val !== "" && val > 0;
        return valid ? parts.tab + "/" + val : "";
      })
      // allow {page+#} to change results page
      .replace(/\{page([\-+]\d+)?\}/, function(s, n) {
        var search,
          loc = window.location,
          val = n ? parseInt(parts.page || "", 10) + parseInt(n, 10) : "";
        valid = val !== "" && val > 0;
        if (valid) {
          search = loc.origin + loc.pathname;
          if (loc.search.match(/[&?]p?=\d+/)) {
            search += loc.search.replace(/([&?]p=)\d+/, function(s, n) {
              return n + val;
            });
          } else {
            // started on page 1 (no &p=1) available to replace
            search += loc.search + "&p=" + val;
          }
        }
        return valid ? search : "";
      })
      // replace placeholders
      .replace(/\{\w+\}/gi, function(matches) {
        var val = parts[matches.replace(/[{}]/g, "")] || "";
        valid = val !== "";
        return val;
      });
    return valid ? url : "";
  },

  removeElms = function(src, selector) {
    var links = src.querySelectorAll(selector),
      len = links.length;
    while(len--) {
      src.removeChild(links[len]);
    }
  },

  addHotkeys = function(parts, scope, hotkeys) {
    // Shhh, don't tell anyone, but GitHub checks the data-hotkey attribute
    // of any link on the page, so we only need to add dummy links :P
    var indx, url, key, link,
      len = hotkeys.length,
      body = document.querySelector("body");
    for (indx = 0; indx < len; indx++) {
      key = Object.keys(hotkeys[indx])[0];
      url = fixUrl(parts, hotkeys[indx][key]);
      if (url) {
        link = document.createElement("a");
        link.className = "ghch-link";
        link.href = url;
        link.setAttribute("data-hotkey", key);
        body.appendChild(link);
        debug("Adding '" + key + "' keyboard hotkey linked to: " + url);
      }
    }
  },

  addHotkey = function(el) {
    var li = document.createElement("li");
    li.className = "ghch-hotkey-set";
    li.innerHTML = templates.hotkey + templates.remove;
    el.parentNode.insertBefore(li, el);
    return li;
  },

  addScope = function(el) {
    var scope = document.createElement("fieldset");
    scope.className = "ghch-scope-custom";
    scope.innerHTML = "<legend><span class='simple-box' contenteditable>Enter Scope</span>&nbsp;" +
      templates.remove +
      "</legend>" +
      templates.scope;
    el.parentNode.insertBefore(scope, el);
    return scope;
  },

  addMenu = function() {
    GM_addStyle([
      "#ghch-open-menu { cursor:pointer; }",
      "#ghch-menu { position:fixed; z-index: 65535; top:0; bottom:0; left:0; right:0; opacity:0; visibility:hidden; }",
      "#ghch-menu.in { opacity:1; visibility:visible; background:rgba(0,0,0,.5); }",
      "#ghch-settings-inner { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:25rem; box-shadow:0 .5rem 1rem #111; }",
      "#ghch-settings-inner h3 .btn { float:right; font-size:.8em; padding:0 6px 2px 6px; margin-left:3px; }",
      ".ghch-remove, .ghch-remove svg, #ghch-settings-inner .ghch-close svg { vertical-align:middle; cursor:pointer; }",
      ".ghch-menu-inner { max-height:60vh; overflow-y:auto; }",
      ".ghch-menu-inner ul { list-style:none; }",
      ".ghch-menu-inner li { margin-bottom:4px; }",
      ".ghch-scope-all, .ghch-scope-add, .ghch-scope-custom { width:100%; border:2px solid rgba(85,85,85,0.5); border-radius:4px; padding:10px; margin:0; }",
      ".ghch-scope-add, .ghch-hotkey-add { border:2px dashed #555; border-radius:4px; opacity:0.6; text-align:center; cursor:pointer; margin-top:10px; }",
      ".ghch-scope-add:hover, .ghch-hotkey-add:hover { opacity:1;  }",
      ".ghch-menu-inner legend span { padding:0 6px; min-width:30px; border:0; }",
      ".ghch-hotkey { width:60px; }",
      ".ghch-menu-inner li .ghch-remove { margin-left:10px; }",
      ".ghch-menu-inner li .ghch-remove:hover, .ghch-menu-inner legend .ghch-remove:hover { color:#800; }",
      ".ghch-json-code { display:none; font-family:Menlo, Inconsolata, 'Droid Mono', monospace; font-size:1em; }",
      ".ghch-json-code.in { position:absolute; top:37px; bottom:0; left:2px; right:2px; z-index:0; width:396px; max-width:396px; max-height:calc(100% - 37px); display:block; }"
    ].join(""));

    // add menu
    var tmp,
    inner = [
      "<div id='ghch-settings-inner' class='boxed-group'>",
        "<h3>",
          "GitHub Custom Hotkey Settings",
          "<button type='button' class='btn btn-sm ghch-close tooltipped tooltipped-n' aria-label='Close';>" + templates.remove + "</button>",
          "<button type='button' class='ghch-code btn btn-sm tooltipped tooltipped-n' aria-label='Toggle JSON data view'>{ }</button>",
          "<a href='https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-custom-hotkeys' class='ghch-help btn btn-sm tooltipped tooltipped-n' aria-label='Get Help'>?</a>",
        "</h3>",
        "<div class='ghch-menu-inner boxed-group-inner'>",
          "<fieldset class='ghch-scope-all'>",
            "<legend><span class='simple-box' data-scope='all'>All of GitHub &amp; subdomains</span></legend>",
            templates.scope,
          "</fieldset>",
          "<div class='ghch-scope-add'>+ Click to add a new scope</div>",
          "<textarea class='ghch-json-code'></textarea>",
        "</div>",
      "</div>"
    ].join(""),

    menu = document.createElement("div");
    menu.id = "ghch-menu";
    menu.innerHTML = inner;
    document.querySelector("body").appendChild(menu);
    // Create our menu entry
    menu = document.createElement("a");
    menu.id = "ghch-open-menu";
    menu.className = "dropdown-item";
    menu.innerHTML = "GitHub Hotkey Settings";

    tmp = document.querySelectorAll(".header .dropdown-item[href='/settings/profile'], .header .dropdown-item[data-ga-click*='go to profile']");
    if (tmp) {
      tmp[tmp.length - 1].parentNode.insertBefore(menu, tmp[tmp.length - 1].nextSibling);
    }
    addBindings();
  },

  openPanel = function() {
    updateMenu();
    document.querySelector("#ghch-menu").classList.add("in");
    return false;
  },

  closePanel = function() {
    var menu = document.querySelector("#ghch-menu");
    if (menu.classList.contains("in")) {
      // update data in case a "change" event didn't fire
      refreshData();
      checkScope();
      menu.classList.remove("in");
      menu.querySelector(".ghch-json-code").classList.remove("in");
      window.location.hash = "";
      return false;
    }
  },

  addJSON = function() {
    var textarea = document.querySelector(".ghch-json-code");
    textarea.value = JSON
      .stringify(data, null, 2)
      // compress JSON a little
      .replace(/\n    \}/g, " }")
      .replace(/\{\n      /g, "{ ");
  },

  processJSON = function() {
    var val,
      textarea = document.querySelector(".ghch-json-code"),
      txt = textarea.value;
    try {
      val = JSON.parse(txt);
      data = val;
    } catch (err) {}
  },

  updateMenu = function() {
    var indx, len, hotkeys, key, scope, tmp, target, selector,
      menu = document.querySelector(".ghch-menu-inner");
    removeElms(menu, ".ghch-scope-custom");
    removeElms(menu.querySelector(".ghch-scope-all ul"), ".ghch-hotkey-set");
    // Add scopes
    for (key in data) {
      if (data.hasOwnProperty(key)) {
        if (key === "all") {
          selector = "all";
          scope = menu.querySelector(".ghch-scope-all .ghch-hotkey-add");
        } else if (key !== selector) {
          selector = key;
          scope = addScope(document.querySelector(".ghch-scope-add"));
          scope.querySelector("legend span").innerHTML = key;
          scope = scope.querySelector(".ghch-hotkey-add");
        }
        // add hotkey entries
        hotkeys = data[key];
        len = hotkeys.length;
        for (indx = 0; indx < len; indx++) {
          target = addHotkey(scope);
          tmp = Object.keys(hotkeys[indx])[0];
          target.querySelector(".ghch-hotkey").value = tmp;
          target.querySelector(".ghch-url").value = hotkeys[indx][tmp];
        }
      }
    }
  },

  refreshData = function() {
    var tmp, scope, scopes, sIndx, sLen, hotkeys, scIndx, scLen, val,
      menu = document.querySelector(".ghch-menu-inner");
    data = {};
    scopes = menu.querySelectorAll("fieldset");
    sLen = scopes.length;
    for (sIndx = 0; sIndx < sLen; sIndx++) {
      tmp = scopes[sIndx].querySelector("legend span");
      if (tmp) {
        scope = tmp.getAttribute("data-scope") || tmp.textContent.trim();
        hotkeys = scopes[sIndx].querySelectorAll(".ghch-hotkey-set");
        scLen = hotkeys.length;
        data[scope] = [];
        for (scIndx = 0; scIndx < scLen; scIndx++) {
          tmp = hotkeys[scIndx].querySelectorAll("input");
          val = tmp[0] && tmp[0].value || "";
          if (val) {
            data[scope][scIndx] = {};
            data[scope][scIndx][val] = tmp[1].value || "";
          }
        }
      }
    }
    GM_setValue("github-hotkeys", data);
    debug("Data refreshed", data);
  },

  lastHref = window.location.href,
  addBindings = function() {
    var tmp,
      menu = document.querySelector("#ghch-menu");

    // open menu
    document.querySelector("#ghch-open-menu").addEventListener("click", openPanel);
    // close menu
    menu.addEventListener("click", closePanel);
    document.querySelector("body").addEventListener("keydown", function(event) {
      if (event.which === 27) {
        closePanel();
      }
    });
    // stop propagation
    menu.querySelector("#ghch-settings-inner").addEventListener("keydown", function(event) {
      event.stopPropagation();
    });
    menu.querySelector("#ghch-settings-inner").addEventListener("click", function(event) {
      event.stopPropagation();
      var target = event.target;
      // add hotkey
      if (target.classList.contains("ghch-hotkey-add")) {
        addHotkey(target);
      } else if (target.classList.contains("ghch-scope-add")) {
        addScope(target);
      }
      // svg & path nodeName may be lowercase
      tmp = target.nodeName.toLowerCase();
      if (tmp === "path") {
        target = target.parentNode;
      }
      // target should now point at svg
      if (target.classList.contains("ghch-remove")) {
        tmp = target.parentNode;
        // remove fieldset
        if (tmp.nodeName === "LEGEND") {
          tmp = tmp.parentNode;
        }
        // remove li; but not the button in the header
        if (tmp.nodeName !== "BUTTON") {
          tmp.parentNode.removeChild(tmp);
          refreshData();
        }
      }
    });
    menu.addEventListener("change", refreshData);
    // contenteditable scope title
    menu.addEventListener("input", function(event) {
      if (event.target.classList.contains("simple-box")) {
        refreshData();
      }
    });
    menu.querySelector("button.ghch-close").addEventListener("click", closePanel);
    // open JSON code textarea
    tmp = menu.querySelector(".ghch-code");
    tmp.addEventListener("click", function() {
      menu.querySelector(".ghch-json-code").classList.toggle("in");
      addJSON();
    });
    // close JSON code textarea
    tmp = menu.querySelector(".ghch-json-code");
    tmp.addEventListener("focus", function() {
      this.select();
    });
    tmp.addEventListener("paste", function() {
      setTimeout(function() {
        processJSON();
        updateMenu();
        document.querySelector(".ghch-json-code").classList.remove("in");
      }, 200);
    });

    // This is crazy! But window.location.search changes do not fire the
    // "popstate" or "hashchange" event, so we're stuck with a setInterval
    setInterval(function() {
      var loc = window.location;
      if (lastHref !== loc.href) {
        lastHref = loc.href;
        checkScope();
        // open panel via hash
        if (loc.hash === openHash) {
          openPanel();
        }
      }
    }, 1000);
  },

  // include a "debug" anywhere in the browser URL (search parameter) to enable debugging
  debug = function() {
    if (/debug/.test(window.location.search)) {
      console.log.apply(console, arguments);
    }
  };

  // initialize
  checkScope();
  addMenu();

})();
