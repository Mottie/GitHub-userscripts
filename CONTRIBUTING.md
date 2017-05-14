# Contributing to GitHub-userscripts

* [Getting Involved](#getting-involved)
* [How To Report Issues, Or Make Requests](#how-to-report-issues-or-make-requests)
* [Contributing Code](#contributing-code)
   * [Installation](#installation)
   * [Style Guide](#style-guide)
   * [Pull Requests](#pull-requests)
     * [Collaborators](#collaborators)
     * [Everyone else](#everyone-else)

## Getting Involved

There are a number of ways to get involved with the development of these userscripts. Even if you've never contributed to an Open Source project before, we're always looking for help identifying issues.

## How to Report Issues, Or Make Requests.

* First off make sure it's a new issue. Search the [issues](https://github.com/Mottie/GitHub-userscripts/issues).
* If there is an existing issue or feature request, then please feel free to add a comment or reaction!
* If you have a question instead of an issue:
  * Please don't open a new issue.
  * Jump on [Gitter](https://gitter.im/Mottie) and leave me a message.
  * Or, ask the question on [Stackoverflow](http://stackoverflow.com/questions/tagged/userscripts) (tagged with `javascript` and `userscript`).
* If you do open a new issue:
  * Report if the problem only occurs in a particular browser, operating system or userscript addon (e.g. Tampermonkey, GreaseMonkey, etc).
  * Please include any *relevant* code (posting the entire page of code usually isn't helpful).
  * Include any related errors show up in the console (press <kbd>F12</kbd> in the browser and go to the console tab).
  * Add [screenshots](http://getgreenshot.org/), [animated gifs](http://www.cockos.com/licecap/), videos (check out [screenr](https://www.screenr.com/)) or funny cat pictures. You never know what might help!

## Contributing Code

### Installation:

The only thing you must have is a browser extension or addon that handles userscripts - see [installation instructions](https://github.com/Mottie/GitHub-userscripts#installation).

### Style Guide:

* We're not too strict (royal "we"), just try to follow the style that is already being used in the code; see the set [`.eslintrc` rules](https://github.com/Mottie/GitHub-userscripts/blob/master/.eslintrc) and/or [`.editorconfig`](https://github.com/Mottie/GitHub-userscripts/blob/master/.editorconfig) file.
* When naming variables:
  * Use names that describe the contents of the variable. I'm guilty of naming things `t` and `i`, but I'm slowly trying to rename them to make reading code and finding the variable in the code easier.
  * Use camel-casing as needed.
* We like semicolons!
* We like double quotes!
* We like tabs! But, sometimes you'll find a script that is only using spaces... be consistent please.
* We *try* to wrap all lines at 80 characters. It isn't always possible, like in the metadata at the top, but please wrap the rest of the code at that limit.

### Pull Requests:

#### Collaborators

* You have permission to push changes to the master branch.
* Please bump the userscript version once; multiple commits per release will only need to modify the version once.
* Optional - these are maintenance things I do for every release, feel free to leave them for me if you don't feel like it:
  * Change the "Updated" column in the main README.md for the associated script.
  * Bump the main repository version number in the `package.json` file.
  * Add a matching version tag for the release.
  * Update the associated userscript's change log (e.g. here is a link to the [code-colors userscript wiki page](https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-colors#change-log)) with whatever commits were included.
* GreasyFork will automatically update to match the new version.
* OpenUsersJS will need some coaxing to update.... I'll have to do this on my own since the userscripts are associated with my account.

#### Everyone else

* Before opening a pull request, please make sure that your code is on a *fork* of the master. This is really for your own convenience: it's easy for us to accept your pull request from your master branch, but it's problematic for your fork when you want to pull the changes back and your master branch has diverged from upstream's master branch.
* Please check your changes!
  * Check the linting. If you are using [Atom](https://atom.io/) or an editor that supports use of eslint through checking the `.eslintrc` file or the `.editorconfig` file. An extra linting package may need to be installed. Otherwise, check your code by copying and pasting it into http://jshint.com/.
  * There aren't any unit tests associated with these userscripts... I'm not even sure if it is possible to automatate testing of userscripts on GitHub... but a quick manual test of the userscript to make sure there are no console errors (press <kbd>F12</kbd> then select the `console` tab) during use would be awesome!
* There is no need to open an issue, then create a pull request. Fork this repository, make your changes and create the pull request. Then in the pull request, add any comments about your changes there.
