// ==UserScript==
// @name        GitHub Analyse Forks
// @version     0.1.0
// @description A userscript that analyzes GitHub forks, helps you to find out the worthiest fork.
// @license     MIT
// @author      Sean Zhang
// @namespace   https://github.com/zhangsean
// @include     https://github.com/*/network/members
// @run-at      document-idle
// @grant       GM_xmlhttpRequest
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/zhangsean/GitHub-userscripts/master/github-analyse-forks.user.js
// @downloadURL https://raw.githubusercontent.com/zhangsean/GitHub-userscripts/master/github-analyse-forks.user.js
// @supportURL  https://github.com/zhangsean/GitHub-userscripts/issues
// ==/UserScript==

(function() {
    'use strict';

    const $ = (selector, el) => (el || document).querySelector(selector);
    const $$ = (selector, el) => [...(el || document).querySelectorAll(selector)];

    Date.prototype.format=function(t){var e={"M+":this.getMonth()+1,"d+":this.getDate(),"H+":this.getHours(),"h+":this.getHours(),"m+":this.getMinutes(),"s+":this.getSeconds(),"q+":Math.floor((this.getMonth()+3)/3),S:this.getMilliseconds()};for(var s in/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(this.getFullYear()+"").substr(4-RegExp.$1.length))),e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t};

    const sleep=t=>new Promise(f=>setTimeout(f,t));

    function init() {
		const root = $(".network");
		const repos = $$(".network .repo");
		if (root && repos.length > 0) {
            console.log(repos.length);
            let a = 0;
            repos.forEach((el, i)=>{
                let b = ++a;
                // Get fork repo info
                let repo = $('a:last-child', el).attributes.href.nodeValue;
                // Delay 2 minutes every 300 requests to avoid GitHub limits
                sleep(b * 10 + (Math.floor(b / 300) * 120000)).then(()=>{
                    console.log('r', b, (new Date()).format('yyyy-MM-dd HH:mm:ss'));
                    GM_xmlhttpRequest({
                        url:`https://github.com${repo}`,
                        onload:function(xhr){
                            // Get latest commit time
                            let html = xhr.responseText,
                                i = html.indexOf('datetime');
                            if (i > -1) {
                                let dt = html.substring(i + 10, html.indexOf('"', i + 10));
                                dt = new Date(dt).format('yyyy-MM-dd HH:mm:ss');
                                el.innerHTML = el.innerHTML + ' <b>' + dt + '</b>';
                            }
                            // Get fork compare info
                            i = html.indexOf('This branch is');
                            if (i > -1) {
                                let compare = html.substring(i, html.indexOf('.', i));
                                let e = compare.indexOf('even');
                                if (e > -1) {
                                    compare = compare.replace('even', '<b>even</b>');
                                }
                                let a = compare.indexOf('ahead');
                                if (a > -1) {
                                    let num = compare.substring(compare.lastIndexOf('is', a) + 3, compare.lastIndexOf('commit', a) - 1);
                                    compare = compare.replace(num, '<b style="color:red;">' + num + '</b>');
                                }
                                let b = compare.indexOf('behind');
                                if (b > -1) {
                                    let d = compare.lastIndexOf(',', b);
                                    if (d == -1) {
                                        d = compare.lastIndexOf('is', b) + 1;
                                    }
                                    let num = compare.substring(d + 2, compare.lastIndexOf('commit', b) - 1);
                                    compare = compare.replace(num, '<b style="color:#01cc1b;">' + num + '</b>');
                                }
                                el.innerHTML = el.innerHTML + ' ' + compare;
                            }
                            let e = html.indexOf('Whoa there!');
                            if (e > -1) {
                                console.log('res', b, 'Whoa there!');
                            } else {
                                console.log('res', b);
                            }
                        }
                    });
                });
            });
		}
	}

    if (/members/.test(document.location)) {
        document.addEventListener("pjax:end", init);
        init();
    }
})();
