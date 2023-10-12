// ==UserScript==
// @name        Expand all PR comments
// @version     1.0.0
// @description Add a button "Expand" which expands automatically all comments on the PR page marked with "hidden items" or "hidden conversations" and initially requiring iterative manual clicking.
// @license     MIT
// @author      Konstantin Knyazkov
// @homepage    https://github.com/ze0n
// @namespace   https://github.com/Mottie
// @match       https://github.com/*/*/pull/*
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @grant       none
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-expand-pr-comments.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-expand-pr-comments.user.js
// ==/UserScript==

(function() {
	'use strict';

	const ButtonPlacement = {
		LeftFixed: "leftFixed",
		RightSidebar: "rightSidebar",
	}

	const AfterExpandedBehavior = {
		RemoveButton: "removeButton",
		ExpandedText: "expandedText"
	}

	// Constants
	const DEBUG = false; // console logging on/off
	const sideBarGithubId = "partial-discussion-sidebar";
	const buttonGithubClassName = "btn";
	const buttonPlaceMode = ButtonPlacement.RightSidebar;
	const afterExpandMode = AfterExpandedBehavior.ExpandedText;
	const expandButtonId = "_ExpandAllCommentsBtnId";
	const expandButtonExpandText = "Expand all comments";
	const expandButtonExpandedText = "Expanded";
	const expandingButtonExpandedText = "Expanding...";
	const defaultNumberOffRetriesWithoutEffectBeforeStop = 5;
	const intervalBetweenRetriesMs = 2000;

	function expandAllButtonsRecursive(notEffectiveRetriesLeftToDo, accumulatingNumberOfExpandedFragments)
	{
		const expandButton = document.getElementById(expandButtonId);

		if(DEBUG){
			console.log(expandButton);
		}

		if(notEffectiveRetriesLeftToDo === 0){
			// Done
			if(afterExpandMode === AfterExpandedBehavior.ExpandedText){
				expandButton.innerHTML = expandButtonExpandedText;
			}else if(afterExpandMode === AfterExpandedBehavior.RemoveButton){
				expandButton.display = "none";
			}
		}
		else if(notEffectiveRetriesLeftToDo > 0) {
			// Continue expanding
			expandButton.innerHTML = expandingButtonExpandedText + " (" + accumulatingNumberOfExpandedFragments + ")";
			expandButton.disabled = true;
		}

		// Find all visible fragments to expand
		const buttons1 = document.evaluate("//button[contains(normalize-space(text()), 'hidden items')]", document, null, XPathResult.ANY_TYPE, null );
		const buttons2 = document.evaluate("//button[contains(normalize-space(text()), 'hidden conversations')]", document, null, XPathResult.ANY_TYPE, null );
		const allButtons = [];

		let cur;
		while(cur = buttons1.iterateNext()){
			allButtons.push(cur);
		}
		while(cur = buttons2.iterateNext()){
			allButtons.push(cur);
		}

		let numberOfExpandedFragmentsOnIteration = 0;
		let updatedNotEffectiveRetriesLeftToDo = notEffectiveRetriesLeftToDo;

		allButtons.forEach((currentButton)=>{
			if(DEBUG){
				console.log(currentButton);
			}
			currentButton.click(); // Emulate click to expand a fragment
			numberOfExpandedFragmentsOnIteration ++;
			return 1;
		})

		let isNextIterationNeeded = true;
		if(numberOfExpandedFragmentsOnIteration > 0){
			updatedNotEffectiveRetriesLeftToDo = defaultNumberOffRetriesWithoutEffectBeforeStop;
		}else if(numberOfExpandedFragmentsOnIteration == 0 && updatedNotEffectiveRetriesLeftToDo > 0){
			updatedNotEffectiveRetriesLeftToDo --;
		}else if(numberOfExpandedFragmentsOnIteration == 0 && updatedNotEffectiveRetriesLeftToDo == 0){
			isNextIterationNeeded = false;
		}

		if(isNextIterationNeeded){
			setTimeout(expandAllButtonsRecursive, intervalBetweenRetriesMs, updatedNotEffectiveRetriesLeftToDo, accumulatingNumberOfExpandedFragments+numberOfExpandedFragmentsOnIteration);
		}
	}

	function addExpandButton(buttonText, onclick) {
		let cssObj = {};

		if(buttonPlaceMode === ButtonPlacement.LeftFixed){
			cssObj = {position: 'fixed', top: '150px', left:'30px', 'z-index': 3};
		}

		let button = document.createElement('button'), btnStyle = button.style;
		document.body.appendChild(button);
		button.innerHTML = buttonText;
		button.id = expandButtonId;
		button.onclick = onclick;
		Object.keys(cssObj).forEach(key => {btnStyle[key] = cssObj[key]; return 1;});
		button.className = buttonGithubClassName;

		if(buttonPlaceMode === ButtonPlacement.RightSidebar)
		{
			const sideBar = document.getElementById(sideBarGithubId);
			let container = document.createElement('div')
			container.className = "discussion-sidebar-item";
			sideBar.appendChild(container);
			container.appendChild(button);
		}

		return button;
	}

	function expandButtonClickFunction() {
		expandAllButtonsRecursive(defaultNumberOffRetriesWithoutEffectBeforeStop, 0);
	}

	window.addEventListener('load', () => {
		const btn = addExpandButton(expandButtonExpandText, expandButtonClickFunction);

		if(DEBUG){
			console.log("Expand button has been added", btn);
		}
	})

})();
