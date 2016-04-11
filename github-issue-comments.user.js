// ==UserScript==
// @name          GitHub Toggle Issue Comments
// @version       1.0.2
// @description   A userscript that toggles issues/pull request comments & messages
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_addStyle
// @grant         GM_getValue
// @grant         GM_setValue
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-comments.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-comments.user.js
// ==/UserScript==
/* global GM_addStyle, GM_getValue, GM_setValue */
/*jshint unused:true */
(function() {
  "use strict";

  GM_addStyle([
    ".ghic-button { float:right; }",
    ".ghic-button .btn:hover div.select-menu-modal-holder { display:block; top:auto; bottom:25px; right:0; }",
    ".ghic-right { float:right; }",
    ".ghic-menu label { display:block; padding:5px 15px; }",
    ".ghic-button .select-menu-header, .ghic-participants { cursor:default; }",
    ".ghic-participants { border-top:1px solid #484848; padding:15px; }",
    ".ghic-avatar { display:inline-block; float:left; margin: 0 2px 2px 0; cursor:pointer; position:relative; }",
    ".ghic-avatar:last-child { margin-bottom:5px; }",
    ".ghic-avatar.comments-hidden svg { display:block; position:absolute; top:-2px; left:-2px; z-index:1; }",
    ".ghic-avatar.comments-hidden img { opacity:0.5; }",
    ".ghic-button .dropdown-item input:checked + svg { display: block; }",
    ".ghic-button .select-menu-modal { margin: 0; }",
    ".ghic-button .ghic-participants { margin-bottom: 20px; }",
    ".ghic-hidden, .ghic-hidden-participant, .ghic-avatar svg, .ghic-button .ghic-right > *,",
      ".ghic-hideReactions .comment-reactions { display:none; }",
  ].join(""));

  var busy = false,

  // ZenHub addon active
  hasZenHub = document.querySelector("body").classList.contains("zhio"),

  iconHidden = "<svg class='octicon' xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 9 9'><path fill='#777' d='M7.07 4.5c0-.47-.12-.9-.35-1.3L3.2 6.7c.4.25.84.37 1.3.37.35 0 .68-.07 1-.2.32-.14.6-.32.82-.55.23-.23.4-.5.55-.82.13-.32.2-.65.2-1zM2.3 5.8l3.5-3.52c-.4-.23-.83-.35-1.3-.35-.35 0-.68.07-1 .2-.3.14-.6.32-.82.55-.23.23-.4.5-.55.82-.13.32-.2.65-.2 1 0 .47.12.9.36 1.3zm6.06-1.3c0 .7-.17 1.34-.52 1.94-.34.6-.8 1.05-1.4 1.4-.6.34-1.24.52-1.94.52s-1.34-.18-1.94-.52c-.6-.35-1.05-.8-1.4-1.4C.82 5.84.64 5.2.64 4.5s.18-1.35.52-1.94.8-1.06 1.4-1.4S3.8.64 4.5.64s1.35.17 1.94.52 1.06.8 1.4 1.4c.35.6.52 1.24.52 1.94z'/></svg>",
  iconCheck = "<svg class='octicon octicon-check' height='16' viewBox='0 0 12 16' width='12'><path d='M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z'></path></svg>",

  settings = {
    // https://github.com/Mottie/Keyboard/issues/448
    title: {
      isHidden: false,
      name: "ghic-title",
      selector: ".discussion-item-renamed",
      label: "Title Changes"
    },
    labels: {
      isHidden: false,
      name: "ghic-labels",
      selector: ".discussion-item-labeled, .discussion-item-unlabeled",
      label: "Label Changes"
    },
    state: {
      isHidden: false,
      name: "ghic-state",
      selector: ".discussion-item-reopened, .discussion-item-closed",
      label: "State Changes (close/reopen)"
    },

    // https://github.com/jquery/jquery/issues/2986
    milestone: {
      isHidden: false,
      name: "ghic-milestone",
      selector: ".discussion-item-milestoned",
      label: "Milestone Changes"
    },
    refs: {
      isHidden: false,
      name: "ghic-refs",
      selector: ".discussion-item-ref, .discussion-item-head_ref_deleted",
      label: "References"
    },
    assigned: {
      isHidden: false,
      name: "ghic-assigned",
      selector: ".discussion-item-assigned",
      label: "Assignment Changes"
    },

    // Pull Requests
    commits: {
      isHidden: false,
      name: "ghic-commits",
      selector: ".discussion-commits",
      label: "Commits"
    },
    // https://github.com/jquery/jquery/pull/3014
    diffOld: {
      isHidden: false,
      name: "ghic-diffOld",
      selector: ".outdated-diff-comment-container",
      label: "Diff (outdated) Comments"
    },
    diffNew: {
      isHidden: false,
      name: "ghic-diffNew",
      selector: "[id^=diff-for-comment-]:not(.outdated-diff-comment-container)",
      label: "Diff (current) Comments"
    },
    // https://github.com/jquery/jquery/pull/2949
    merged: {
      isHidden: false,
      name: "ghic-merged",
      selector: ".discussion-item-merged",
      label: "Merged"
    },
    integrate: {
      isHidden: false,
      name: "ghic-integrate",
      selector: ".discussion-item-integrations-callout",
      label: "Integrations"
    },

    // extras (special treatment - no selector)
    plus1: {
      isHidden: false,
      name: "ghic-plus1",
      label: "Hide +1s"
    },
    reactions: {
      isHidden: false,
      name: "ghic-reactions",
      label: "Reactions"
    },
    // page with lots of users to hide:
    // https://github.com/isaacs/github/issues/215

    // ZenHub pipeline change
    pipeline: {
      isHidden: false,
      name: "ghic-pipeline",
      selector: ".discussion-item.zh-discussion-item",
      label: "ZenHub Pipeline Changes"
    }
  },

  matches = function(el, selector) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
    var matches = document.querySelectorAll(selector),
      i = matches.length;
    while (--i >= 0 && matches.item(i) !== el) {}
    return i > -1;
  },

  closest = function(el, selector) {
    while (el && !matches(el, selector)) {
      el = el.parentNode;
    }
    return matches(el, selector) ? el : null;
  },

  addClass = function(els, name) {
    var indx,
    len = els.length;
    for (indx = 0; indx < len; indx++) {
      els[indx].classList.add(name);
    }
  },

  removeClass = function(els, name) {
    var indx,
    len = els.length;
    for (indx = 0; indx < len; indx++) {
      els[indx].classList.remove(name);
    }
  },

  addMenu = function() {
    busy = true;
    if (document.getElementById("discussion_bucket") && !document.querySelector(".ghic-button")) {
      // update "isHidden" values
      getSettings();
      var name,
        list = "",
        header = document.querySelector(".discussion-sidebar-item:last-child"),
        menu = document.createElement("div");

      for (name in settings) {
        if (settings.hasOwnProperty(name) && !(name === "pipeline" && !hasZenHub)) {
          list += "<label class='dropdown-item'>" + settings[name].label +
          "<span class='ghic-right " + settings[name].name + "'>" +
          "<input type='checkbox'" + (settings[name].isHidden ? " checked" : "") + ">" + iconCheck + "</span></label>";
        }
      }

      menu.className = "ghic-button";
      menu.innerHTML = [
        "<span class='btn btn-sm' role='button' tabindex='0' aria-haspopup='true'>",
          "<span class='tooltipped tooltipped-w' aria-label='Toggle issue comments'>",
            "<svg class='octicon octicon-comment-discussion' height='16' width='16' role='img' viewBox='0 0 16 16'><path d='M15 2H6c-0.55 0-1 0.45-1 1v2H1c-0.55 0-1 0.45-1 1v6c0 0.55 0.45 1 1 1h1v3l3-3h4c0.55 0 1-0.45 1-1V10h1l3 3V10h1c0.55 0 1-0.45 1-1V3c0-0.55-0.45-1-1-1zM9 12H4.5l-1.5 1.5v-1.5H1V6h4v3c0 0.55 0.45 1 1 1h3v2z m6-3H13v1.5l-1.5-1.5H6V3h9v6z'></path></svg>",
          "</span>",
          "<div class='select-menu-modal-holder'>",
            "<div class='select-menu-modal' aria-hidden='true'>",
              "<div class='select-menu-header' tabindex='-1'>",
                "<span class='select-menu-title'>Toggle items</span>",
              "</div>",
              "<div class='select-menu-list ghic-menu' role='menu'>",
                list,
                "<div class='ghic-participants'></div>",
              "</div>",
            "</div>",
          "</div>",
        "</span>"
      ].join("");
      if (hasZenHub) {
        header.insertBefore(menu, header.childNodes[0]);
      } else {
        header.appendChild(menu);
      }
      addAvatars();
      update();
    }
    busy = false;
  },

  addAvatars = function() {
    var indx = 0,

    str = "<h3>Hide Comments from</h3>",
    unique = [],
    // get all avatars
    avatars = document.querySelectorAll(".timeline-comment-avatar"),
    len = avatars.length - 1, // last avatar is the new comment with the current user

    loop = function(callback) {
      var el, name,
        max = 0;
      while (max < 50 && indx < len) {
        if (indx >= len) {
          return callback();
        }
        el = avatars[indx];
        name = (el.getAttribute("alt") || "").replace("@", "");
        if (unique.indexOf(name) < 0) {
          str += "<span class='ghic-avatar tooltipped tooltipped-n' aria-label='" + name + "'>" +
            iconHidden +
            "<img class='ghic-avatar avatar' width='24' height='24' src='" + el.src + "'/>" +
            "</span>";
          unique[unique.length] = name;
          max++;
        }
        indx++;
      }
      if (indx < len) {
        setTimeout(function() {
          loop(callback);
        }, 200);
      } else {
        callback();
      }
    };
    loop(function() {
      document.querySelector(".ghic-participants").innerHTML = str;
    });
  },

  getSettings = function() {
    var name;
    for (name in settings) {
      if (settings.hasOwnProperty(name)) {
        settings[name].isHidden = GM_getValue(settings[name].name, false);
      }
    }
  },

  saveSettings = function() {
    var name;
    for (name in settings) {
      if (settings.hasOwnProperty(name)) {
        GM_setValue(settings[name].name, settings[name].isHidden);
      }
    }
  },

  getInputValues = function() {
    var name,
    menu = document.querySelector(".ghic-menu");
    for (name in settings) {
      if (settings.hasOwnProperty(name) && !(name === "pipeline" && !hasZenHub)) {
        settings[name].isHidden = menu.querySelector("." + settings[name].name + " input").checked;
      }
    }
  },

  hideStuff = function(name, init) {
    if (settings[name].selector) {
      var results = document.querySelectorAll(settings[name].selector);
      if (settings[name].isHidden) {
        addClass(results, "ghic-hidden");
      } else if (!init) {
        // no need to remove classes on initialization
        removeClass(results, "ghic-hidden");
      }
    } else if (name === "plus1") {
      hidePlus1(init);
    } else if (name === "reactions") {
      document.querySelector("body").classList[settings[name].isHidden ? "add" : "remove"]("ghic-hideReactions");
    }
  },

  hidePlus1 = function(init) {
    var max,
    indx = 0,
    // used https://github.com/isaacs/github/issues/215 for matches here...
    // matches "+1!!!!", "++1", "+!", "+99!!!", "-1", "+ 100", etc
    // image title ":{anything}:", etc.
    regex = /([+-]+\s*[\d!]+|^:(.+):)$/,
    comments = document.querySelectorAll(".timeline-comment-wrapper .comment-body"),
    len = comments.length,

    loop = function() {
      var el, txt, img;
      max = 0;
      while (max < 20 && indx < len) {
        if (indx >= len) {
          return;
        }
        el = comments[indx];
        if (el.querySelector(".email-quoted-reply")) {
          // ignore quoted messages
          txt = el.querySelector(".email-fragment").textContent;
        } else {
          txt = el.textContent;
        }
        // including ":" because someone posted "::+1::"; seen "+1."
        // seen "^^^" to bump posts; "bump plleeaaassee"
        txt = txt.replace(/([!,.:^[\]]|bump|pl+e+a+s+e+)/gi, "").trim();
        if (!txt) {
          img = el.querySelector("img");
          if (img) {
            txt = img.getAttribute("title") || img.getAttribute("alt");
          }
        }
        if (regex.test(txt) || txt === "" || txt.length < 5) {
          if (settings.plus1.isHidden) {
            closest(el, ".timeline-comment-wrapper").classList.add("ghic-hidden");
          } else if (!init) {
            closest(el, ".timeline-comment-wrapper").classList.remove("ghic-hidden");
          }
          max++;
        }
        indx++;
      }
      if (indx < len) {
        setTimeout(function() {
          loop();
        }, 200);
      }
    };
    loop();
  },

  hideParticipant = function(el) {
    var els, indx, len, hide, name,
      results = [];
    if (el) {
      el.classList.toggle("comments-hidden");
      hide = el.classList.contains("comments-hidden");
      name = el.getAttribute("aria-label");
      els = document.querySelectorAll(".js-discussion .author");
      len = els.length;
      for (indx = 0; indx < len; indx++) {
        if (els[indx].textContent.trim() === name) {
          results[results.length] = closest(els[indx], ".timeline-comment-wrapper, .commit-comment, .discussion-item");
        }
      }
      // use a different participant class name to hide timeline events
      // or unselecting all users will show everything
      if (el.classList.contains("comments-hidden")) {
        addClass(results, "ghic-hidden-participant");
      } else {
        removeClass(results, "ghic-hidden-participant");
      }
      results = [];
    }
  },

  regex = /(svg|path)/i,

  update = function() {
    var keys = Object.keys(settings),
      indx = keys.length;
    while (indx--) {
      // true flag for init - no need to remove classes
      hideStuff(keys[indx], true);
    }
  },

  checkItem = function(event) {
    busy = true;
    if (document.getElementById("discussion_bucket")) {
      var name,
      target = event.target,
      wrap = target && target.parentNode;
      if (target && wrap) {
        if (target.nodeName === "INPUT" && wrap.classList.contains("ghic-right")) {
          getInputValues();
          saveSettings();
          // extract ghic-{name}, because it matches the name in settings
          name = wrap.className.replace("ghic-right", "").trim();
          if (wrap.classList.contains(name)) {
            hideStuff(name.replace("ghic-", ""));
          }
        } else if (target.classList.contains("ghic-avatar")) {
          // make sure we're targeting the span wrapping the image
          hideParticipant(target.nodeName === "IMG" ? target.parentNode : target);
        } else if (regex.test(target.nodeName)) {
          // clicking on the SVG may target the svg or path inside
          hideParticipant(closest(target, ".ghic-avatar"));
        }
      }
    }
    busy = false;
  },

  init = function() {
    busy = true;
    getSettings();
    addMenu();
    document.querySelector("body").addEventListener("input", checkItem);
    document.querySelector("body").addEventListener("click", checkItem);
    update();
    busy = false;
  },

  // DOM targets - to detect GitHub dynamic ajax page loading
  targets = document.querySelectorAll([
    "#js-repo-pjax-container",
    "#js-pjax-container"
  ].join(","));

  // update TOC when content changes
  Array.prototype.forEach.call(targets, function(target) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // preform checks before adding code wrap to minimize function calls
        if (!busy && mutation.target === target) {
          addMenu();
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  init();

})();
