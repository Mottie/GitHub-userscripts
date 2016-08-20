// ==UserScript==
// @name          GitHub Sort Content
// @version       1.0.4
// @description   A userscript that makes some lists & markdown tables sortable
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @grant         GM_addStyle
// @require       https://cdnjs.cloudflare.com/ajax/libs/tinysort/2.3.6/tinysort.js
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// ==/UserScript==
/* global GM_addStyle, tinysort */
/* jshint esnext:true, unused:true */
(function() {
  "use strict";
  /* example pages:
    tables - https://github.com/Mottie/GitHub-userscripts
    Contribute repos & Your Repos - https://github.com/
    organization repos - https://github.com/jquery
    organization members - https://github.com/orgs/jquery/people
    pinned repos - https://github.com/addyosmani
    repos - https://github.com/addyosmani?tab=repositories
    stars - https://github.com/stars
  */
  const sorts = ["asc", "desc"],
  icons = {
    white: {
      unsorted : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHpNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiNkZGQ7b3BhY2l0eTowLjIiLz48L3N2Zz4=",
      asc : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHoiIHN0eWxlPSJmaWxsOiNkZGQiLz48cGF0aCBkPSJNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiNkZGQ7b3BhY2l0eTowLjIiLz48L3N2Zz4=",
      desc : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHoiIHN0eWxlPSJmaWxsOiNkZGQ7b3BhY2l0eTowLjIiLz48cGF0aCBkPSJNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiNkZGQiLz48L3N2Zz4="
    },
    black: {
      unsorted : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHpNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiMyMjI7b3BhY2l0eTowLjIiLz48L3N2Zz4=",
      asc : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHoiIHN0eWxlPSJmaWxsOiMyMjIiLz48cGF0aCBkPSJNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiMyMjI7b3BhY2l0eTowLjIiLz48L3N2Zz4=",
      desc : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHoiIHN0eWxlPSJmaWxsOiMyMjI7b3BhY2l0eTowLjIiLz48cGF0aCBkPSJNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiMyMjIiLz48L3N2Zz4="
    }
  },
  // toolbars - target for sort arrows
  regexBars = /\b(filter-bar|org-toolbar|sort-bar|tabnav-tabs)\b/;

  function initSortTable(el) {
    removeSelection();
    let dir = el.classList.contains(sorts[0]) ? sorts[1] : sorts[0],
      table = closest(el, "table");
    tinysort($$("tbody tr", table), {
      order: dir,
      natural: true,
      selector: `td:nth-child(${el.cellIndex + 1})`
    });
    $$("th", table).forEach(elm => {
      elm.classList.remove(...sorts);
    });
    el.classList.add(dir);
  }

  function initSortUl(arrows, list, selector) {
    if (list && list.children) {
      removeSelection();
      let dir = arrows.classList.contains(sorts[0]) ? sorts[1] : sorts[0],
        options = { order: dir, natural: true };
      if (selector) {
        options.selector = selector;
      }
      // using children because the big repo contains UL > DIV
      tinysort(list.children, options);
      arrows.classList.remove(...sorts);
      arrows.classList.add(dir);
    }
  }

  function needDarkTheme() {
    let brightest = 0,
      // color will be "rgb(#, #, #)" or "rgba(#, #, #, #)"
      color = window.getComputedStyle(document.body).backgroundColor,
      rgb = (color || "").replace(/\s/g, "").match(/^rgba?\((\d+),(\d+),(\d+)/i);
    if (rgb) {
      color = rgb.slice(1); // remove "rgb.." part from match
      color.forEach(c => {
        // http://stackoverflow.com/a/15794784/145346
        brightest = Math.max(brightest, parseInt(c, 10));
      });
      // return true if we have a dark background
      return brightest < 128;
    }
    // fallback to bright background
    return false;
  }

  function $(str, el) {
    return (el || document).querySelector(str);
  }
  function $$(str, el) {
    return Array.from((el || document).querySelectorAll(str));
  }
  function closest(el, selector) {
    while (el && el.nodeName !== "BODY" && !el.matches(selector)) {
      el = el.parentNode;
    }
    return el && el.matches(selector) ? el : null;
  }
  function removeSelection() {
    // remove text selection - http://stackoverflow.com/a/3171348/145346
    var sel = window.getSelection ? window.getSelection() : document.selection;
    if (sel) {
      if (sel.removeAllRanges) {
        sel.removeAllRanges();
      } else if (sel.empty) {
        sel.empty();
      }
    }
  }

  function init() {
    let styles = needDarkTheme() ? icons.white : icons.black;

    GM_addStyle(`
      /* unsorted icon */
      .markdown-body table thead th {
        cursor:pointer;
        padding-right:22px !important;
        background:url(${styles.unsorted}) no-repeat calc(100% - 5px) center !important;
      }
      div.js-pinned-repos-reorder-container > h3, .dashboard-sidebar .boxed-group > h3,
      div.filter-repos, div.repo-tab .filter-bar, .org-toolbar, .sort-bar, h2 + .tabnav > .tabnav-tabs {
        cursor:pointer;
        padding-right:10px;
        background-image:url(${styles.unsorted}) !important;
        background-repeat:no-repeat !important;
        background-position:calc(100% - 5px) center !important;
      }
      /* https://github.com/ */
      div.filter-repos { background-position:calc(100% - 5px) 80% !important; }
      /* https://github.com/:user?tab=repositories */
      div.repo-tab .filter-bar { background-position:338px 10px !important; }
      /* https://github.com/:organization */
      .org-toolbar { background-position:calc(100% - 5px) 10px !important; }
      /* https://github.com/stars */
      .sort-bar { background-position:525px 10px !important; }
      /* asc/dec icons */
      table thead th.asc, div.boxed-group h3.asc,
      div.filter-repos.asc, div.filter-bar.asc,
      .org-toolbar.asc, .sort-bar.asc, h2 + .tabnav > .tabnav-tabs.asc {
        background-image:url(${styles.asc}) !important;
        background-repeat:no-repeat !important;
        background-position:calc(100% - 5px) center !important;
      }
      table thead th.desc, div.boxed-group h3.desc,
      div.filter-repos.desc, div.filter-bar.desc,
      .org-toolbar.desc, .sort-bar.desc, h2 + .tabnav > .tabnav-tabs.desc {
        background-image:url(${styles.desc}) !important;
        background-repeat:no-repeat !important;
        background-position:calc(100% - 5px) center !important;
      }
      /* remove sort arrows */
      .popular-repos + div.boxed-group h3 {
        background-image:none !important;
        cursor:default;
      }
      /* Remove margin that overlaps sort arrow - https://github.com/:user?tab=repositories */
      .filter-bar li:last-child { margin-left: 0 !important; }
      /* move "Customize your pinned..." - https://github.com/:self */
      .pinned-repos-setting-link { margin-right:14px; }
    `);

    document.body.addEventListener("click", event => {
      let el,
        target = event.target,
        name = target.nodeName;
      if (target && target.nodeType === 1 && (
        // nodes th|h3 - form for stars page
        name === "H3" || name === "TH" || name === "FORM" ||
        // mini-repo & https://github.com/:user?tab=repositories (filter-bar)
        // https://github.com/:organization filter bar (org-toolbar)
        // https://github.com/stars (sort-bar)
        regexBars.test(target.className)
      )) {
        // don't sort tables not inside of markdown
        if (name === "TH" && closest(target, ".markdown-body")) {
          return initSortTable(target);
        }

        // following
        el = $("ol.follow-list", closest(target, ".container"));
        if (el) {
          return initSortUl(target, el, ".follow-list-name a");
        }

        // organization people - https://github.com/orgs/:organization/people
        el = $("ul.member-listing", target.parentNode);
        if (el) {
          return initSortUl(target, el, ".member-link");
        }

        // big repo list - https://github.com/:user?tab=repositories
        // stars - https://github.com/stars
        el = closest(target, ".sort-bar, .filter-bar, .org-toolbar");
        if (el && $(".repo-list", el.parentNode)) {
          return initSortUl(el, $(".repo-list", el.parentNode), ".repo-list-name a");
        }

        // mini-repo listings with & without filter - https://github.com/
        el = closest(target, ".boxed-group");
        // prevent clicking on the H3 header of filtered repos
        if (el && !(name === "H3" && el.classList.contains("js-repo-filter"))) {
          return initSortUl(target, $(".mini-repo-list", el));
        }
      }
    });
  }

  init();

})();
