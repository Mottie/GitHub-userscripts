// ==UserScript==
// @name          GitHub Image Preview
// @version       1.0.5
// @description   A userscript that adds clickable image thumbnails
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_addStyle
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_xmlhttpRequest
// @connect       github.com
// @connect       githubusercontent.com
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-image-preview.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-image-preview.user.js
// ==/UserScript==
/* global GM_addStyle, GM_getValue, GM_setValue, GM_xmlhttpRequest */
/*jshint unused:true */
(function() {
  "use strict";

  GM_addStyle([
    "table.files tr.ghip-image-previews, table.files.ghip-show-previews tbody tr.js-navigation-item { display:none; }",
    "table.files.ghip-show-previews tr.ghip-image-previews { display:table-row; }",
    "table.files.ghip-show-previews .ghip-non-image { height:80px; margin-top:15px; opacity:.2; }",
    "table.files.ghip-show-previews .image { position:relative; overflow:hidden; text-align:center; }",
    ".ghip-image-previews .image { padding:10px; }",
    "table.files.ghip-tiled .image { width:21.9%; }",
    "table.files.ghip-tiled .image .border-wrap img, .ghip-image-previews .border-wrap svg { max-height:130px; }",
    "table.files.ghip-fullw .image { width:97%; height:auto; }",
    // zoom doesn't work in Firefox, but `-moz-transform:scale(3);` doesn't limit the size of the image, so it overflows
    "table.files.ghip-tiled .image:hover img:not(.ghip-non-image) { zoom:3; }",
    ".ghip-image-previews .border-wrap img, .ghip-image-previews .border-wrap svg { max-width:95%; }",
    ".ghip-image-previews .border-wrap h4 { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; margin-bottom:5px; }",
    ".btn.ghip-tiled > *, .btn.ghip-fullw > *, .ghip-image-previews iframe { pointer-events:none; }",
    ".image .ghip-file-type { font-size:30px; top:-65px; position:relative; z-index:2; }",
    // override GitHub-Dark styles
    "table.files img[src*='octocat-spinner'], img[src='/images/spinner.gif'] { width:auto !important; height:auto !important; }",
    "table.files td .simplified-path { color:#888 !important; }"
  ].join(""));

  var busy = false,

  // supported img types
  imgExt = /(png|jpg|jpeg|gif|tif|tiff|bmp|webp)$/,
  svgExt = /svg$/,

  tiled = [
    "<svg class='octicon' xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'>",
      "<path d='M0 0h7v7H0zM9 9h7v7H9zM9 0h7v7H9zM0 9h7v7H0z'/>",
    "</svg>"
  ].join(""),

  fullWidth = [
    "<svg class='octicon' xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'>",
      "<path d='M0 0h16v7H0zM0 9h16v7H0z'/>",
    "</svg>"
  ].join(""),

  imgTemplate = [
    "<a href='${url}' class='exploregrid-item image js-navigation-open' rel='nofollow'>",
      "<span class='border-wrap'>${image}</span>",
    "</a>"
  ].join(""),

  spanTemplate = [
    "<span class='exploregrid-item image'>",
      "<span class='border-wrap'>${image}</span>",
    "</span>"
  ].join(""),

  addToggles = function() {
    if (document.querySelector(".gh-img-preview")) { return; }
    busy = true;
    var div = document.createElement("div"),
      btn = " btn btn-sm tooltipped tooltipped-n' aria-label='Show ";
    div.className = "btn-group right gh-img-preview";
    div.innerHTML = [
      "<div class='ghip-tiled" + btn + "tiled files with image preview'>" + tiled + "</div>",
      "<div class='ghip-fullw" + btn + "full width files with image preview'>" + fullWidth + "</div>"
    ].join("");
    document.querySelector(".file-navigation").appendChild(div);

    div.querySelector(".ghip-tiled").addEventListener("click", function() {
      openView("tiled");
    });
    div.querySelector(".ghip-fullw").addEventListener("click", function() {
      openView("fullw");
    });
    busy = false;
  },

  setInitState = function() {
    var view = GM_getValue("gh-image-preview");
    if (view) {
      openView(view);
    }
  },

  openView = function(name) {
    var el = document.querySelector(".ghip-" + name);
    if (el) {
      el.classList.toggle("selected");
      if (el.classList.contains("selected")) {
        GM_setValue("gh-image-preview", name);
        showPreview(name);
      } else {
        GM_setValue("gh-image-preview", "");
        showList();
      }
    }
  },

  showPreview = function(size) {
    buildPreviews();
    var table = document.querySelector("table.files"),
      btn1 = "ghip-" + size,
      btn2 = "ghip-" + (size === "fullw" ? "tiled" : "fullw");
    table.classList.add("ghip-show-previews");
    table.classList.add(btn1);
    document.querySelector(".btn." + btn1).classList.add("selected");
    table.classList.remove(btn2);
    document.querySelector(".btn." + btn2).classList.remove("selected");
  },

  showList = function() {
    var table = document.querySelector("table.files");
    table.classList.remove("ghip-show-previews");
    table.classList.remove("ghip-tiled");
    table.classList.remove("ghip-fullw");
    document.querySelector(".btn.ghip-tiled").classList.remove("selected");
    document.querySelector(".btn.ghip-fullw").classList.remove("selected");
  },

  buildPreviews = function() {
    busy = true;
    var template, url, temp, noExt,
      indx = 0,
      row = document.createElement("tr"),
      imgs = "<td colspan='4' class='ghip-content'>",
      table = document.querySelector("table.files tbody:last-child"),
      files = document.querySelectorAll("tr.js-navigation-item"),
      len = files.length;
    row.className = "ghip-image-previews";
    if (document.querySelector(".ghip-image-previews")) {
      temp = document.querySelector(".ghip-image-previews");
      temp.parentNode.removeChild(temp);
    }
    if (table) {
      for (indx = 0; indx < len; indx++) {
        // not every submodule includes a link; reference examples from
        // see https://github.com/electron/electron/tree/v1.1.1/vendor
        temp = files[indx].querySelector("td.content a") ||
          files[indx].querySelector("td.content span span");
        // use innerHTML because some links include path - see "third_party/lss"
        template = temp ? temp.innerHTML.trim() + "</h4>" : "";
        // temp = temp && temp.querySelector("a");
        url = temp && temp.nodeName === "A" ? temp.href : "";
        // add link color
        template = (url ? "<h4 class='text-blue'>" : "<h4>") + template;
        if (imgExt.test(url)) {
          // *** image preview ***
          template += "<img src='" + url + "?raw=true'/>";
          imgs += imgTemplate.replace("${url}", url).replace("${image}", template);
        } else if (svgExt.test(url)) {
          // *** svg preview ***
          // loaded & encoded because GitHub sets content-type headers as a string
          temp = url.substring(url.lastIndexOf("/") + 1, url.length);
          template += "<img data-svg-holder='" + temp + "' alt='" + temp + "' />";
          imgs += updateTemplate(url, template);
          getSVG(url + "?raw=true");
        } else {
          // *** non-images (file/folder icons) ***
          temp = files[indx].querySelector("td.icon svg");
          if (temp) {
            // non-files svg class: "octicon-file-directory" or "octicon-file-submodule"
            noExt = temp.classList.contains("octicon-file-directory") ||
              temp.classList.contains("octicon-file-submodule");
            // add xmlns otherwise the svg won't work inside an img
            // GitHub doesn't include this attribute on any svg octicons
            temp = temp.outerHTML.replace("<svg", "<svg xmlns='http://www.w3.org/2000/svg'");
            // include "leaflet-tile-container" to invert icon for GitHub-Dark
            template += "<span class='leaflet-tile-container'>" +
              "<img class='ghip-non-image' src='data:image/svg+xml;base64," + window.btoa(temp) + "'/>" +
              "</span>";
            // get file name + extension
            temp = url.substring(url.lastIndexOf("/") + 1, url.length);
            // don't include extension for folders, or files with no extension, or
            // files starting with a "." (e.g. ".gitignore")
            if (!noExt && temp.indexOf(".") > 0) {
              template += "<h4 class='ghip-file-type'>" +
                temp.substring(temp.lastIndexOf(".") + 1, temp.length).toUpperCase() + "</h4>";
            }
            if (url) {
              imgs += updateTemplate(url, template);
            } else {
              // empty url; use non-link template
              // see "depot_tools @ 4fa73b8" at https://github.com/electron/electron/tree/v1.1.1/vendor
              imgs += updateTemplate(url, template, spanTemplate);
            }
          } else if (files[indx].classList.contains("up-tree")) {
            // Up tree link
            temp = files[indx].querySelector("td:nth-child(2) a");
            url = temp ? temp.href : "";
            if (url) {
              imgs += updateTemplate(url, "<h4 class='text-blue'>&middot;&middot</h4>");
            }
          }
        }
      }
      row.innerHTML = imgs + "</td>";
      table.appendChild(row);
    }
    busy = false;
  },

  updateTemplate = function(url, img, tmpl) {
    return (tmpl || imgTemplate)
      .replace("${url}", url)
      .replace("${image}", img);
  },

  getSVG = function(url) {
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      onload : function(response) {
        busy = true;
        var encoded,
          url = response.finalUrl,
          file = url.substring(url.lastIndexOf("/") + 1, url.length),
          target = document.querySelector("[data-svg-holder='" + file+ "']");
        if (target) {
          encoded = window.btoa(response.responseText);
          target.src = "data:image/svg+xml;base64," + encoded;
        }
        busy = false;
      }
    });
  },

  init = function() {
    if (document.querySelector("table.files")) {
      addToggles();
      setInitState();
    }
  },

  // timer needed for file list to update?
  timer,

  // DOM targets - to detect GitHub dynamic ajax page loading
  targets = document.querySelectorAll([
    "#js-repo-pjax-container",
    ".context-loader-container",
    "[data-pjax-container]"
  ].join(","));

  Array.prototype.forEach.call(targets, function(target) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // preform checks before adding code wrap to minimize function calls
        if (!busy && mutation.target === target) {
          clearTimeout(timer);
          timer = setTimeout(init, 200);
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  init();

})();
