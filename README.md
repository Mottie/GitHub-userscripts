# GitHub userscripts [![tag](https://img.shields.io/github/tag/Mottie/GitHub-userscripts.svg)](https://github.com/Mottie/GitHub-userscripts/tags) [![Mentioned in Awesome Userscripts](https://awesome.re/mentioned-badge.svg)](https://github.com/brunocvcunha/awesome-userscripts#readme)

Userscripts to add functionality to GitHub.

## Installation

1. Make sure you have user scripts enabled in your browser (these instructions refer to the latest versions of the browser):

	* Firefox - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=firefox) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (GM v4+ is **not supported**!).
	* Chrome - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=chrome).
	* Opera - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=opera) or [Violent Monkey](https://addons.opera.com/en/extensions/details/violent-monkey/).
	* Safari - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=safari).
	* Dolphin - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=dolphin).
	* UC Browser - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=ucweb).

2. Get information or install:
	* Learn more about the userscript by clicking on the named link. You will be taken to the specific wiki page.
	* Install a script directly from GitHub by clicking on the "install" link in the table below.
	* Install a script from [GreasyFork](https://greasyfork.org/en/users/24847-mottie) (GF) from the userscript site page
	* Or, install the scripts from [OpenUserJS](https://openuserjs.org/users/Mottie/scripts) (OU).<br><br>

	| Userscript Wiki                        | ![][ico] | Direct<br>Install | Sites                 | Created    | Updated    |
	|----------------------------------------|:---:|:------------------:|:-------------------------:|:----------:|:----------:|
	| [GitHub code colors][ccr-wiki]         |     | [install][ccr-raw] | [GF][ccr-gf] [OU][ccr-ou] | 2016.03.20 | 2019.07.31 |
	| [GitHub code folding][cfd-wiki]        |     | [install][cfd-raw] | [GF][cfd-gf] [OU][cfd-ou] | 2016.12.28 | 2020.05.12 |
	| [GitHub code guides][cgl-wiki]         |     | [install][cgl-raw] | [GF][cgl-gf] [OU][cgl-ou] | 2016.08.27 | 2020.07.11 |
	| [GitHub code show whitespace][csw-wiki]|     | [install][csw-raw] | [GF][csw-gf] [OU][csw-ou] | 2017.03.26 | 2019.07.02 |
	| [GitHub collapse in comment][cic-wiki] |  *  | [install][cic-raw] | [GF][cic-gf] [OU][cic-ou] | 2016.06.27 | 2019.02.16 |
	| [GitHub collapse markdown][cmd-wiki]   |  *  | [install][cmd-raw] | [GF][cmd-gf] [OU][cmd-ou] | 2016.06.27 | 2019.03.29 |
	| [GitHub copy code snippet][ccs-wiki]   |     | [install][ccs-raw] | [GF][ccs-gf] [OU][ccs-ou] | 2018.01.12 | 2019.02.16 |
	| [GitHub custom hotkeys][chk-wiki]      |     | [install][chk-raw] | [GF][chk-gf] [OU][chk-ou] | 2016.04.10 | 2019.05.12 |
	| [GitHub custom navigation][cnv-wiki]   |     | [install][cnv-raw] | [GF][cnv-gf] [OU][cnv-ou] | 2016.06.22 | 2020.05.10 |
	| [GitHub diff filename][dfn-wiki]       |     | [install][dfn-raw] | [GF][dfn-gf] [OU][dfn-ou] | 2017.08.27 | 2019.02.16 |
	| [GitHub diff files filter][dff-wiki]   |     | [install][dff-raw] | [GF][dff-gf] [OU][dff-ou] | 2016.12.31 | 2020.07.11 |
	| [GitHub diff links][dfl-wiki]          |     | [install][dfl-raw] | [GF][dfl-gf] [OU][dfl-ou] | 2016.07.21 | 2019.04.28 |
	| [GitHub download zip][dlz-wiki]        |     | [install][dlz-raw] | [GF][dlz-gf] [OU][dlz-ou] | 2018.10.22 | 2020.03.27 |
	| [GitHub files filter][gff-wiki]        |     | [install][gff-raw] | [GF][gff-gf] [OU][gff-ou] | 2017.06.26 | 2020.07.13 |
	| [GitHub font preview][fpv-wiki]        |     | [install][fpv-raw] | [GF][fpv-gf] [OU][fpv-ou] | 2016.06.11 | 2019.06.07 |
	| [GitHub hide own feed meta][hof-wiki]  |     | [install][hof-raw] | [GF][hof-gf] [OU][hof-ou] | 2017.12.21 | 2019.02.16 |
	| [GitHub html preview][ghp-wiki]        |     | [install][ghp-raw] | [GF][ghp-gf] [OU][ghp-ou] | 2019.03.29 | 2019.04.28 |
	| [GitHub image preview][ipv-wiki]       |     | [install][ipv-raw] | [GF][ipv-gf] [OU][ipv-ou] | 2016.05.17 | 2020.07.13 |
	| [GitHub indent comments][ioc-wiki]     |     | [install][ioc-raw] | [GF][ioc-gf] [OU][ioc-ou] | 2017.03.15 | 2019.02.16 |
	| [GitHub issue add details][iad-wiki]   |     | [install][iad-raw] | [GF][iad-gf] [OU][iad-ou] | 2018.01.05 | 2020.03.19 |
	| [GitHub issue comments][ic1-wiki]      |     | [install][ic1-raw] | [GF][ic1-gf] [OU][ic1-ou] | 2016.04.04 | 2020.03.06 |
	| [GitHub issue counts][ic2-wiki]        |     | [install][ic2-raw] | [GF][ic2-gf] [OU][ic2-ou] | 2012.01.16 | 2019.02.16 |
	| [GitHub label color picker][glc-wiki]  |     | [install][glc-raw] | [GF][glc-gf] [OU][glc-ou] | 2016.09.16 | 2019.07.25 |
	| [GitHub mentioned links][iml-wiki]     |     | [install][iml-raw] | [GF][iml-gf] [OU][iml-ou] | 2020.03.28 | 2020.03.28 |
	| [GitHub reveal header][rhd-wiki]       |     | [install][rhd-raw] | [GF][rhd-gf] [OU][rhd-ou] | 2017.06.03 | 2019.03.29 |
	| [GitHub rtl comments][rtl-wiki]        |     | [install][rtl-raw] | [GF][rtl-gf] [OU][rtl-ou] | 2016.06.13 | 2020.07.11 |
	| [GitHub search autocomplete][sac-wiki] |     | [install][sac-raw] | [GF][sac-gf] [OU][sac-ou] | 2017.03.31 | 2018.05.19 |
	| [GitHub sort content][srt-wiki]        |     | [install][srt-raw] | [GF][srt-gf] [OU][srt-ou] | 2016.07.13 | 2020.07.11 |
	| [GitHub sort reactions][gsr-wiki]      |     | [install][gsr-raw] | [GF][gsr-gf] [OU][gsr-ou] | 2018.02.10 | 2020.05.25 |
	| [GitHub static time][stt-wiki]         |     | [install][stt-raw] | [GF][stt-gf] [OU][stt-ou] | 2017.04.24 | 2019.02.16 |
	| [GitHub table of contents][toc-wiki]   |     | [install][toc-raw] | [GF][toc-gf] [OU][toc-ou] | 2016.03.28 | 2020.07.16 |
	| [GitHub title notification][tbn-wiki]  |     | [install][tbn-raw] | [GF][tbn-gf] [OU][tbn-ou] | 2016.03.24 | 2018.02.16 |
	| [GitHub toggle diff comments][tdc-wiki]|     | [install][tdc-raw] | [GF][tdc-gf] [OU][tdc-ou] | 2017.12.10 | 2020.05.25 |
	| [GitHub toggle expanders][tex-wiki]    |     | [install][tex-raw] | [GF][tex-gf] [OU][tex-ou] | 2016.09.17 | 2019.09.02 |
	| [GitHub toggle wiki sidebar][tws-wiki] |     | [install][tws-raw] | [GF][tws-gf] [OU][tws-ou] | 2016.04.01 | 2019.02.16 |
	| [GitHub unknown license][gul-wiki]     |     | [install][gul-raw] | [GF][gul-gf] [OU][gul-ou] | 2020.03.29 | 2020.03.29 |
	| [GitHub update fork][ufk-wiki]         |     | [install][ufk-raw] | [GF][ufk-gf] [OU][ufk-ou] | 2020.02.16 | 2020.03.19 |
	| [Gist raw links][grl-wiki]             |     | [install][grl-raw] | [GF][grl-gf] [OU][grl-ou] | 2017.05.19 | 2019.06.07 |
	| [Gist to dabblet][g2d-wiki]            |     | [install][g2d-raw] | [GF][g2d-gf] [OU][g2d-ou] | 2012.01.26 | 2017.02.16 |

	\* The ![][ico] column indicates that the userscript has been included in the [Octopatcher](https://github.com/Mottie/Octopatcher) browser extension/addon.


	| Deprecated Userscript Wiki             | Direct<br>Install  | Sites                     | Created    | Deprecated |
	|----------------------------------------|:------------------:|:-------------------------:|:----------:|:----------:|
	| [GitHub diff expander][dex-wiki]       | [install][dex-raw] | [GF][dex-gf] [OU][dex-ou] | 2018.06.09 | 2019.01.30 |
	| [GitHub issue highlighter][gih-wiki]   | [install][gih-raw] | [GF][gih-gf] [OU][gih-ou] | 2016.05.21 | 2018.07.26 |
	| [GitHub issue show status][iss-wiki]   | [install][iss-raw] | [GF][iss-gf] [OU][iss-ou] | 2017.06.02 | 2019.01.04 |
	| [GitHub remove diff signs][rds-wiki]   | [install][rds-raw] | [GF][rds-gf] [OU][rds-ou] | 2016.04.05 | 2018.07.31 |

[ccr-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-colors
[ccs-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-copy-code-snippet
[cfd-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-folding
[cgl-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-guides
[chk-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-custom-hotkeys
[cic-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-collapse-in-comment
[cmd-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-collapse-markdown
[cnv-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-custom-navigation
[csw-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-code-show-whitespace
[dex-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-diff-expander
[dff-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-diff-files-filter
[dfl-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-diff-links
[dfn-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-diff-filename
[dlz-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-download-zip
[fpv-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-font-preview
[g2d-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/Gist-to-dabblet
[gff-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-files-filter
[ghp-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-html-preview
[gih-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-issue-highlighter
[glc-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-label-color-picker
[grl-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/Gist-raw-links
[gsr-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-sort-reactions
[gul-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-unknown-license
[hof-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-hide-own-feed-meta
[iad-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-issue-add-details
[ic1-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-issue-comments
[ic2-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-issue-counts
[iml-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-mentioned-links
[ioc-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-indent-comments
[ipv-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-image-preview
[iss-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-issue-show-status
[rds-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-remove-diff-signs
[rhd-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-reveal-header
[rtl-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-rtl-comments
[sac-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-search-autocomplete
[srt-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-sort-content
[stt-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-static-time
[tbn-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-title-notification
[tdc-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-toggle-diff-comments
[tex-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-toggle-expanders
[toc-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-table-of-contents
[tws-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-toggle-wiki-sidebar
[ufk-wiki]: https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-update-fork

[ccr-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
[ccs-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-copy-code-snippet.user.js
[cfd-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-folding.user.js
[cgl-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-guides.user.js
[chk-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-custom-hotkeys.user.js
[cic-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-collapse-in-comment.user.js
[cmd-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-collapse-markdown.user.js
[cnv-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-custom-navigation.user.js
[csw-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-show-whitespace.user.js
[dex-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-expander.user.js
[dff-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-files-filter.user.js
[dfl-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-links.user.js
[dfn-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-filename.user.js
[dlz-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-download-zip.user.js
[fpv-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-font-preview.user.js
[g2d-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-to-dabblet.user.js
[gff-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-files-filter.user.js
[ghp-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-html-preview.user.js
[gih-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-highlighter.user.js
[glc-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-label-color-picker.user.js
[grl-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-raw-links.user.js
[gsr-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-reactions.user.js
[gul-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-unknown-license.user.js
[hof-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-hide-own-feed-meta.user.js
[iad-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-add-details.user.js
[ic1-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-comments.user.js
[ic2-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-counts.user.js
[iml-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-mentioned-links.user.js
[ioc-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-indent-comments.user.js
[ipv-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-image-preview.user.js
[iss-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-show-status.user.js
[rds-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
[rhd-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-reveal-header.user.js
[rtl-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-rtl-comments.user.js
[sac-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-search-autocomplete.user.js
[srt-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
[stt-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-static-time.user.js
[tbn-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-title-notification.user.js
[tdc-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-diff-comments.user.js
[tex-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
[toc-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toc.user.js
[tws-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-wiki-sidebar.user.js
[ufk-raw]: https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-update-fork.user.js

[ccr-gf]: https://greasyfork.org/en/scripts/18141-github-code-colors
[ccs-gf]: https://greasyfork.org/en/scripts/37307-github-copy-code-snippet
[cfd-gf]: https://greasyfork.org/en/scripts/26109-github-code-folding
[cgl-gf]: https://greasyfork.org/en/scripts/22674-github-code-guides
[chk-gf]: https://greasyfork.org/en/scripts/18675-github-custom-hotkeys
[cic-gf]: https://greasyfork.org/en/scripts/20973-github-collapse-in-comment
[cmd-gf]: https://greasyfork.org/en/scripts/20974-github-collapse-markdown
[cnv-gf]: https://greasyfork.org/en/scripts/20830-github-custom-navigation
[csw-gf]: https://greasyfork.org/en/scripts/28454-github-code-show-whitespace
[dex-gf]: https://greasyfork.org/en/scripts/369373-github-diff-expander
[dff-gf]: https://greasyfork.org/en/scripts/26191-github-diff-files-filter
[dfl-gf]: https://greasyfork.org/en/scripts/21559-github-diff-links
[dfn-gf]: https://greasyfork.org/en/scripts/32634-github-diff-filename
[dlz-gf]: https://greasyfork.org/en/scripts/373514-github-download-zip
[fpv-gf]: https://greasyfork.org/en/scripts/20479-github-font-preview
[g2d-gf]: https://greasyfork.org/en/scripts/18254-gist-to-dabblet
[gff-gf]: https://greasyfork.org/en/scripts/30940-github-files-filter
[ghp-gf]: https://greasyfork.org/en/scripts/381133-github-html-preview
[gih-gf]: https://greasyfork.org/en/scripts/19867-github-issue-highlighter
[glc-gf]: https://greasyfork.org/en/scripts/23270-github-label-color-picker
[grl-gf]: https://greasyfork.org/en/scripts/29888-gist-raw-links
[gsr-gf]: https://greasyfork.org/en/scripts/38354-github-sort-reactions
[gul-gf]: https://greasyfork.org/en/scripts/398945-github-unknown-license
[hof-gf]: https://greasyfork.org/en/scripts/36598-github-hide-own-feed-meta
[iad-gf]: https://greasyfork.org/en/scripts/37056-github-issue-add-details
[ic1-gf]: https://greasyfork.org/en/scripts/18503-github-toggle-issue-comments
[ic2-gf]: https://greasyfork.org/en/scripts/15560-github-show-repo-issues
[iml-gf]: https://greasyfork.org/en/scripts/398907-github-mentioned-links
[ioc-gf]: https://greasyfork.org/en/scripts/28176-github-indent-comment-blocks
[ipv-gf]: https://greasyfork.org/en/scripts/19773-github-image-preview
[iss-gf]: https://greasyfork.org/en/scripts/30268-github-issue-show-status
[rds-gf]: https://greasyfork.org/en/scripts/18520-github-remove-diff-signs
[rhd-gf]: https://greasyfork.org/en/scripts/30308-github-reveal-header
[rtl-gf]: https://greasyfork.org/en/scripts/20542-github-rtl-comment-blocks
[sac-gf]: https://greasyfork.org/en/scripts/28592-github-search-autocomplete
[srt-gf]: https://greasyfork.org/en/scripts/21373-github-sort-content
[stt-gf]: https://greasyfork.org/en/scripts/29239-github-static-time
[tbn-gf]: https://greasyfork.org/en/scripts/18253-github-title-notification
[tdc-gf]: https://greasyfork.org/en/scripts/36237-github-toggle-diff-comments
[tex-gf]: https://greasyfork.org/en/scripts/23303-github-toggle-expanders
[toc-gf]: https://greasyfork.org/en/scripts/18344-github-toc
[tws-gf]: https://greasyfork.org/en/scripts/18433-github-toggle-wiki-sidebar
[ufk-gf]: https://greasyfork.org/en/scripts/398272-github-update-fork

[ccr-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Code_Colors
[ccs-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Copy_Code_Snippet
[cfd-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Code_Folding
[cgl-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Code_Guides
[chk-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Custom_Hotkeys
[cic-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Collapse_In_Comment
[cmd-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Collapse_Markdown
[cnv-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Custom_Navigation
[csw-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Code_Show_Whitespace
[dex-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Diff_Expander
[dff-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Diff_Files_Filter
[dfl-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Diff_Links
[dfn-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Diff_Filename
[dlz-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Download_ZIP
[fpv-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Font_Preview
[g2d-ou]: https://openuserjs.org/scripts/Mottie/Gist_to_dabblet
[gff-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Files_Filter
[ghp-ou]: https://openuserjs.org/scripts/Mottie/GitHub_HTML_Preview
[gih-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Issue_Highlighter
[glc-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Label_Color_Picker
[grl-ou]: https://openuserjs.org/scripts/Mottie/Gist_Raw_Links
[gsr-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Sort_Reactions
[gul-ou]: https://openuserjs.org/scripts/Mottie/GitHub_unknown_license
[hof-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Hide_Own_Feed_Meta
[iad-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Issue_Add_Details
[ic1-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Issue_Comments
[ic2-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Show_Repo_Issues
[iml-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Mentioned_Links
[ioc-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Indent_Comment_Blocks
[ipv-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Image_Preview
[iss-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Issue_Show_Status
[rds-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Remove_Diff_Signs
[rhd-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Reveal_Header
[rtl-ou]: https://openuserjs.org/scripts/Mottie/GitHub_RTL_Comment_Blocks
[sac-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Search_Autocomplete
[srt-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Sort_Content
[stt-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Static_Time
[tbn-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Title_Notification
[tdc-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Toggle_Diff_Comments
[tex-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Toggle_Expanders
[toc-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Table_of_Contents
[tws-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Toggle_Wiki_Sidebar
[ufk-ou]: https://openuserjs.org/scripts/Mottie/GitHub_Update_Fork

[ico]: https://raw.githubusercontent.com/Mottie/Octopatcher/master/src/images/icon16.png

## Updating

Userscripts are set up to automatically update. You can check for updates from within the Greasemonkey or Tampermonkey menu, or click on the install link again to get the update.

Each individual userscript's change log is contained on its individual wiki page.

## Issues

Please report any userscript issues within this repository's [issue section](https://github.com/Mottie/GitHub-userscripts/issues). Greasyfork messages are also received, but not as easily tracked. Thanks!

Also check out the [FAQ](https://github.com/Mottie/GitHub-userscripts/wiki/FAQ) and [known issues](https://github.com/Mottie/GitHub-userscripts/wiki/Known-issues) pages.

## Contributions

If you would like to contribute to this repository, please...

1. Fork
2. Make changes (please read the [contribution guidelines](./CONTRIBUTING.md) and abide by them)
3. Create a pull request!

Thanks to all that have [contributed](./AUTHORS) so far!

## Other userscripts not hosted here:

* [GitHub Dark Script](https://github.com/StylishThemes/GitHub-Dark-Script)
	* [Github Monospace Font Toggle](https://greasyfork.org/en/scripts/18787-github-monospace-font-toggle) (also part of GitHub Dark Script).
	* [GitHub Diff File Toggle](https://greasyfork.org/en/scripts/18788-github-diff-file-toggle) (also part of GitHub Dark Script).
	* [GitHub Toggle Code Wrap](https://greasyfork.org/en/scripts/18789-github-toggle-code-wrap) (also part of GitHub Dark Script).
	* [GitHub Make Tooltips](https://greasyfork.org/en/scripts/22194) (Included in GitHub Dark Script repo).
* [GitHub Custom Emojis](https://github.com/StylishThemes/GitHub-Custom-Emojis)
* [Bitbucket userscripts](https://bitbucket.org/mottie/bitbucket-userscripts)
* [GitLab userscripts](https://gitlab.com/Mottie/GitLab-userscripts)
* [Miscellaneous userscripts](https://github.com/Mottie/Misc-userscripts)
* [GitHub userscripts by Jerone](https://github.com/jerone/UserScripts#github)
