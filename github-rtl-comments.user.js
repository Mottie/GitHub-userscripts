// ==UserScript==
// @name          GitHub RTL Comment Blocks
// @version       1.1.0
// @description   A userscript that adds a button to insert RTL text blocks in comments
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_addStyle
// @connect       github.com
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-rtl-comments.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-rtl-comments.user.js
// ==/UserScript==
/*jshint unused:true, esnext:true */
/* global GM_addStyle */
(function() {
  "use strict";

  let targets,
    busy = false;

  const icon = `
    <svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
      <path d="M14 3v8l-4-4m-7 7V6C1 6 0 5 0 3s1-3 3-3h7v2H9v12H7V2H5v12H3z"/>
    </svg>`,

    // maybe using &#x2067; RTL text &#x2066; (isolates) is a better combo?
    openRTL = "&rlm;",  // https://en.wikipedia.org/wiki/Right-to-left_mark
    closeRTL = "&lrm;", // https://en.wikipedia.org/wiki/Left-to-right_mark

    regexOpen = /\u200f/ig,
    regexClose = /\u200e/ig,
    regexSplit = /(\u200f|\u200e)/ig;

  GM_addStyle(`
    .ghu-rtl-css { direction:rtl; text-align:right; unicode-bidi:isolate; }
    /* delegated binding; ignore clicks on svg & path */
    .ghu-rtl > * { pointer-events:none; }
    /* override RTL on code blocks */
    .js-preview-body pre, .markdown-body pre, .js-preview-body code, .markdown-body code {
      direction:ltr;
      text-align:left;
      unicode-bidi:normal;
    }
  `);

  // Add monospace font toggle
  function addRtlButton() {
    busy = true;
    let el, button,
      toolbars = $$(".toolbar-commenting"),
      indx = toolbars.length;
    if (indx) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "ghu-rtl toolbar-item tooltipped tooltipped-n";
      button.setAttribute("aria-label", "RTL");
      button.setAttribute("tabindex", "-1");
      button.innerHTML = icon;
      while (indx--) {
        el = toolbars[indx];
        if (!$(".ghu-rtl", el)) {
          el.insertBefore(button.cloneNode(true), el.childNodes[0]);
        }
      }
    }
    checkRTL();
    busy = false;
  }

  function checkContent(el) {
    // check the contents, and wrap in either a span or div
    let indx, // useDiv,
      html = el.innerHTML,
      parts = html.split(regexSplit),
      len = parts.length;
    for (indx = 0; indx < len; indx++) {
      if (regexOpen.test(parts[indx])) {
        // check if the content contains HTML
        // useDiv = regexTestHTML.test(parts[indx + 1]);
        // parts[indx] = (useDiv ? "<div" : "<span") + " class='ghu-rtl-css'>";
        parts[indx] = "<div class='ghu-rtl-css'>";
      } else if (regexClose.test(parts[indx])) {
        // parts[indx] = useDiv ? "</div>" : "</span>";
        parts[indx] = "</div>";
      }
    }
    el.innerHTML = parts.join("");
    // remove empty paragraph wrappers (may have previously contained the mark)
    return el.innerHTML.replace(/<p><\/p>/g, "");
  }

  function checkRTL() {
    let clone,
      indx = 0,
      div = document.createElement("div"),
      containers = $$(".js-preview-body, .markdown-body"),
      len = containers.length,
      // main loop
      loop = function() {
        let el, tmp,
          max = 0;
        while (max < 10 && indx < len) {
          if (indx > len) {
            return;
          }
          el = containers[indx];
          tmp = el.innerHTML;
          if (regexOpen.test(tmp) || regexClose.test(tmp)) {
            clone = div.cloneNode();
            clone.innerHTML = tmp;
            // now we can replace all instances
            el.innerHTML = checkContent(clone);
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
  }

  function $(selector, el) {
    return (el || document).querySelector(selector);
  }
  function $$(selector, el) {
    return Array.from((el || document).querySelectorAll(selector));
  }
  function closest(el, selector) {
    while (el && el.nodeName !== "BODY" && !el.matches(selector)) {
      el = el.parentNode;
    }
    return el && el.matches(selector) ? el : [];
  }

  function addBindings() {
    $("body").addEventListener("click", function(event) {
      let textarea,
        target = event.target;
      if (target && target.classList.contains("ghu-rtl")) {
        textarea = closest(target, ".previewable-comment-form");
        textarea = $(".comment-form-textarea", textarea);
        textarea.focus();
        // add extra white space around the tags
        surroundSelectedText(textarea, ' ' + openRTL + ' ', ' ' + closeRTL + ' ');
        return false;
      }
    });
  }

  targets = $$("#js-repo-pjax-container, #js-pjax-container, .js-preview-body");

  Array.prototype.forEach.call(targets, function(target) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // preform checks before adding code wrap to minimize function calls
        if (!busy && mutation.target === target) {
          addRtlButton();
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  addBindings();
  addRtlButton();

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

  surroundSelectedText = function(el, before, after, selectionBehaviour) {
    if (typeof after == UNDEF) {
      after = before;
    }
    var sel = getSelection(el);
    var pasteInfo = pasteText(el, before + sel.text + after);
    updateSelectionAfterInsert(el, pasteInfo.index + before.length, sel.text, selectionBehaviour || "select");
  };

})();
