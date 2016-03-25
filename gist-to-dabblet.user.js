// ==UserScript==
// @name          Gist to dabblet
// @version       2.0.0
// @description   Add a dabblet.com link button to any gist with dabblet information
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://gist.github.com/*
// @grant         GM_addStyle
// @run-at        document-idle
// @author        Rob Garrison
// @icon64URL     http://mottie.github.io/gist-to-dabblet/images/g2d.png
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-to-dabblet.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-to-dabblet.user.js
// ==/UserScript==
(function() {
  "use strict";

  GM_addStyle(".g2d-button { display:inline-block; width:18px; background-repeat:no-repeat; background-position:center top; }");

  var button,

  icons = {
    grey  : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAALVBMVEUAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX///9VVVX37ue8AAAADnRSTlMARN1VIjMR7sy7ZneqEdMqVloAAABNSURBVAjXYyASOKk5qYEZcg/lHmJlWLzTeyj36DED97t374CMVwx+L1n0wFLrnjLYwRlP5R4zgKUU0l8kgBULML97znDB4t1RBgbJ5wDtZybkJeFKhwAAAABJRU5ErkJggg==",
    white : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAKlBMVEUAAAD///////////////////////////////////////////////////+Gu8ovAAAADXRSTlMAd+7dRKqZiGbMIhEzr1+TpQAAAExJREFUCNdjIBL4BvgGgBmyF2QvYGUI3bW9IHtZi4H17t27QIYOQ+9FlrtgqVwFhlo4Q0H2NgNYKsH3GgNI8eUF7HdvgrRXMzA03wQARXIiwwVnjbIAAAAASUVORK5CYII=",
    black : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAJ1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADdEvm1AAAADHRSTlMAu3fdzBGqmYhmRO5Nxwc9AAAATElEQVQI12MgEugo6CiAGTICMgLYGKw9Z2wEZGwcGILPnDkDZLgy1JxiOgOWsklg8IEzEmQcGMBSE3ROMoAUH2RgOXMCqP20AtCW4wBomxaqzmf3OgAAAABJRU5ErkJggg=="
  },

  content = [
    "<a href='http://dabblet.com/gist/{gistid}' class='{class} tooltipped tooltipped-n' aria-label='Open at Dabblet.com'>",
      "<span class='g2d-button' style='background-image:url({icon})'>&nbsp;</span>",
      "&nbsp;dabblet",
    "</a>"
  ].join(""),

  hasClass = function(el, name) {
    if (el) {
      return el.classList ?
        el.classList.contains(name) :
        new RegExp("\\b" + name + "\\b").test(el.className);
    }
    return false;
  },

  closest = function(el, name) {
    while (el && !hasClass(el, name)) {
      el = el.parentNode;
    }
    return hasClass(el, name) ? el : null;
  },

  findDabbletGist = function() {
    var indx, len, el,
      list = [],
      hasDabblet = false,
      // main gist page
      gist = document.querySelector("#file-dabblet-css"),
      // list of gists page
      lists = document.querySelectorAll(".css-truncate-target");

    if (document.querySelectorAll(".gist-snippet").length) {
      indx = lists.length;
      while (indx--) {
        // only save dabblet files from list
        if (lists[indx].textContent.indexOf("dabblet.css") > -1) {
          list[list.length] = lists[indx];
        }
      }
    }
    len = list.length;
    if (gist || len) {
      if (len) {
        for (indx = 0; indx < len; indx++) {
          button = document.createElement("li");
          button.innerHTML = content
            .replace("{gistid}", list[indx].parentNode.href.match(/\d+$/))
            .replace("{class}", "")
            .replace("{icon}", icons.grey);
          el = closest(list[indx], "gist-snippet-meta").querySelector(".gist-count-links li");
          el.parentNode.insertBefore(button, el);
          el.parentNode.style.zIndex = 1;
        }
      } else if (gist) {
        button = document.createElement("li");
        button.innerHTML = content
          .replace("{gistid}", window.location.pathname.match(/\d+$/))
          .replace("{class}", "btn btn-sm")
          .replace("{icon}", icons.black);
        el = document.querySelector(".pagehead-actions li");
        el.parentNode.insertBefore(button, el);
      }
    }
  },

  targets = document.querySelectorAll("#js-repo-pjax-container, #js-pjax-container, .js-preview-body");

  Array.prototype.forEach.call(targets, function(target) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // preform checks before adding code wrap to minimize function calls
        if (!busy && mutation.target === target) {
          findDabbletGist();
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  findDabbletGist();

})();
