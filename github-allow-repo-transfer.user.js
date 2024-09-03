// ==UserScript==
// @name        GitHub Allow Repo Transfer
// @version     1.0.0
// @description Automatically fills repo name on transfer form on GitHub
// @license     MIT
// @author      Rob Garrison, Bluscream
// @namespace   https://github.com/Mottie
// @match       https://github.com/*/*/transfer
// @run-at      document-idle
// @grant       GM_registerMenuCommand
// @grant       GM.registerMenuCommand
// @grant       GM.addStyle
// @grant       GM_addStyle
// @grant       GM.getValue
// @grant       GM_getValue
// @grant       GM.setValue
// @grant       GM_setValue
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-allow-repo-transfer.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-allow-repo-transfer.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==

(function() {
    'use strict';
    // console.warn(`start`);
    function getElementByXpath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function fillTransferForm() {

        // Find the input field
        const inputField = document.querySelector('input[data-testid=transfer-repo-confirmation]');
        if (!inputField) return;

        // Find the label span
        const labelSpan = getElementByXpath('/html/body/div[1]/div[5]/main/react-app/div/form/div[3]/div[3]/div/label/span/div/b');
        if (!labelSpan) return;

        // Get the text content of the label span
        const labelText = labelSpan.textContent.trim();
        console.warn(`labelText: ${labelText}`);

        // Fill the input field
        inputField.value = labelText;

        // console.warn(`finished`);
    }

    // Wait for the DOM to load
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', fillTransferForm);
    } else {
        fillTransferForm();
    }
    // console.warn(`end`);
})();

