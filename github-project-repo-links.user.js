// ==UserScript==
// @name         GitHub Projects with Repo Links
// @namespace    https://github.com/tony19
// @version      0.1
// @description  Linkifies repo names in GitHub project boards
// @author       Tony Trinh <tony19@gmail.com>
// @match        https://github.com/orgs/*/projects/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

;(() => {
  'use strict'

  const repos = {}

  // linkify repo names in card headers
  const cardHeaders = [
    ...document.querySelectorAll('[data-testid="board-card-header"] span'),
  ].filter(x => x.className.includes('Text'))
  cardHeaders.forEach(header => {
    const repoName = header.childNodes[0].textContent
    const baseUri = header.baseURI.split('/projects').at(0).replace('/orgs', '')
    const repoLink = `${baseUri}/${repoName}`
    const anchor = document.createElement('a')
    anchor.href = repoLink
    anchor.textContent = repoName

    // remove the first child node, which is the repo name, and replace it with a link to the repo
    header.childNodes[0].remove()
    header.prepend(anchor)

    repos[repoName] = repoLink
  })

  // add all repo links to breadcrumbs
  const ul = document.createElement('ul')
  ul.style.display = 'flex'
  ul.style.gap = '0.5rem'
  Object.entries(repos).forEach(([repoName, repoLink]) => {
    const anchor = document.createElement('a')
    anchor.href = repoLink
    anchor.textContent = repoName
    anchor.classList.add('AppHeader-context-item')
    const li = document.createElement('li')
    li.appendChild(anchor)
    ul.appendChild(li)
  })
  document.querySelector('.AppHeader-context-full ul')?.appendChild(ul)
})()
