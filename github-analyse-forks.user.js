// ==UserScript==
// @name        GitHub Analyse Forks
// @version     0.2.0
// @description A userscript that analyzes GitHub forks, shows compare info between fork repos and parent repo, helps you to find out the worthiest fork.
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

    const sleep=(t)=>new Promise(f=>setTimeout(f,t));

    const gm=(u,f)=>GM_xmlhttpRequest({url:u,onload:(xhr)=>{let h=xhr.responseText;let e=h.indexOf('Whoa there!');if(e>-1)f('Whoa Github limits!');f(h);}});

    const show=(e,b,c=0)=>{e.innerHTML+=" <b"+(0==c?"":' style="color:'+(c>0?"red":"#01cc1b")+';"')+">"+b+"</b>"};

    let myDt = 0; // Latest commit time of current repo

    function analyseDate (el, ix, html) {
        let i = html.indexOf('datetime');
        if (i > -1) {
            let dt = html.substring(i + 10, html.indexOf('"', i + 10));
            dt = new Date(dt);
            show(el, dt.format('yyyy-MM-dd HH:mm:ss'));
            if (ix == 0) {
                myDt = dt
            } else {
                let df = Math.round((dt - myDt) / (1000 * 60 * 60 * 24), 0);
                show(el, df == 0 ? 'same day' : ((df > 0 ? 'ahead' : 'behind') + ' ' + Math.abs(df) + ' day' + (Math.abs(df) > 1 ? 's' : '')), df);
            }
        }
    }

    function analyse(el, ix) {
        if(!myDt && ix > 0) {
            sleep(200).then(()=>analyse(el, ix));
            return;
        }
        // Get fork repo info
        let repo = $('a:last-child', el).attributes.href.nodeValue;
        gm(`https://github.com${repo}`, (html)=>{
            // Meet Github limits
            let e = html.indexOf('Whoa');
            if (e > -1) {
                show(el, html, 1);
                return;
            }
            // Get latest commit time
            let i = html.indexOf('tree-commit');
            if (i > -1) {
                let link = html.substring(html.lastIndexOf('"', i) + 1, html.indexOf('"', i));
                gm(`https://github.com${link}`, (html)=>{
                    analyseDate (el, ix, html);
                });
            } else {
                analyseDate (el, ix, html);
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
                el.innerHTML += ' ' + compare;
            }
        });
    }

    function init() {
        const root = $(".network");
        const repos = $$(".network .repo");
        if (root && repos.length > 0) {
            console.log('Fork repos', repos.length);

            repos.forEach((el, b)=>{
                // Delay 1 minute every 100 requests to avoid Github limits
                sleep(b + (Math.floor(b / 100) * 60000)).then(()=>{
                    analyse(el, b);
                });
            });

        }
    }

    init();

})();
