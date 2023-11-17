// ==UserScript==
// @name        GitHub Raw Context Menu
// @version     0.1.5
// @description Add a right-click menu on GitHub raw pages
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @match        *://raw.githubusercontent.com/*
// @run-at      document-idle
// @grant       GM_openInTab
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-raw-menu.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-raw-menu.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract the repo, branch, and file path from the raw URL
    function getRepoAndPath() {
        const pathArray = window.location.pathname.split('/');
        console.log(pathArray);

        const username = pathArray[1];
        const repo = pathArray[2];
        const branch = pathArray[3];
        const filePath = pathArray.slice(4).join('/');

        const result = { username, repo, branch, filePath };
        console.log(result);
        return result;
    }

    // Function to open the GitHub edit page in a new tab
    function openEditPage() {
        const { username, repo, branch, filePath } = getRepoAndPath();
        const editURL = `https://github.com/${username}/${repo}/edit/${branch}/${filePath}`;
        console.log(editURL);
        GM_openInTab(editURL, { active: true });
    }

    // Function to open the GitHub view page in a new tab
    function openViewPage() {
        const { username, repo, branch, filePath } = getRepoAndPath();
        const viewURL = `https://github.com/${username}/${repo}/blob/${branch}/${filePath}`;
        GM_openInTab(viewURL, { active: true });
    }

    // Add the "Edit on Github" and "View on Github" options to the context menu
    function addContextMenu() {
        const contextMenu = document.createElement('div');
        contextMenu.id = 'github-edit-context-menu';
        contextMenu.style.position = 'fixed';
        contextMenu.style.display = 'none';
        contextMenu.style.zIndex = '9999';
        contextMenu.style.backgroundColor = 'white';
        contextMenu.style.border = '1px solid #ccc';
        contextMenu.style.padding = '8px';

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit on Github';
        editButton.addEventListener('click', openEditPage);

        const viewButton = document.createElement('button');
        viewButton.textContent = 'View on Github';
        viewButton.addEventListener('click', openViewPage);

        contextMenu.appendChild(editButton);
        contextMenu.appendChild(viewButton);
        document.body.appendChild(contextMenu);

        document.addEventListener('contextmenu', function (event) {
            event.preventDefault();

            const contextMenu = document.getElementById('github-edit-context-menu');
            contextMenu.style.left = (event.pageX - 10) + 'px';
            contextMenu.style.top = (event.pageY - 10) + 'px';
            contextMenu.style.display = 'block';
        });

        document.addEventListener('click', function () {
            const contextMenu = document.getElementById('github-edit-context-menu');
            contextMenu.style.display = 'none';
        });
    }

    // Initialize the userscript
    addContextMenu();
})();
