# GitHub userscripts [![tag](https://img.shields.io/github/tag/Mottie/GitHub-userscripts.svg)](https://github.com/Mottie/GitHub-userscripts/tags)

Userscripts to add functionality to GitHub.

## Installation

1. Make sure you have user scripts enabled in your browser (these instructions refer to the latest versions of the browser):

	* Firefox - install [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/).
	* Chrome - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=chrome) or [NinjaKit](https://chrome.google.com/webstore/detail/gpbepnljaakggeobkclonlkhbdgccfek).
	* Opera - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=opera) or [Violent Monkey](https://addons.opera.com/en/extensions/details/violent-monkey/).
	* Safari - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=safari) or [NinjaKit](http://ss-o.net/safari/extension/NinjaKit.safariextz).
	* Dolphin - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=dolphin).
	* UC Browser - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=ucweb).

2. Get more information about the userscript by clicking on the named link. Or install it directly or from the GreasyFork site:

	| Userscript Wiki                        | Ext | Direct Install     | GreasyFork     | Created    | Updated    |
	|----------------------------------------|:---:|:------------------:|:--------------:|:----------:|:----------:|
	| [GitHub code colors][ccs-wiki]         |     | [install][ccs-raw] | [site][ccs-gf] | 2016.03.20 | 2017.03.25 |
	| [GitHub code folding][cfd-wiki]        |     | [install][cfd-raw] | [site][cfd-gf] | 2016.12.28 | 2017.03.25 |
	| [GitHub code guides][cgl-wiki]         |     | [install][cgl-raw] | [site][cgl-gf] | 2016.08.27 | 2017.03.25 |
	| [GitHub code show whitespace][csw-wiki]|     | [install][csw-raw] | [site][csw-gf] | 2017.03.26 | 2017.03.26 |
	| [GitHub collapse in comment][cic-wiki] |  *  | [install][cic-raw] | [site][cic-gf] | 2016.06.27 | 2017.03.25 |
	| [GitHub collapse markdown][cmd-wiki]   |  *  | [install][cmd-raw] | [site][cmd-gf] | 2016.06.27 | 2017.03.25 |
	| [GitHub custom hotkeys][chk-wiki]      |     | [install][chk-raw] | [site][chk-gf] | 2016.04.10 | 2017.03.25 |
	| [GitHub custom navigation][cnv-wiki]   |     | [install][cnv-raw] | [site][cnv-gf] | 2016.06.22 | 2017.03.25 |
	| [GitHub diff files filter][dff-wiki]   |     | [install][dff-raw] | [site][dff-gf] | 2016.12.31 | 2017.03.25 |
	| [GitHub diff links][dfl-wiki]          |     | [install][dfl-raw] | [site][dfl-gf] | 2016.07.21 | 2017.03.25 |
	| [GitHub font preview][fpv-wiki]        |     | [install][fpv-raw] | [site][fpv-gf] | 2016.06.11 | 2017.03.25 |
	| [GitHub image preview][ipv-wiki]       |     | [install][ipv-raw] | [site][ipv-gf] | 2016.05.17 | 2017.03.25 |
	| [GitHub indent comments][ioc-wiki]     |     | [install][ioc-raw] | [site][ioc-gf] | 2017.03.15 | 2017.03.25 |
	| [GitHub issue comments][ic1-wiki]      |     | [install][ic1-raw] | [site][ic1-gf] | 2016.04.04 | 2017.03.25 |
	| [GitHub issue counts][ic2-wiki]        |     | [install][ic2-raw] | [site][ic2-gf] | 2012.01.16 | 2017.03.25 |
	| [GitHub issue highlighter][gih-wiki]   |     | [install][gih-raw] | [site][gih-gf] | 2016.05.21 | 2017.03.25 |
	| [GitHub label color picker][glc-wiki]  |     | [install][glc-raw] | [site][glc-gf] | 2016.09.16 | 2017.03.25 |
	| [GitHub remove diff signs][rds-wiki]   |     | [install][rds-raw] | [site][rds-gf] | 2016.04.05 | 2017.03.25 |
	| [GitHub rtl comments][rtl-wiki]        |     | [install][rtl-raw] | [site][rtl-gf] | 2016.06.13 | 2017.03.25 |
	| [GitHub sort content][srt-wiki]        |     | [install][srt-raw] | [site][srt-gf] | 2016.07.13 | 2017.03.25 |
	| [GitHub table of contents][toc-wiki]   |     | [install][toc-raw] | [site][toc-gf] | 2016.03.28 | 2017.03.25 |
	| [GitHub title notification][tbn-wiki]  |     | [install][tbn-raw] | [site][tbn-gf] | 2016.03.24 | 2017.03.25 |
	| [GitHub toggle expanders][tex-wiki]    |     | [install][tex-raw] | [site][tex-gf] | 2016.09.17 | 2017.03.25 |
	| [GitHub toggle wiki sidebar][tws-wiki] |     | [install][tws-raw] | [site][tws-gf] | 2016.04.01 | 2017.03.25 |
	| [Gist to dabblet][g2d-wiki]            |     | [install][g2d-raw] | [site][g2d-gf] | 2012.01.26 | 2017.03.25 |

\* "Ext" column indicates that the userscript has been included in the [Octopatcher](https://github.com/Mottie/Octopatcher) browser extension/addon.

[ccs-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-colors
[cfd-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-folding
[cgl-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-guides
[chk-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-custom-hotkeys
[cic-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-collapse-in-comment
[cmd-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-collapse-markdown
[cnv-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-custom-navigation
[csw-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-show-whitespace
[dff-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-diff-files-filter
[dfl-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-diff-links
[fpv-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-font-preview
[g2d-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/Gist-to-dabblet
[gih-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-issue-highlighter
[glc-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-label-color-picker
[ic1-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-issue-comments
[ic2-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-issue-counts
[ioc-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-indent-comments
[ipv-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-image-preview
[rds-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-remove-diff-signs
[rtl-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-rtl-comments
[srt-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-sort-content
[tbn-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-title-notification
[tex-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-toggle-expanders
[toc-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-table-of-contents
[tws-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-toggle-wiki-sidebar

[ccs-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
[cfd-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-folding.user.js
[cgl-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-guides.user.js
[chk-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-custom-hotkeys.user.js
[cic-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-collapse-in-comment.user.js
[cmd-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-collapse-markdown.user.js
[cnv-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-custom-navigation.user.js
[csw-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-show-whitespace.user.js
[dff-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-files-filter.user.js
[dfl-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-links.user.js
[fpv-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-font-preview.user.js
[g2d-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-to-dabblet.user.js
[gih-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-highlighter.user.js
[glc-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-label-color-picker.user.js
[ic1-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-comments.user.js
[ic2-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-counts.user.js
[ioc-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-indent-comments.user.js
[ipv-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-image-preview.user.js
[rds-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
[rtl-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-rtl-comments.user.js
[srt-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
[tbn-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-title-notification.user.js
[tex-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
[toc-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toc.user.js
[tws-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-wiki-sidebar.user.js

[ccs-gf]: https://greasyfork.org/en/scripts/18141-github-code-colors
[cfd-gf]: https://greasyfork.org/en/scripts/26109-github-code-folding
[cgl-gf]: https://greasyfork.org/en/scripts/22674-github-code-guides
[chk-gf]: https://greasyfork.org/en/scripts/18675-github-custom-hotkeys
[cic-gf]: https://greasyfork.org/en/scripts/20973-github-collapse-in-comment
[cmd-gf]: https://greasyfork.org/en/scripts/20974-github-collapse-markdown
[cnv-gf]: https://greasyfork.org/en/scripts/20830-github-custom-navigation
[csw-gf]: https://greasyfork.org/en/scripts/28454-github-code-show-whitespace
[dff-gf]: https://greasyfork.org/en/scripts/26191-github-diff-files-filter
[dfl-gf]: https://greasyfork.org/en/scripts/21559-github-diff-links
[fpv-gf]: https://greasyfork.org/en/scripts/20479-github-font-preview
[g2d-gf]: https://greasyfork.org/en/scripts/18254-gist-to-dabblet
[gih-gf]: https://greasyfork.org/en/scripts/19867-github-issue-highlighter
[glc-gf]: https://greasyfork.org/en/scripts/23270-github-label-color-picker
[ic1-gf]: https://greasyfork.org/en/scripts/18503-github-toggle-issue-comments
[ic2-gf]: https://greasyfork.org/en/scripts/15560-github-show-repo-issues
[ioc-gf]: https://greasyfork.org/en/scripts/28176-github-indent-comment-blocks
[ipv-gf]: https://greasyfork.org/en/scripts/19773-github-image-preview
[rds-gf]: https://greasyfork.org/en/scripts/18520-github-remove-diff-signs
[rtl-gf]: https://greasyfork.org/en/scripts/20542-github-rtl-comment-blocks
[srt-gf]: https://greasyfork.org/en/scripts/21373-github-sort-content
[tbn-gf]: https://greasyfork.org/en/scripts/18253-github-title-notification
[tex-gf]: https://greasyfork.org/en/scripts/23303-github-toggle-expanders
[toc-gf]: https://greasyfork.org/en/scripts/18344-github-toc
[tws-gf]: https://greasyfork.org/en/scripts/18433-github-toggle-wiki-sidebar

## Updating

Userscripts are set up to automatically update. You can check for updates from within the Greasemonkey or Tampermonkey menu, or click on the install link again to get the update.

Each individual userscript's change log is contained on its wiki documentation page.

## Issues

Please report any userscript issues within this repository's [issue section](https://github.com/Mottie/GitHub-userscripts/issues). Greasyfork messages are also received, but not as easily tracked. Thanks!

## Other userscripts not hosted here:

* [GitHub Dark Script](https://github.com/StylishThemes/GitHub-Dark-Script)
	* [Github Monospace Font Toggle](https://greasyfork.org/en/scripts/18787-github-monospace-font-toggle) (also part of GitHub Dark Script)
	* [GitHub Diff File Toggle](https://greasyfork.org/en/scripts/18788-github-diff-file-toggle) (also part of GitHub Dark Script)
	* [GitHub Toggle Code Wrap](https://greasyfork.org/en/scripts/18789-github-toggle-code-wrap) (also part of GitHub Dark Script)
* [GitHub Custom Emojis](https://github.com/StylishThemes/GitHub-Custom-Emojis)
* [GitHub Make Tooltips](https://greasyfork.org/en/scripts/22194)
* <del>[ZenHub Sort Issues](https://github.com/Mottie/ZenHub-userscripts#zenhub-sort-issues)</del> Broken
* <del>[ZenHub Toggle Meta](https://github.com/Mottie/ZenHub-userscripts#zenhub-toggle-meta)</del> Broken
