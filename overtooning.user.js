// ==UserScript==
// @name           overtooning
// @namespace      http://www.bumblebits.net
// @author         doonge@oddsquad.org
// @version        1.0
// @description    Load overlay from scanlation teams while browsing original webtoons.
// @include        http://webtoon.daum.net/*
// @include        http://cartoon.media.daum.net/*
// @include        http://comic.naver.com/*
// @include        http://m.comic.naver.com/*
// @include        http://comics.nate.com/*
// @include        http://webtoon.olleh.com/*
// @include        http://ttale.com/*
// @include        http://www.lezhin.com/*
// @grant          none
// ==/UserScript==

//  $top
var british = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCAzMCIgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjAwIj4NCjxjbGlwUGF0aCBpZD0idCI+DQoJPHBhdGggZD0iTTMwLDE1IGgzMCB2MTUgeiB2MTUgaC0zMCB6IGgtMzAgdi0xNSB6IHYtMTUgaDMwIHoiLz4NCjwvY2xpcFBhdGg+DQo8cGF0aCBkPSJNMCwwIHYzMCBoNjAgdi0zMCB6IiBmaWxsPSIjMDAyNDdkIi8+DQo8cGF0aCBkPSJNMCwwIEw2MCwzMCBNNjAsMCBMMCwzMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjYiLz4NCjxwYXRoIGQ9Ik0wLDAgTDYwLDMwIE02MCwwIEwwLDMwIiBjbGlwLXBhdGg9InVybCgjdCkiIHN0cm9rZT0iI2NmMTQyYiIgc3Ryb2tlLXdpZHRoPSI0Ii8+DQo8cGF0aCBkPSJNMzAsMCB2MzAgTTAsMTUgaDYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMTAiLz4NCjxwYXRoIGQ9Ik0zMCwwIHYzMCBNMCwxNSBoNjAiIHN0cm9rZT0iI2NmMTQyYiIgc3Ryb2tlLXdpZHRoPSI2Ii8+DQo8L3N2Zz4=';

var TEXT = {
    //Time
    mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat', sun: 'sun',
    monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday', thursday: 'thursday', friday: 'friday', saturday: 'saturday', sunday: 'sunday',
    week: 'week', weekDay: 'weekday', month: 'month', year: 'year', today: 'today',
    //Genre - comment: historical > history, and shorter 'slice of life'??
    webtoon: 'webtoon', bestChallenge: 'best challenge', challenge: 'challenge', smartoon: 'smarttoon',
    webtoons: 'webtoons', bestChallenges: 'best challenges', challenges: 'challenges', smartoons: 'smarttoons',
    genre: 'genre', theme: 'theme',
    complete: 'complete', completed: 'completed', ongoing: 'ongoing',
    episode: 'episode', omnibus: 'omnibus', story: 'story', daily: 'daily',
    humor: 'humor', fantasy: 'fantasy', action: 'action', drama: 'drama', romance: 'romance', sliceOfLife: 'slice of life', thrill: 'thrill', historical: 'historical', sport: 'sport',
    //Navigation
    index: 'index', home: 'home',
    top: 'top', bottom: 'bottom', next: 'next', previous: 'previous', prev: 'prev',
    page: 'page',
    //Properties
    title: 'title', artist: 'artist', author: 'author', blurb: 'blurb', type: 'type',
    rating: 'rating',  votes: 'votes', visits: 'visits', ranking: 'ranking', rate: 'rate',
    date: 'date', update: 'update', published: 'published',
    image: 'image',
    //Generic keywords
    list: 'list', first: 'first', fav: 'fav', view: 'view',
    _all: 'all', more: 'more', matches: 'matches', go: 'go', by: 'by', average: 'average',
    submit: 'submit',
    recommended: 'recommended', MY: 'MY', recommandations: 'recommandations',
    //naver specific
    popular: 'popular', brand: 'brand', pick: 'pick', remake: 'remake', multiPlot: 'multi-plot',
    _new: 'new', _this: 'this', _try: 'try',
    
    remote: 'remote',
    //Dynamic construction -- not anything special (based on english).
    //Might want to invert stuff for other langages and/or add suffix/prefix.
    verbalize: function(verb, something) {return verb + ' ' + something;},
    adjectivize: function(adjective, something) {return adjective + ' ' + something;},
    adverbize: function(adverb, something) {return adverb + ' ' + something;},
    compoundize: function(noun1, noun2) {return noun2 + ' ' + noun1;},
    possessivize: function(noun1, noun2) {return noun1 + ' of ' + noun2},
    shortPossessivize: function(noun1, noun2) {return noun2 + '\'s ' + noun1},
    capitalize: function(string) {return string[0].toUpperCase() + string.slice(1);}
};

// -- MUTATION OBSERVER rough fallback for older browsers.
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
if(!MutationObserver) {
    MutationObserver = function(callback) {
        this.callback = callback;
        var interval, textContent, node;
    };
    MutationObserver.prototype = {
        observe: function (node, options) {
            this.node = node;
            this.textContent = node.textContent;
            this.interval = window.setInterval(function() {
                    if(arguments[0].textContent != arguments[0].node.textContent) {
                        arguments[0].callback();
                    }
                },
            1000, this);
        },
        takeRecords: function () { //Not used.
            return true;
        },
        disconnect: function () {
            window.clearInterval(this.interval);
        }
    };
}

// -- Banzai.
var overlayLoader = {
    defaultData: {
        feedList: [
            {url: 'http://feed.oddsquad.org', name: 'OddSquad Scanlation', lastUpdate: 0},
            {url: 'http://blackhorus.bumblebits.net', name: 'BlackHorus Scans', lastUpdate: 0},
        ],
        webtoonList: []
    },
    
    log: [],
    vars: {startingImage: 0, imageId: 0, imageIdDistortion: null}, //Stores interactive values (webtoonAuthor, webtoonTitle, stuff like that).
    savePath: {name: [], node: []}, //Stores previous result for the fetch function (so as not to refetch everything all the time), 0 = ref node.
    observer: [],
    template: [],
    stylesheet: false,
    
    publisher: 'unknown',
    activeFeed: false,

    resource: {timer: false, styling: ''}, //Stores values for the load function ?
    keyList: [  '0TYxZWNhOWVhNGViYmViMDM5YjczNzkwNTFYzczZjc45GFDg%#$1234%#$@5',
                'ZGI1ODliZTJmMDQzYjRiMGM1MjdkODllOWI5ZWVmYzkDFK(*lIYUtU%^YHERT%',
                'NmUwYzZiMDU5MWU4ZGM4OTliOTE1MTU5Yzc3Nzg0NzYHFG$^*46&$^#@#$@$3',
                'gdfSDFSW2347634%FS2y678gfHBhhfJityDswertyy56h7hbyrtvggftj856g23G#',
                'dfGSDF23f1273bg6@fgwvtrhBHU*TRRTYf12y5G^%$^%G@1fD!@#GF^DR3tyrtg',
                'SDFG4f5rdtfwE%#G&^#34GF^$%&^@FTHY$%^gdfGHERBTHJUWCwqTV@$0%B#H',
                'DFWEVf345Y#d512Y$%&768%^&G@$%^@#GYU#$^jTYHTRU#^YWETWEF99fhTYU',
                '<>UThwvWEFSTjuJY&(&*HR!@#!CFDVAcdfsdtaectryrt75463452t3FWCERYfd'],
    data: {},
    queries: [], //Stores queries for the shiftQueries function.
    scanlated: false,
    
    // --------------------- DEFINITIONS
    loadTemplate: function() {
        //------------------------------- COMIC.NAVER.COM $naver
        if(window.location.hostname == 'comic.naver.com') {
            this.template = [
            {  route: '',
                html: [
                    {path: '#header/ul.service/+', tagName: 'div', style: 'display: inline-block; width: 30px; height: 15px; margin-top: 2px; cursor: pointer;',
                        assign: 'menu'},
                    {path: '#menu/ul/li[]/a/em',
                        translate: [TEXT.index, TEXT.webtoon, TEXT.bestChallenge, TEXT.challenge, TEXT.recommended, TEXT.MY]}
                ],
                css: [
                    {selector: '#header #menu',
                        style: 'background: linear-gradient(#444444, #424242, #3e3e3e, #2f2f2f, #282828, #222222) #424242; border: 2px solid #686868; border-width: 2px 0 0 2px;'},
                    {selector: '#header #menu ul.menu li',
                        style: 'background: none; float: none; display: inline-block; width: auto !important; height: auto; line-height: 38px;'},
                    {selector: '#header #menu ul.menu li a',
                        style: 'background: none; width: auto; display: inline;'},
                    {selector: '#header #menu ul.menu li em',
                        style: 'position: static; background: none; top: 0px; color : white; font-weight: bold; font-size: 1.2em; margin: 0 0 0 15px; padding: 5px; text-transform: capitalize;'},
                    {selector: '#header #menu ul.menu li a.current em',
                        style: 'color: gold; background: #222; border: #1e1e1e solid 1px; border-radius: 3px;'},
                    {selector: '.menu_nine, .menu_fifth, .menu_sixth',
                        style: 'display: none !important;'}
                ]
            },
            {  route: '/webtoon',
                html: [
                    {path: '#submenu/ul/li[]/a/em', style: 'display: block; text-align: center; height: 100%; line-height: 34px; position: static; background-color: #F1F1F1;',
                        translate: [TEXT.capitalize(TEXT.week), TEXT.capitalize(TEXT.genre), TEXT.capitalize(TEXT.title), TEXT.capitalize(TEXT.artist), TEXT.capitalize(TEXT.year), TEXT.capitalize(TEXT.theme), TEXT.capitalize(TEXT.complete)]}
                ],
                css: [
                    {selector: '#submenu a.current em',
                        style: 'color: black; font-weight: bold;'}
                ]
            },
            {  route: '/webtoon/(detail|list|weekday|weekdayList)',
                html: [
                    {path: '#content/ul.category_tab/li[]/a', style: 'text-transform: capitalize;',
                        translate: [TEXT.week, TEXT.monday, TEXT.tuesday, TEXT.wednesday, TEXT.thursday, TEXT.friday, TEXT.saturday, TEXT.sunday]}
            ]},
            {  route: '/webtoon/(genre|period|finish)',
                html: [
                    {path: '#content/div.list_area/ul/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'dl/dt/a@href?titleId', webtoonTitle: 'dl/dt/a', webtoonAuthor: 'dl/dd.desc/a'}}
                ],
                css: [
                    {selector: '.img_list dt a',
                        style: 'display: inline-block; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'}
                ]
            },
            {  route: '/(genre|bestChallenge|challenge)',
                html: [
                    {path: '#content/div.snb/ul[]/li[]/a',
                        translate: [TEXT.capitalize(TEXT._all), TEXT.capitalize(TEXT.episode), TEXT.capitalize(TEXT.omnibus), TEXT.capitalize(TEXT.story),TEXT.daily, TEXT.humor, TEXT.fantasy, TEXT.action, TEXT.drama, TEXT.romance, TEXT.sliceOfLife, TEXT.thrill, TEXT.historical, TEXT.sport]},
                    {path: '#content/div.mainTodayBox/h3/img', tagName: 'em', style: 'margin-left: 20px;',
                        translate: TEXT.todaysPopular},
                    {path: '#content/div.mainTodayBox/ul/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'h4/a@href?titleId', webtoonTitle: 'h4/a', webtoonAuthor: 'ul/li/+/li/span/a'}},
                    {path: '#content/div.weekchallengeBox[]/table/tbody/tr[]/td. []', className: 'challengeListDot doonge',
                        assign: 'webtoonList', innerPath: {webtoonId: 'div.challengeInfo/h6/a@href?titleId', webtoonTitle: 'div.challengeInfo/h6/a', webtoonAuthor: 'div.challengeInfo/a.user', webtoonBlurb: 'div.challengeInfo/div.summary'}}
                ],
                css: [
                    {selector: '.challengeInfo h6.challengeTitle a',
                        style: 'display: inline-block; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: '.challengeInfo .summary',
                        style: 'display: inline-block; width: 100%; height: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: 'h4.mainTodaySubtlt a',
                        style: 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: 'table.challengeList td.challengeListDot:not([class="challengeListDot doonge"]), table.challengeList colgroup',
                        style: 'display: none;'},
                    {selector: 'table.challengeList td:first-of-type',
                        style: 'background: none;'},
                    {selector: 'table.challengeList td + td',
                        style: 'padding-left: 23px;'},
                    {selector: '.snb .spot + ul li a',
                        style: 'padding: 10px 7px 7px;'}
                ]
            },
            {  route: '/webtoon/theme',
                html: [
                    {path: '#content/div.list_area[]/h4/strong',
                        translate: [TEXT.brandPick, TEXT.remake, TEXT.multiPlot, TEXT.sport]},
                    {path: '#content/div.list_area[]/h4/strong/+',
                        translate: [' ' + TEXT.theme, ' ' + TEXT.theme, ' ' + TEXT.theme, ' ' + TEXT.theme]},
                    {path: '#content/div.list_area[]/ul/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'dl/dt/a@href?titleId', webtoonTitle: 'dl/dt/a', webtoonAuthor: 'dl/dd.desc/a'}}
                ],
                css: [
                    {selector: '.img_list dt a',
                        style: 'display: inline-block; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'}
                ]
            },
            {  route: '/webtoon/genre',
                html: [
                    {path: '#content/ul.category_tab/li[]/a',
                        translate: [TEXT.capitalize(TEXT.episode), TEXT.capitalize(TEXT.omnibus), TEXT.capitalize(TEXT.story),TEXT.daily, TEXT.humor, TEXT.fantasy, TEXT.action, TEXT.drama, TEXT.romance, TEXT.sliceOfLife, TEXT.thrill, TEXT.historical, TEXT.sport]},
                    {path: '#content/div.view_type/h3/img', tagName: 'span',
                        translate: TEXT.capitalize(TEXT.matches) + ':'},
                    {path: '#content/div.view_type/h3/~img', tagName: 'span',
                        translate: ' '},
                ],
                css: [
                    {selector: '.webtoon .category_tab2 li, .webtoon .category_tab2 li.on2',
                        style: 'width: auto;'},
                    {selector: '.webtoon .category_tab2 li a',
                        style: 'padding-left: 0.8em; padding-right: 0.8em;'},
                    {selector: '.webtoon .view_type h3 em', //hide the korean
                        style: 'background: none; margin: 0; padding: 0; text-indent: -1em; line-height: 22px; overflow: hidden;'},
                ]
            },
            {  route: '/webtoon/weekdayList',
                html: [
                    {path: '#content/div.webtoon_spot/h3/img', tagName: 'em',
                        translate: TEXT.capitalize(TEXT.recommandations)},
                    {path: '#content/div.webtoon_spot/ul/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'dl/dt/a@href?titleId', webtoonTitle: 'dl/dt/a/strong', webtoonAuthor: 'dl/dd/p/a'}},
                    {path: '#content/div.list_area/ul/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'dl/dt/a@href?titleId', webtoonTitle: 'dl/dt/a', webtoonAuthor: 'dl/dd.desc/a'}},
                    {path: '#content/div.view_type/h3/img', tagName: 'span',
                        translate: TEXT.capitalize(TEXT.compoundize(TEXT.webtoons, TEXT.weekday))},
                ],
                css: [
                    {selector: '.webtoon .list_area .img_list li dt a',
                        style: 'display: inline-block; width: 124px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'}
                ]
            },
            {  route: '/webtoon/finish',
                html: [
                    {path: '#content/div.view_type/h3/img', tagName: 'span',
                        translate: TEXT.capitalize(TEXT.adjectivize(TEXT.completed, TEXT.webtoons))},
                ]
            },
            {  route: '/genre/bestChallenge',
                html: [
                    {path: '#content/h3/img', tagName: 'span',
                        translate: TEXT.capitalize(TEXT._all)},
                    {path: '#content/h3/ul/li[]/a/em',
                        translate: [TEXT.adverbize(TEXT.by, TEXT.update), TEXT.adverbize(TEXT.by, TEXT.visits), TEXT.adverbize(TEXT.by, TEXT.rating)]}
                ],
                css: [
                    {selector: '#content ul.titleSort a',
                        style: 'background: none; width: auto;'},
                    {selector: '#content ul.titleSort em',
                        style: 'display: block; font-weight: normal;'},
                    {selector: '#content ul.titleSort em::before',
                        style: 'content: "✓ ";'},
                    {selector: '#content ul.titleSort a[class*="_on"] em',
                        style: 'font-weight: bold;'},
                    {selector: '#content ul.titleSort a[class*="_on"] em::before',
                        style: 'color: red;'},
                ]
            },
            {  route: '/genre/challenge',
                html: [
                    {path: '#content/h3/ul.h_tab_area/li[]/a/em',
                        translate: [TEXT.capitalize(TEXT.recommended), TEXT.capitalize(TEXT._all)]},
                    {path: '#content/h3/ul.titleSort/li[]/a/em',
                        translate: [TEXT.adverbize(TEXT.by, TEXT.update), TEXT.adverbize(TEXT.by, TEXT.visits), TEXT.adverbize(TEXT.by, TEXT.rating)]}
                ],
                css: [
                    {selector: '#content ul.titleSort a, #content ul.h_tab_area a',
                        style: 'background: none; width: auto;'},
                    {selector: '#content ul.titleSort em, #content ul.h_tab_area em',
                        style: 'display: block; font-weight: normal;'},
                    {selector: '#content ul.h_tab_area em',
                        style: 'font-weight: bold; color: grey; font-size: 1.2em; padding: 0 10px 0 0;'},
                    {selector: '#content ul.h_tab_area a[class*="_on"] em',
                        style: 'color: black;'},
                    {selector: '#content ul.titleSort em::before',
                        style: 'content: "✓ ";'},
                    {selector: '#content ul.titleSort a[class*="_on"] em',
                        style: 'font-weight: bold;'},
                    {selector: '#content ul.titleSort a[class*="_on"] em::before',
                        style: 'color: red;'},
                ]
            },
            {  route: '/webtoon/(weekdayList|finish|genre)',
                html: [
                    {path: '#content/div.view_type/ul.sortby/li[]/a/img', tagName: 'span',
                        translate: [TEXT.adverbize(TEXT.by, TEXT.update), TEXT.adverbize(TEXT.by, TEXT.visits), TEXT.adverbize(TEXT.by, TEXT.rating), TEXT.adverbize(TEXT.by, TEXT.title)]},
                    {path: '#content/div.list_area/table/thead/tr/th[]/span',
                        translate: [TEXT.capitalize(TEXT.title), TEXT.capitalize(TEXT.rating), TEXT.capitalize(TEXT.author), TEXT.capitalize(TEXT.update)]},
                    {path: '#content/div.list_area/table/tbody/tr[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'td.subject/a@href?titleId', webtoonTitle: 'td.subject/a/strong', webtoonAuthor: 'td/+/td/+/td/a'}},
                ],
                css: [
                    {selector: '.webtoon .table_list_area table th',
                        style: 'background: none;'},
                    {selector: '.webtoon .table_list_area table th span',
                        style: 'text-indent: 0;'},
                ]
            },
            {  route: '/webtoon/weekday.nhn', //add a .nhn to distinguish from weekdayList
                html: [
                    {path: '#content/div.webtoon_spot2/h3/img', tagName: 'em', style: 'text-transform: capitalize;',
                        translate: TEXT.shortPossessivize(TEXT.adjectivize(TEXT._new, TEXT.webtoons), TEXT.adjectivize(TEXT._this, TEXT.month))},
                    {path: '#content/div.webtoon_spot2/ul/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'a@href?titleId', webtoonTitle: 'a/strong', webtoonAuthor: 'p/a', webtoonBlurb: 'p/+/p'}},
                    {path: '#content/div.list_area/div[]/div/h4/span', style: 'display: block; z-index: 1; line-height: 31px; text-align: center; font-weight: bold; text-transform: capitalize;',
                        translate: [TEXT.monday, TEXT.tuesday, TEXT.wednesday, TEXT.thursday, TEXT.friday, TEXT.saturday, TEXT.sunday]},
                    {path: '#content/div.list_area/div[]/div/ul/li[]',
                        assign: 'webtoonList', weekdayList: true, innerPath: {webtoonId: 'a@href?titleId', webtoonTitle: 'a'}},
                    {path: '#content/div.view_type/h3/img', tagName: 'span',
                        translate: TEXT.capitalize(TEXT.adjectivize(TEXT.ongoing, TEXT.webtoons))},
                    {path: '#content/div.view_type/ul.sortby/li[]/a/img', tagName: 'span',
                        translate: [TEXT.adverbize(TEXT.by, TEXT.update), TEXT.adverbize(TEXT.by, TEXT.visits), TEXT.adverbize(TEXT.by, TEXT.rating), TEXT.adverbize(TEXT.by, TEXT.title)]},
                ],
                css: [
                    {selector: '.webtoon .daily_all .col h4',
                        style: 'background: none;'},
                    {selector: '.webtoon .list_area .col_selected h4 span',
                        style: 'color: #FDCB00;'},
                    {selector: '.webtoon .list_area .col a.title',
                        style: 'display: inline-block; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: '.webtoon .webtoon_spot2 ul li p + p',
                        style: 'height: 32px; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: '.webtoon .webtoon_spot2 ul li a strong',
                        style: 'display: inline-block; width: 210px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'}
                ]
            },
             {  route: '/(webtoon|bestChallenge|challenge)/list',
                html: [
                    {path: '#content/div.comicinfo/div.thumb/a@href?titleId',
                        assign: 'webtoonId'},
                    {path: '#content/div.comicinfo/div.detail/h2',
                        assign: 'webtoonTitle'},
                    {path: '#content/div.comicinfo/div.detail/h2/span.wrt_nm',
                        assign: 'webtoonAuthor'}, //regular - ?? check if difference?
                    {path: '#content/div.comicinfo/div.detail/p',
                        assign: 'webtoonBlurb', style: 'height: 50px; text-overflow: ellipsis;'},
                    {path: '#content/div.comicinfo/div.detail/p/+/ul.btn_group/li[]/a/span',
                        translate: [TEXT.fav.toUpperCase(), TEXT.first.toUpperCase(), TEXT.artist.toUpperCase()], className: ' '},
                    {path: '#content/div.comicinfo/+/table.viewList/thead/tr/th[]',
                        translate: [TEXT.capitalize(TEXT.image), TEXT.capitalize(TEXT.title), TEXT.capitalize(TEXT.ranking), TEXT.capitalize(TEXT.date)]},
                    {path: '#content/div.comicinfo/+/table.viewList/tbody/tr/+/tr[]',
                        assign: 'chapterList', innerPath: {chapterId: 'td.title/a@onclick?1', chapterTitle: 'td.title/a/'}},
                    {path: '#content/div.pagenavigation/a.pre',
                        translate: TEXT.capitalize(TEXT.adjectivize(TEXT.prev, TEXT.page))},
                    {path: '#content/div.pagenavigation/a.next',
                        translate: TEXT.capitalize(TEXT.adjectivize(TEXT.next, TEXT.page))}
                ],
                css: [
                    {selector: '.btn_group li .book_maker, .btn_group li .first, .btn_group li .lst, .btn_group li .other, .btn_group li .other2',
                        style: 'background: #FCFCFC; border: 1px #CECECE solid; border-radius: 2px; height: 25px; text-align: center; line-height: 25px;'},
                    {selector: '.btn_group li .book_maker span, .btn_group li .first span, .btn_group li .lst span, .btn_group li .other span, .btn_group li .other2 span',
                        style: 'background: none !important; text-indent: 0px !important; margin: 0 !important;'},
                    {selector: '.btn_group li .book_maker span::before',
                        style: 'content: \'★ \'; color: #17ce29; text-shadow: 0 0 1px #16b225;'},
                    {selector: '.comicinfo .detail p',
                        style: 'text-overflow: ellipsis; word-break: normal; word-wrap: normal;'}
                ]
            },
            {  route: '/(webtoon|bestChallenge|challenge)/detail',
                html: [
                    {path: '#content/div.section_spot/div.comicinfo/div.thumb/a@href?titleId',
                        assign: 'webtoonId'},
                    {path: '#content/div.section_spot/div.comicinfo/div.thumb/a@href?no',
                        assign: 'chapterId'},
                    {path: '#content/div.section_spot/div.comicinfo/div.detail/h2',
                        assign: 'webtoonTitle'},
                    {path: '#content/div.section_spot/div.comicinfo/div.detail/h2/span.wrt_nm',
                        assign: 'webtoonAuthor'},
                    {path: '#content/div.section_spot/div.comicinfo/div.detail/p.txt', style: 'max-height: 50px;',
                        assign: 'webtoonBlurb'},
                    {path: '#content/div.section_spot/div.comicinfo/div.detail/ul.btn_group/li[]/a/', className: ' ',
                        translate: [TEXT.fav.toUpperCase(), TEXT.first.toUpperCase(), TEXT.list.toUpperCase(), TEXT.artist.toUpperCase()]},
                     //PAGEFLIP patch
                    //{path: '#container/div/div.section_spot/div.comicinfo/div.thmb', className: 'thumb'}, //already fixed by naver
                    {path: '#container/div/div.section_spot/div.comicinfo/div.dsc', className: 'detail'},
                    {path: '#container/div/div.section_spot/div.comicinfo/div.dsc/h2/em', tagName: 'span', className: 'wrt_nm'},
                    //end pageflip
                    {path: '#content/div.section_spot/div.tit_area/div.view/h3',
                        assign: 'chapterTitle'},
                    {path: '#content/div.section_spot/div.tit_area/div.view/div.btn_area/span.pre/a',
                        translate: TEXT.prev.toUpperCase()},
                    {path: '#content/div.section_spot/div.tit_area/div.view/div.btn_area/span.next/a',
                        translate: TEXT.next.toUpperCase()},
                    {path: '#content/div.section_spot/div.tit_area/div.vote_lst/dl.rt/dt', style: 'padding: 3px 7px 3px 0px; text-align: right; width: 75px;',
                        translate: TEXT.published},
                    {path: '#topTotalStarPoint/../-2/dt/', tagName: 'em', style: 'font-weight: bold;',
                        translate: TEXT.adjectivize(TEXT.average, TEXT.rating).toUpperCase()},
                    {path: '#topTotalStarPoint/span.pointTotalPerson/em/-',
                        translate: '('},
                    {path: '#topTotalStarPoint/span.pointTotalPerson/em/+',
                        translate: ' ' + TEXT.votes +')'},
                    {path: '#topStarLabel/', tagName: 'em', style: 'font-weight: bold;',
                        translate: TEXT.capitalize(TEXT.rate)},
                    {path: '#topStarSelectbox/a/span',
                        translate: TEXT.submit},
                    {path: '#bottomTotalStarPoint/../-2/dt/', tagName: 'em', style: 'font-weight: bold;',
                        translate: TEXT.adjectivize(TEXT.average, TEXT.rating).toUpperCase()},
                    {path: '#bottomTotalStarPoint/span.pointTotalPerson/em/-',
                        translate: '('},
                    {path: '#bottomTotalStarPoint/span.pointTotalPerson/em/+',
                        translate: ' ' + TEXT.votes +')'},
                    {path: '#bottomStarLabel/', tagName: 'em', style: 'font-weight: bold;',
                        translate: TEXT.capitalize(TEXT.rate)},
                    {path: '#bottomStarSelectbox/a/span',
                        translate: TEXT.submit},
                    {path: '#prev_page',
                        assign: 'startingImage'}, //PageFlip
                    {path: 'img[]#content_image_0',
                        assign: 'imageList', innerPath: {style: 'margin-left: auto; margin-right: auto; margin-bottom: 0px;'}},
                    {path: '#au_pageflip/div.flip-page_container/div[]/div.img/img', observe: '#prev_page',
                        assign: 'imageList', innerPath: {style: '', keepOriginal: true}},
                    {path: '#comic_move/div[]', observe: '#comic_move',
                        assign: 'chapterList', innerPath: {chapterId: 'a@href?no', chapterTitle: 'a/img/+'}},
                    {path: '#comicRemocon/div.h_area/strong', style: 'background: none; text-indent: 0px; width: auto;',
                        translate: TEXT.capitalize(TEXT.remote)},
                    {path: '#goButton/span', className: ' ', style: 'margin: 0; color: black;',
                        translate: TEXT.go + '!'},
                    {path: '#comicRemocon/div.remote_cont/div.pg_area2/a.up', style: 'width: 30px;',
                        translate: TEXT.top},
                    {path: '#comicRemocon/div.remote_cont/div.pg_area2/a.down', style: 'width: 30px;',
                        translate: TEXT.down},
                    {path: '#comicRemocon/div.remote_cont/div.pg_area2/a.lst', style: 'width: 20px;',
                        translate: TEXT.list},
                    {path: '#comicRemocon/div.remote_cont/a.tit',
                        assign: 'webtoonTitle'},
                ],
                css: [
                    {selector: '.btn_group li .book_maker, .btn_group li .first, .btn_group li .lst, .btn_group li .other, .btn_group li .other2',
                        style: 'background: #FCFCFC; border: 1px #CECECE solid; border-radius: 2px; height: 25px; text-align: center; line-height: 25px;'},
                    {selector: '.btn_group li .book_maker span, .btn_group li .first span, .btn_group li .lst span, .btn_group li .other span, .btn_group li .other2 span',
                        style: 'background: none !important; text-indent: 0px !important; margin: 0 !important;'},
                    {selector: '.btn_group li .book_maker span::before',
                        style: 'content: \'★ \'; color: #17ce29; text-shadow: 0 0 1px #16b225;'},
                    {selector: '.remote_cont .pg_area a',
                        style: 'background: none; border: 1px solid grey; border-radius: 2px; box-sizing: border-box;'}
                ]
            },
            {  route: '/index',
                html: [
                    {path: '#content/div.genreRecomBox/div.tab_gr/ul/li[]/a',
                        translate: [TEXT.capitalize(TEXT.episode), TEXT.capitalize(TEXT.omnibus), TEXT.capitalize(TEXT.story),TEXT.daily, TEXT.humor, TEXT.fantasy, TEXT.action, TEXT.drama, TEXT.romance, TEXT.sliceOfLife, TEXT.thrill, TEXT.historical, TEXT.sport]},
                    {path: '#content/div.genreRecomBox/h3/img', tagName: 'em',
                        translate: TEXT.capitalize(TEXT.recommandations) + ' ' + TEXT.adverbize(TEXT.by, TEXT.genre)},
                    {path: '#content/div.genreRecomBox/h3/a/img', tagName: 'em',
                        translate: TEXT.capitalize(TEXT.verbalize(TEXT.view, TEXT.compoundize(TEXT.list, TEXT.genre)))},
                    {path: '#content/div.genreRecomBox_area/h3/img', tagName: 'em',
                        translate: TEXT.capitalize(TEXT.compoundize(TEXT.recommandations, TEXT.challenge))},
                    {path: '#content/div.genreRecomBox_area/ul/li[]/h4/img', tagName: 'em',
                        translate: [TEXT.capitalize(TEXT.episode), TEXT.capitalize(TEXT.omnibus), TEXT.capitalize(TEXT.story)]},
                    {path: '#content/div.genreRecomBox_area/ul/li[]/ul/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'div/+/div/h6/a@href?titleId', webtoonTitle: 'div/+/div/h6/a', webtoonAuthor: 'div/+/div/div/a', webtoonBlurb: 'div/+/div/div.summary'}},
                    {path: 'li[]#genreRecommandLi_0', observe: '#genreRecommand', options: {attributes: true, attributeFilter: ['href'], subtree: true},
                        assign: 'webtoonList', innerPath: {webtoonId: 'div/+/div/h6/a@href?titleId', webtoonTitle: 'div/+/div/h6/a/strong/span', webtoonAuthor: 'div/+/div/span.user/a'}},
                ],
                css: [
                    {selector: '.tab_gr li',
                        style: 'background: none; display: block; box-sizing: border-box; margin-left: 0 !important; line-height: 34px; width: auto !important; border-top: 2px solid #848484; border-bottom: 1px solid #dbdbdb;'},
                    {selector: '.tab_gr li:nth-child(-n+3)',
                        style: 'background: #efefef;'},
                    {selector: '#content .tab_gr li[class*="_on"]',
                        style: 'background: #909090; border-top-width: 2px; border: 1px solid #545454;'},
                    {selector: '#content .tab_gr li[class*="_on"] a',
                        style: 'color: white; text-shadow: 0 0 1px black;'},
                    {selector: '.tab_gr li a',
                        style: 'height: 34px; padding: 0 4px 0 3px; line-height: 34px; font-weight: bold; text-decoration: none;'},
                    {selector: '.tab_gr li:nth-child(-n+2) + li:not([class*="_on"]) a',
                        style: 'border-left: 1px solid #ddd;'},
                    {selector: '.tab_gr li + li:not([class*="_on"]) a',
                        style: 'border-left: 1px solid #ededed;'},
                    {selector: 'h3.titleMain',
                        style: 'font-size: 1.3em;'},
                    {selector: 'h3.titleMain a em',
                        style: 'font-size: 0.7em; font-weight: normal; display: inline-block; margin-top: 8px;'},
                    {selector: 'h3.titleMain a em::after',
                        style: 'content: \'  ❱\'; font-size: 0.7em; color: grey;'},
                    {selector: '.genreRecomInfo3 .summary, .genreRecomInfo3 .user',
                        style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; width: 124px;'},
                    {selector: '.genreRecomInfo2 h6 strong span',
                        style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; width: 160px;'}
                ]
            }
            ];
        // ------------------ M.COMIC.NAVER.COM $m-naver
        } else if(window.location.hostname == 'm.comic.naver.com') {
            this.template = [
            {  route: '/index',
                html: [
                    {path: '#ct/div.new_webtoon/div/p.tit',
                        translate: 'New monthly '},
                    {path: '#newTitle', observe: '#newTitle',
                        translate: 'pick'},
                    {path: 'div[]#newWebtoon/ul/li[]', observe: '#newTitle',
                        assign: 'webtoonList', innerPath: {webtoonId: 'a@onclick?0', webtoonTitle: 'a/p/strong', webtoonAuthor: 'a/p/span'}}, //translation refresh?
                    {path: '#ct/div.votetop/h3/p',
                        translate: 'Increasingly popular TOP 10'},
                    {path: '#newWeb',
                        translate: 'Webtoon'},
                    {path: '#newBest',
                        translate: 'Challenge'},
                    {path: 'div[]#realtime/ul/li[]', observe: '#realtime', options: {attributes: true},
                        assign: 'webtoonList', innerPath: {webtoonId: 'div/a@onclick?0', webtoonTitle: 'div/a/div/p/span/span|div/a/p/span/span', webtoonAuthor: 'div/a/div/p/span.sub_info|div/a/p/span.sub_info'}},
                    {path: '#ageTab/li[]/a/strong',
                        translate: ['♂', '♀', '♂', '♀','♂', '♀']},
                    {path: '#ageTab/li[]/a/span/em/+',
                        translate: ['+', '+', '+', '+','+', '+']},
                    {path: '#ageTab/-2/h3/p',
                        translate: 'Age / Sex Top Pick'},
                    {path: 'div[]#recommend/ul/li[]', observe: '#recommend',
                        assign: 'webtoonList', innerPath: {webtoonId: 'div/a@onclick?0', webtoonTitle: 'div/a/div/p/span/span|div/a/p/span/span', webtoonAuthor: 'div/a/div/p/span.sub_info|div/a/p/span.sub_info'}},
                    {path: '#ct/div.u_ft/div/div/a/span/+',
                        translate: 'TOP'}
                ]
            },
            {  route: '/(index|(webtoon|bestChallenge)/(list|genre|weekday))',
                html: [
                    {path: 'header/a/+', tagName: 'div', style: 'position: absolute; top: 9px; left: 72px; width: 54px; height: 27px; cursor: pointer; border-radius: 2px; border: #333 1px solid; z-index: 40;',
                        assign: 'menu'},
                    {path: 'div.ht/div/ul/li[]/a/span',
                        translate: ['Weekday', 'Genre', 'Challenge', 'MY']},
                    {path: 'div.ht/div/ul/li/+/li/+/li/+/li/+/li/a',
                        translate: 'Smartoon '},
            ]},
            {  route: '/(webtoon|bestChallenge)/(genre|weekday)',
                html: [
                    {path: '#form/ul.sort/li[]/input/+',
                        translate: [' by visits', ' by update', ' by rating', ' by title']},
                    {path: '#pageList/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'div/a@onclick?0', webtoonTitle: 'div/a/div/p/span/span', webtoonAuthor: 'div/a/div/p/span.sub_info'}},
                    {path: '#ct/+/div.u_ft/div/div/a/span/+',
                        translate: 'TOP'}
            ]},
            {  route: '/(webtoon|bestChallenge)/list',
                html: [
                    {path: '#form/div/dl/dt/+/dd/+/dd/a@href?titleId',
                        assign: 'webtoonId'},
                    {path: '#form/div/dl/dt/strong',
                        assign: 'webtoonTitle'},
                    {path: '#form/div/dl/dt/+/dd',
                        assign: 'webtoonAuthor'},
                    {path: '#form/div/dl/dt/+/dd/+/dd/a',
                        translate: 'FIRST'},
                    {path: '#ct/+/div.u_ft/div/div/a/span/+',
                        translate: 'TOP'},
                    {path: '#pageList/li[]',
                        assign: 'chapterList', innerPath: {chapterId: 'div/a@href?no', chapterTitle: 'div/a/div/p/span/span/'}}
            ]},
            {  route: '/webtoon/detail',
                html: [
                    {path: '#fixedHeader/div.chn/dl/dd[]/a',
                        translate: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'End']}
            ]},
            {  route: '/webtoon/(list|weekday)',
                html: [
                    {path: 'div.chn/dl/dd[]/a',
                        translate: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'End']}
            ]},
            {  route: '/bestChallenge/(list|genre|detail)',
                html: [
                    {path: '#genreTab/ul/li[]/a',
                        translate: ['All', 'Episode', 'Omnibus', 'Story', 'Daily', 'Humor', 'Fantasy', 'Action', 'Drama', 'Pure', 'Light', 'Thrill', 'Historical', 'Sport']}
            ]},
            {  route: '/webtoon/genre',
                html: [
                    {path: '#genreTab/ul/li[]/a',
                        translate: ['Episode', 'Omnibus', 'Story', 'Daily', 'Humor', 'Fantasy', 'Action', 'Drama', 'Pure', 'Light', 'Thrill', 'Historical', 'Sport']}
            ]},
            {  route: '/(webtoon|bestChallenge)/detail',
                html: [
                    {path: '#fixedHeader/header/a/+', tagName: 'div', style: 'position: absolute; top: 9px; left: 72px; width: 54px; height: 27px; cursor: pointer; border-radius: 2px; border: #333 1px solid; z-index: 40;',
                        assign: 'menu'},
                    {path: '#fixedHeader/div.ht/div/ul/li[]/a/span',
                        translate: ['Weekday', 'Genre', 'Challenge', 'MY']},
                    {path: '#fixedHeader/div.ht/div/ul/li/+/li/+/li/+/li/+/li/a',
                        translate: 'Smartoon '},
                    {path: '#fixedHeader/div.chh/h1',
                        assign: 'chapterTitle'},
                    {path: '#fixedHeader/div.chh/div.pl/a/span',
                        translate: 'LIST'},
                    {path: '#fixedHeader/div.chh/div.pr/a',
                        translate: '★ FAV'},
                    {path: '#toon_0@src?path-2',
                        assign: 'chapterId'},
                    {path: '#toon_0@src?path-3',
                        assign: 'webtoonId'},
                    {path: 'li[]/p/img#toon_0',
                        assign: 'imageList', innerPath: {style: 'margin-top: 0px; position: absolute; top: 0; left: 0;', keepOriginal: true}},
                    {path: '#starDiv/h3',
                        translate: 'AVERAGE RATING'},
                    {path: '#starscoreCount/em/+',
                        translate: ' voters'},
                    {path: '#starToggleButton',
                        translate: 'Rate'},
                    {path: '#toonLayer/+/div.cmt/div.wr/h3/span',
                        assign: 'webtoonAuthor'},
                    {path: '#toonLayer/+/div.cmt/div.wr/h3/span/+', tagName: 'span', style: 'font-weight: normal;',
                        translate: ' - author\'s comment'},
                    {path: '#spiLayer1/+/div/p/a/span.pv',
                        translate: 'PREV'},
                    {path: '#spiLayer1/+/div/p/a/span.nx',
                        translate: 'NEXT'},
                    {path: '#spiLayer1/+/div/p/a/+/a/span.nx',
                        translate: 'NEXT'},
                    {path: '#spiLayer1/+/div/p/~a',
                        translate: 'LIST'},
                    {path: '#ct/+/div.u_ft/div/div/a/span/+',
                        translate: 'TOP'},
                ],
                css: [
                    {selector: '.toon_view_lst li p',
                        style: 'overflow: hidden; position: relative;'}
                ]
            }
            ];
        // ----------------- DAUM $daum
        } else if(window.location.hostname == 'webtoon.daum.net' || window.location.hostname == 'cartoon.media.daum.net') {
            this.template = [
            {  route: '/(webtoon|league)/viewer/',
                html: [
                    {path: 'div.wrap/div.head_bar/div/h1/a.cartoon_logo',
                        translate: 'Home'},
                    {path: 'div.wrap/div.head_bar/div/h1/a.cartoon_logo/+', tagName: 'div', style: 'margin: 16px 0px 0px -16px; display: inline-block; background: #4c4c4c; width: 24px; height: 12px; cursor: pointer;',
                        assign: 'menu'},
                    {path: 'div.wrap/div.head_bar/div/div.episode_info/a',
                        assign: 'webtoonTitle'},
                    {path: 'div.wrap/div.head_bar/div/div.episode_info/a@href?path-1',
                        assign: 'webtoonId'},
                    {path: 'div.wrap/div.head_bar/div/div.episode_info/span.writer',
                        assign: 'webtoonAuthor'},
                    {path: 'div.wrap/div.head_bar/div/div.others/span.move_control/span.txt',
                        translate: 'NavBar'},
                    {path: 'div.wrap/div.head_bar/div/div.others/span.move_control/span.episode_title',
                        assign: 'chapterTitle'},
                    {path: '#scrollWrap/ul/li.on@id?0',
                        assign: 'chapterId'},
                    {path: 'div.wrap/div.main_content/div/div/img[]',
                        assign: 'imageList', innerPath: {style: 'display: block; margin-left: auto; margin-right: auto;'}},
                    {path: 'div.wrap/div.main_content/div.controler/div/div/div/a/',
                        translate: 'autoscroll'},
                    {path: '#scrollWrap/ul/li[]',
                        assign: 'chapterList', innerPath: {chapterTitle: 'a.title/', chapterId: 'a.title@href?0'}}
                ],
                css: [
                    {selector: '.head_bar h1 a.cartoon_logo',
                        style: 'text-indent: 5px; background: #4c4c4c; color: #EBEDEE; font: bold 12px/43px dotum;'},
                    {selector: '.main_content .img_list br',
                        style: 'display: none;'},
                    {selector: '.others > a:not([class="close"])',
                        style: 'text-indent: 23px;'},
                    {selector: '.others a em',
                        style: 'background: #4c4c4c; text-indent: 5px; display: inline-block; height: 43px; font: normal 12px/43px dotum; color: #EBEDEE;'},
                    {selector: '.controler .auto_scroll_wrap::before',
                        style: 'content: "top"; position: absolute; display: block; width: 50px; line-height: 21px; margin: -44px 0 0 25px; background: white; text-align: center; color: #6A6E7E;'},
                    {selector: '.controler .auto_scroll_wrap::after',
                        style: 'content: "bottom"; display: block;  width: 50px; line-height: 21px;  margin: -56px 0 0 25px; background: white; text-align: center; color: #6A6E7E;'},
                    {selector: '.episode_list .title',
                        style: 'overflow: hidden; white-space: nowrap; text-overflow: ellipsis;'},
                ]
            },
            {  route: '/webtoon/viewer/',
                html: [
                    {path: 'div.wrap/div.head_bar/div/div.others/a[]/', tagName: 'em',
                        translate: ['Home', 'WeekList', 'Bkmrk']}
                ]
            },
            {  route: '/league/viewer/',
                html: [
                    {path: 'div.wrap/div.head_bar/div/div.others/a[]/', tagName: 'em',
                        translate: ['League ', 'Bkmrk']}
                ]
            },
            {  route: '/($|(webtoon|league)/($|week|view/|select))',
                html: [
                    {path: '#wrapMinidaum/+', tagName: 'div', style: 'display: inline-block; width: 38px; height: 19px; cursor: pointer; position: absolute; top: 7px; left: 55px; z-index: 999999;',
                        assign: 'menu'},
                    {path: '#gnbCartoon/li[]/a/span.ir_wa/',
                        translate: ['Home', 'Webtoon', 'League', 'Market', 'Event', 'Forum', 'MY']},
                    {path: '#gnbCartoon/li/+/li/ul/li[]/a/',
                        translate: ['Webtoon', 'Weekday', 'Search']},
                    {path: '#gnbCartoon/li/+/li/+/li/ul/li[]/a/',
                        translate: ['League', 'Exhibitions']}
                ],
                css: [
                    {selector: '.gnb_cartoon .link_gnb',
                        style: 'width: auto !important; background: none; line-height: 43px;'},
                    {selector: '.gnb_cartoon .on .link_gnb',
                        style: 'color: red; text-decoration: underline;'},
                    {selector: '.gnb_cartoon :not(.on) .link_gnb:hover .ir_wa',
                        style: 'color: white; background: red;'},
                    {selector: '.gnb_cartoon :not(.on) .link_gnb:hover',
                        style: 'text-decoration: none'},
                    {selector: '.gnb_cartoon .ir_wa',
                        style: 'display: inline; padding: 4px; border-radius: 3px; width: auto; vertical-align: middle; height: 1em;'},
                    {selector: '#daumGnb',
                        style: 'background: none; line-height: 43px;'},
                    {selector: '#daumGnb li',
                        style: 'float: none; width: auto; display: inline-block;'},
                    {selector: '#daumGnb .gnb_cartoon',
                        style: 'float: none; width: 100%;'},
                    {selector: '#minidaumRank',
                        style: 'margin-left: 45px;'}
                ]
            },
            {  route: '/webtoon/$',
                html: [
                    {path: '#mCenter/div.area_body/h4',
                        translate: 'Schedule'},
                    {path: '#mCenter/div.area_body/ul.CT_ZONE_TAB/li[]/a/',
                        translate: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']},
                    {path: '#mCenter/div.area_body/ul.CT_ZONE_WEEK/li[]', observe: '#mCenter/div.area_body/ul.CT_ZONE_WEEK',
                        assign: 'webtoonList', innerPath: {webtoonId: 'span.info/a@href?path-1', webtoonTitle: 'span.info/a', webtoonAuthor: 'span.info/span'}},
                    {path: '#mCenter/div.area_body/div.CT_ZONE_NEW/ul/li[]',
                        assign: 'webtoonList', innerPath: {webtoonId: 'div.list_txt_btn/em/a@href?path-1', webtoonTitle: 'div.list_txt_btn/em/a', webtoonAuthor: 'div.list_txt_btn/span.txt_nick', webtoonBlurb: 'div.list_txt_btn/p'}},
                    {path: '#mCenter/div.area_body/div.CT_ZONE_NEW/h4',
                        translate: 'Try out a new!'}
                ],
                css: [
                    {selector: '.tab_webtoon_timeline',
                        style: 'background: none;'},
                    {selector: '.tab_webtoon_timeline li',
                        style: 'position: static !important; margin-right: -1px; box-sizing: border-box; background: #858585; border: 1px solid #626262;'},
                    {selector: '.tab_webtoon_timeline li a',
                        style: 'text-indent: 0px; display: inline-block; width: 100%; text-align: center; line-height: 26px; font-weight: bold; color: white; text-shadow: 0px 0px 1px black;'},
                    {selector: '.tab_webtoon_timeline li.on',
                        style: 'background: white; border-bottom: 0px; border-color: #5c5c5c;'},
                    {selector: '.tab_webtoon_timeline li.on a',
                        style: 'color: inherit; text-shadow: none;'},
                    {selector: '.tab_webtoon_timeline li a:hover',
                        style: 'text-decoration: none;'},
                    {selector: '.tab_webtoon_timeline .week1',
                        style: 'border-radius: 5px 0 0 0;'},
                    {selector: '.tab_webtoon_timeline .week7',
                        style: 'border-radius: 0 5px 0 0;'},
                    {selector: '.webtoon .area_body .list_thumb_text_btn .list_txt_btn p',
                        style: 'height: 2em; overflow: hidden; margin-bottom: 7px;'},
                    {selector: '.webtoon .area_body .list_thumb_text_btn .list_txt_btn em',
                        style: 'height: 1em; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;'},
                    {selector: '.type_title_webtoon',
                        style: 'text-indent: 0px; background: none; font-weight: bold; font-size: 1.2em; height: 1.2em;'},
                    {selector: '.list_img_info_h .info .subject, .list_img_info_h .info .writer',
                        style: 'overflow: hidden; text-overflow: ellipsis; height: 31px;'}
                ]
            },
            {  route: '/league/$',
                html: [
                    {path: '#mCenter/div/div.list_wrap/ul/li[]',  wait: true, observe: '#mCenter/div', options: {childList: true, subtree: true},
                        assign: 'webtoonList', innerPath: {webtoonId: 'em.tit/a@href?path-1|div.list_txt_btn/em/a@href?path-1', webtoonTitle: 'em.tit/a|div.list_txt_btn/em/a', webtoonAuthor: 'dl/dd|div.list_txt_btn/dl/dd'}},
                    {path: '#mRight/div.wrap_ranking/ul/li[]', wait: true,
                        assign: 'webtoonList', innerPath: {webtoonId: 'a@href?path-1', webtoonTitle: 'a/span.cont/em', webtoonAuthor: 'a/span.cont/span.name'}},
                    {path: '#mRight/div.wrap_sec/ul/li[]', wait: true, observe: '#mRight/div.wrap_sec/ul',
                        assign: 'webtoonList', innerPath: {webtoonId: 'a@href?path-1', webtoonTitle: 'a/span.cont/em', webtoonAuthor: 'a/span.cont/span.name'}},
                    {path: '#mCenter/div/div.wrap_worklist/ul/li[]/a', wait: true, observe: '#mCenter/div', options: {childList: true, subtree: true},
                        translate: ['Latest', 'Popular', 'All', 'Promoted', 'Comments']},
                    {path: '#mCenter/div/div.wrap_worklist/ul/li.all_on/..2/+/div.wrap_submenu/a[]', wait: true, observe: '#mCenter/div', options: {childList: true, subtree: true},
                        translate: ['All', 'Story', 'Omnibus', 'Episode']},
                    {path: '#mCenter/div/div.wrap_worklist/ul/li.latest_on/..2/+/div.wrap_submenu/a[]', wait: true, observe: '#mCenter/div', options: {childList: true, subtree: true},
                        translate: ['All', '1st,2nd League']},
                    {path: '#mCenter/div/div.wrap_worklist/ul/li.popular_on/..2/+/div.wrap_submenu/a[]', wait: true, observe: '#mCenter/div', options: {childList: true, subtree: true},
                        translate: ['Daily', 'Weekly']}
                ],
                css: [
                    {selector: '.tit .link_txt, .league .list_award .list_txt_btn em',
                        style: 'white-space: nowrap; width: 152px; display: block; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: '.list_wrap .list_update .cont .desc:first-of-type',
                        style: 'width: 152px;'},
                    {selector: '.wrap_ranking .cont em, .wrap_ranking .cont span.name',
                        style: 'white-space: nowrap; width: 115px; display: inline-block; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: '.wrap_ranking.wrap_sec .cont em, .wrap_ranking.wrap_sec .cont span.name',
                        style: 'width: 145px;'},
                    {selector: '.wrap_ranking .score',
                        style: 'overflow: hidden; text-indent: -20px;'},
                    {selector: '.league .list_update .desc',
                        style: 'text-overflow: ellipsis;'},
                    {selector: '.list_popular .nickname, .league .list_update .base:first-of-type',
                        style: 'display: none;'},
                    {selector: '.wrap_worklist .tab_worklist, #mCenter .wrap_worklist .tab_worklist li',
                        style: 'background: none;'},
                    {selector: '#mCenter .wrap_worklist .tab_worklist li a',
                        style: 'text-indent: 0px; box-sizing: border-box; text-align: center; color: white; font-weight: bold; text-shadow: 0 0 1px black; background: #aaacb5; border-right: 0; border: 1px solid #646976; vertical-align: text-bottom; line-height: 24px;'},
                    {selector: '#mCenter .wrap_worklist .tab_worklist li[class*="_on"] a',
                        style: 'border-radius: 5px 5px 0 0; background: #e83a31; border: 1px solid #9c1b15; line-height: 31px;'},
                    {selector: '#mCenter .wrap_worklist .tab_worklist li:first-of-type a',
                        style: 'border-radius: 5px 0 0 0;'},
                    {selector: '#mCenter .wrap_worklist .tab_worklist li:last-of-type a',
                        style: 'border-radius: 0 5px 0 0; border: 1px solid #646976;'},
                    {selector: '#mCenter .wrap_worklist .tab_worklist li[class*="_on"] + li a',
                        style: 'border-left: 0;'}
                ]
            },
            {  route: '/(webtoon/($|view/|week|select)|league/view)',
                html: [
                    {path: '#mRight/div.wrap_gradebest/h3',
                        translate: 'Best ratings'},
                    {path: '#mRight/div.wrap_gradebest/div/div[]/h4/a', wait: true,
                        translate: ['ongoing', 'complete']},
                    {path: '#mRight/div.wrap_gradebest/div/div[]/ol/li[]', wait: true,
                        assign: 'webtoonList', innerPath: {webtoonId: 'a@href?path-1', webtoonTitle: 'a'}},
                    {path: '#mRight/div.wrap_newpoptoon/h3',
                        translate: 'Latest top picks'},
                    {path: '#mRight/div.wrap_newpoptoon/div/div[]/h4/a', wait: true, observe: '#mRight/div.wrap_newpoptoon/div.cont_newpoptoon', options: {childList: true, subtree: true},
                        translate: ['daily', 'weekly']},
                    {path: '#mRight/div.wrap_newpoptoon/div/div[]/ol/li[]', wait: true, observe: '#mRight/div.wrap_newpoptoon', options: {childList: true, subtree: true},
                        assign: 'webtoonList', innerPath: {webtoonId: 'a@href?path-1', webtoonTitle: 'a'}},
                    {path: '#mCenter/div.area_body/div.btn_show_all/a',
                        translate: 'Weekday'}
                ],
                css: [
                    {selector: '.box_complete .list_complete li a, .box_series .list_series li a',
                        style: 'overflow: hidden; width: 140px; text-overflow: ellipsis; white-space: nowrap;'},
                    {selector: '.box_daily .list_daily li a, .box_weekly .list_weekly li a',
                        style: 'overflow: hidden; width: 160px; text-overflow: ellipsis; white-space: nowrap;'},
                    {selector: '.wrap_gradebest .cont_gradebest .tit_work a, .wrap_newpoptoon .cont_newpoptoon .tit_work a',
                        style: 'text-indent: 0px;'},
                    {selector: '.wrap_gradebest .cont_gradebest, .wrap_gradebest .cont_gradebest .on .tit_work, .wrap_newpoptoon .cont_newpoptoon, .wrap_newpoptoon .cont_newpoptoon .on .tit_work',
                        style: 'background: none'},
                    {selector: '.wrap_gradebest .cont_gradebest .tit_work a, .wrap_newpoptoon .cont_newpoptoon .tit_work a',
                        style: 'text-indent: 0px; background: #858585; box-sizing: border-box; text-align: center; line-height: 26px; font-size: 12px; border-radius: 5px 0 0 0; border: 1px solid #626262; color: white; text-shadow: 0px 0px 1px black;'},
                    {selector: '.wrap_gradebest .cont_gradebest .box_complete .tit_work a, .wrap_newpoptoon .cont_newpoptoon .box_weekly .tit_work a',
                        style: 'border-radius: 0 5px 0 0;'},
                    {selector: '.wrap_gradebest .on .tit_work .link_tab, .wrap_newpoptoon .on .tit_work .link_tab',
                        style: 'background: white; color: black; text-shadow: none; border-bottom: 0px;'},
                    {selector: '.right_wrap .tit_comm',
                        style: 'background: none; text-indent: 0px; width: auto; height: auto;'}
                ]
            },
            {  route: '/$',
                html: [
                    {path: '#mCenter/div.tmpListWrap/ul/li[]/a',
                        translate: [ 'Episode', 'Omnibus', 'Story', 'School', 'Drama', 'Fantasy', 'Genuine', 'Comic', 'Action', 'Martial Arts', 'Horror'], wait: true, observe: '#mCenter/div.tmpListWrap'}, //need translation on refresh, or css translation.
                    {path: '#mCenter/div.tmpListWrap/div.wrap_episode/ul/li[]', observe: '#mCenter/div.tmpListWrap', wait: true,
                        assign: 'webtoonList', innerPath: {webtoonId: 'span.cont/strong/a@href?path-1', webtoonTitle: 'span.cont/strong/a', webtoonAuthor: 'span.cont/span.desc/a'}},
                    {path: '#mRight/div.wrap_manseranking/div/div.box_webtoon/div/div[]/ol/li[]', wait: true, observe: '#mRight/div.wrap_manseranking/div',
                        assign: 'webtoonList',  innerPath: {webtoonId: 'div.cont/strong/a@href?path-1', webtoonTitle: 'div.cont/strong/a', webtoonAuthor: 'div.cont/span.desc/a'}},
                    {path: '#mRight/div.wrap_manseranking/h3',
                        translate: 'Toon Ranking'},
                    {path: '#mRight/div.wrap_manseranking/div/div[]/h4/a', wait: true, observe: '#mRight/div.wrap_manseranking/div',
                        translate: ['webtoon', 'paytoon']},
                    {path: '#mRight/div.wrap_manseranking/div/div/div/div[]/h5', observe: '#mRight/div.wrap_manseranking/div', wait: true,
                        translate: ['Best ongoing webtoon', 'Popular webtoon', 'Best completed webtoon']},
                    {path: '#mRight/div.wrap_manseranking/div/div/div/div[]/a', observe: '#mRight/div.wrap_manseranking/div', wait: true,
                        translate: ['more', 'more', 'more']},
                    {path: '#mRight/div.wrap_manseranking/div/div/div/div[]/ol/li/span/span.txt', observe: '#mRight/div.wrap_manseranking/div', wait: true,
                        translate: ['rating', 'rating', 'rating']}
                ],
                css: [
                    {selector: '.list_episode .tit, .list_episode .desc a, #mRight .cont_webtoon .tit a, #mRight .cont_webtoon .desc a',
                        style: 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; width: 120px;'},
                    {selector: '.link_tab',
                        style: 'text-indent: 0px; background: #858585; box-sizing: border-box; text-align: center; line-height: 26px; font-size: 12px; border-radius: 5px 0 0 0; border: 1px solid #626262; color: white; text-shadow: 0px 0px 1px black;'},
                    {selector: '.cont_manseranking div + div .link_tab',
                        style: 'border-radius: 0 5px 0 0;'},
                    {selector: '.on .link_tab',
                        style: 'background: white; color: black; text-shadow: none; border-bottom: 0px;'},
                    {selector: '.right_wrap .ico_comm',
                        style: 'background: none; text-indent: 0px;'},
                    {selector: '.right_wrap .ico_comm::after',
                        style: 'content: \' ❱\'; color: red;'},
                    {selector: '.cont_manseranking, .wrap_manseranking .tit_ranking, .cont_manseranking .on .tit_ranking', style: 'background: none;'},
                    {selector: '.right_wrap .tit_comm',
                        style: 'background: none; text-indent: 0px; width: 150px; height: auto;'},
                    {selector: '.cartoonhome .tab_webtoon',
                        style: 'background: none'},
                    {selector: '.tab_webtoon .tab_link',
                        style: 'text-indent: 0px; padding: 2px 7px 2px 6px; font-weight: bold; width: auto !important; background: #858585; box-sizing: border-box; text-align: center; line-height: 26px; font-size: 12px; border: 1px solid #626262; color: white; text-shadow: 0px 0px 1px black;'},
                    {selector: '.tab_webtoon li:nth-child(-n+3):not([class*=" on"]) .tab_link',
                        style: 'background: #707070;'},
                    {selector: '.tab_webtoon .on .tab_link',
                        style: 'background: white; color: black; text-shadow: none; border-bottom: 0px;' },
                    {selector: '.tab_webtoon li + li',
                        style: 'margin-left: -2px;'},
                    {selector: '.tab_webtoon li:first-of-type .tab_link',
                        style: 'border-radius: 5px 0 0 0;'},
                    {selector: '.tab_webtoon li:last-of-type .tab_link',
                        style: 'border-radius: 0 5px 0 0;'}
                ]
            },
            {  route: '/webtoon/week',
                html: [
                    {path: '#mCenter/div.area_toonlist/div[]/div/h3',
                        translate: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']},
                    {path: '#mCenter/div.area_toonlist/div[]/div/ul/li[]',
                        assign: 'webtoonList', weekdayList: true, innerPath: {webtoonId: 'p/a@href?path-1', webtoonTitle: 'p/a'}},
                    {path: '#mCenter/div.area_title/h2', style: 'text-indent: 0px; font-size: 1.1em; line-height: 1.33em; background: none; width: 100%;',
                        translate: 'Ongoing manwhas'}
                    
                ],
                css: [
                    {selector: '.list_episode .tit',
                        style: 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: '.webtoon .area_toonlist .toonlist_day ul li a',
                        style: 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'},
                    {selector: '.webtoon .area_toonlist .toonlist_day h3',
                        style: 'box-sizing: border-box; text-indent: 0px; line-height: 25px; font-size: 0.9em; text-align: center; color: white; text-shadow: 0 0 1px black; background: #acacac; border: 1px solid #696969; border-radius: 5px;'},
                    {selector: '.webtoon .area_toonlist .toonlist_day.selected h3',
                        style: 'background: #e83a31; border-color: #ad312d;'}
                ]
            },
            {  route: '/webtoon/view/',
                html: [
                    {path: '#mCenter/div.area_toon_info/div.wrap_cont/div/div.scrap_html/div/div/a@href?path-1',
                        assign: 'webtoonId'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_title/h3/img', tagName: 'span',
                        assign: 'webtoonTitle'},
                    {path: '#mCenter/ul.tab_webtoon_view/li[]/a',
                        translate: ['Chapters', 'Work notes', 'Related pick']},
                    {path: '#mCenter/div.area_toon_info/div.wrap_more/dl.list_intro/dt',
                        translate: 'Blurb'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_more/dl.list_intro/dd',
                        assign: 'webtoonBlurb'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_more/dl.list_more_info/dt.tit_genre',
                        translate: 'Genre'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_more/dl.list_more_info/dt.tit_grade',
                        translate: 'Rating'},
                ]
            },
            {  route: '/league/view/',
                html: [
                    {path: '#mCenter/div.area_toon_info/div.layer_pum/div.scrap_html/div/div/a@href?path-1',
                        assign: 'webtoonId'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_title/h3', style: 'font: 14px/1.5 dotum,sans-serif; font-weight: 700;',
                        translate: ' '},
                    {path: '#mCenter/div.area_toon_info/div.wrap_title/h3/span.repeat', className: ' ',
                        assign: 'webtoonTitle'},
                    {path: '#mCenter/ul.tab_webtoon_view/li[]/a',
                        translate: ['Chapters', 'Related pick']},
                    {path: '#mCenter/div.area_toon_info/div.wrap_more/dl/dt',
                        translate: 'Blurb'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_more/dl/dd',
                        assign: 'webtoonBlurb'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_more/dl.info_recom/dt',
                        translate: 'Links'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_more/dl.info_recom/+/dl/dt',
                        translate: 'Votes'},
                ]
            },
            {  route: '/(league|webtoon)/view/',
                html: [
                    {path: '#webtoonList/li[]', observe: '#webtoonList',
                        assign: 'chapterList', innerPath: {chapterId: 'p/a@href?path-1', chapterTitle: 'p/a'}},
                    {path: '#mCenter/div.area_toon_info/div.btns/button',
                        translate: 'FIRST'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_cont/dl/dt',
                        translate: 'Author'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_cont/dl/dd/a',
                        assign: 'webtoonAuthor'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_cont/dl/+/dl/dt',
                        translate: 'Status'},
                    {path: '#mCenter/div.area_toon_info/div.wrap_cont/dl/+/dl/dd/button', style: 'text-indent: 0px; background: none;',
                        translate: 'More ▾'},
                ],
                css: [
                    {selector: '.btn_webtoon_first',
                        style: 'background: #61636e; text-indent: 0px; color: white; text-shadow: 0 0 1px black; border: 1px solid #32353a; border-radius: 3px;'},
                    {selector: '.league .wrap_list_toon .list_toon li p, .webtoon .wrap_list_toon .list_toon li p',
                        style: 'white-space: nowrap; text-overflow: ellipsis; overflow: hidden;'},
                    {selector: '#mCenter .tab_webtoon_view, #mCenter .tab_webtoon_view li',
                        style: 'background: none; border-bottom: 1px solid lightgrey;'},
                    {selector: '#mCenter .tab_webtoon_view li a',
                        style: 'text-indent: 0px; height: 26px; margin-top: 5px; box-sizing: border-box; text-align: center; color: white; font-weight: bold; text-shadow: 0 0 1px black; background: #aaacb5; border-right: 0; border: 1px solid #646976; vertical-align: text-bottom; line-height: 24px;'},
                    {selector: '#mCenter .tab_webtoon_view li[class*=" on"] a',
                        style: 'border-radius: 5px 5px 0 0; height: 31px; margin-top: 0px; background: #e83a31; border: 1px solid #9c1b15; line-height: 31px;'},
                    {selector: '#mCenter .tab_webtoon_view li:first-of-type a',
                        style: 'border-radius: 5px 0 0 0;'},
                    {selector: '#mCenter .tab_webtoon_view li:last-of-type a',
                        style: 'border-radius: 0 5px 0 0; border: 1px solid #646976;'},
                    {selector: '#mCenter .tab_webtoon_view li[class*=" on"] + li a',
                        style: 'border-left: 0;'},
                    {selector: '.wrap_title h3 span',
                        style: 'width: 300px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'},
                    {selector: '.webtoon .area_toon_info .desc_author, .league .area_toon_info .wrap_cont dd',
                        style: 'width: 290px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'},
                    {selector: '.webtoon .area_toon_info dt.type_title_info, .league .area_toon_info dt.type_title_info',
                        style: 'background: none; text-indent: 0; color: grey; font-weight: bold;'},
                ]
            },
            {  route: '/webtoon/select',
                html: [
                    {path: '#mCenter/div.box_choice_setting/strong[]', observe: '#mCenter/div.box_choice_setting', options: {childList: true, subtree: true},
                        translate: ['Form', 'Genre', 'Rating', 'Work', 'Etc.']},
                    {path: '#mCenter/div.box_choice_setting/ul[]/li[]/a', observe: '#mCenter/div.box_choice_setting', options: {childList: true, subtree: true},
                        translate: [  'Any', 'Story', 'Omnibus', 'Episode', 
                                    'School', 'Comic', 'Drama', 'Action', 'Fantasy', 'Fighting', 'Genuine', 'Horror',
                                    '9.7+', '9.5~9.7', '9.0~9.5', '9.0-',
                                    'Ongoing', 'Complete',
                                    'Popular works', 'Short vowel ', 'Imaging work ', 'Contest Winners']},
                    {path: '#mCenter/div.wrap_choicelist/ul/li[]', observe: '#mCenter/div.wrap_choicelist/ul', wait: true,
                        assign: 'webtoonList', innerPath: {webtoonId: 'span.cont/strong/a@href?path-1', webtoonTitle: 'span.cont/strong/a', webtoonAuthor: 'span.cont/span.desc/a'}}
                ],
                css: [
                    {selector: '.box_choice_setting strong',
                        style: 'width: 108px; left: 1px; padding-left: 20px;'},
                    {selector: '.box_choice_setting .list_form + strong',
                        style: 'width: 159px; left: 130px;'},
                    {selector: '.box_choice_setting .list_type + strong',
                        style: 'left: 310px;'},
                    {selector: '.box_choice_setting .list_grade + strong',
                        style: 'left: 439px;'},
                    {selector: '.box_choice_setting .list_work + strong',
                        style: 'left: 569px;'},
                    {selector: '.box_choice_setting',
                        style: 'position: relative;'},
                    {selector: '.box_choice_setting .screen_out',
                        style: 'color: white; font-weight: bold; text-shadow: 0 0 1px black; background: #ababab; height: 32px; font-size: 12px; top: 4px; line-height: 32px; display: inline-block;'},
                    {selector: '.wrap_choicelist .list_choice .tit, .wrap_choicelist .list_choice .link_txt',
                        style: 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; width: 120px;'}
                ]
            }
            ];
        // ----------------- NATE $nate
        } else if(window.location.hostname == 'comics.nate.com') {
            this.template = [
                {  route: '',
                    html: [
                        {path: 'div.wrap/div.header/h2/a',
                            translate: 'Home'},
                        {path: 'div.wrap/div.header/h2/+', tagName: 'div', style: 'position: absolute; top: 37px; left: 136px; display: inline-block; background: #4c4c4c; width: 24px; height: 12px; cursor: pointer;',
                            assign: 'menu'},
                        {path: '#searchWrap/+/div.secNaviWrap/ul/li[]/a',
                           translate: ['Home', 'Webtoons', 'Free', 'Genre', 'Premium', 'Smart', 'Magazine', 'MY', 'Novels']},
                    ],
                    css: [
                        {selector: '.header #searchWrap',
                            style: 'position: absolute; left: 167px;'},
                        {selector: '.header .secNaviWrap li a',
                            style: 'background: none; width: auto !important; font-weight: bolder; color: black; font-size: 14px; text-indent: 0px;'},
                        {selector: '.header .secNaviWrap li a.on',
                            style: 'color: #ff4200;'}
                    ]
                },
                {  route: '/main',
                    html: [
                        {path: '#webToonChoice/div/a[]/span',
                            translate: ['dafuck1', 'dafuck2', 'dafuck3', 'dafuck4']},
                        {path: '#webToonChoice/div.wtc_toonImgWrap/div[]/a[]',
                            assign: 'webtoonList', weekday: true, innerPath: {webtoonId: '-/a@href?btno', webtoonTitle: 'img@alt'}},
                        {path: '#wtc_slide_items/a[]',
                           translate: ['Titles', 'Don\'t', 'Appear', 'Right away']},
                        {path: '#mainTodayToon/h4/span',
                           translate: 'Pick of the day'},
                        {path: '#mainTodayToon/a',
                           translate: 'more'},
                        {path: '#mtt_dayTab/a[]/span',
                           translate: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']},
                        {path: '#mainTodayToon/ul[]/li[]',
                            assign: 'webtoonList', weekday: true, innerPath: {webtoonId: 'a@href?btno', webtoonTitle: 'a/span.mtt_txtLine/span.mtt_title', webtoonAuthor: 'a/span.mtt_txtLine/span.mtt_author'}},
                        {path: '#mainTodayToon/+/div.main1stToon/h4/span',
                            translate: 'Most commented on'},
                        {path: '#mainTodayToon/+/div.main1stToon/a',
                            translate: 'more'},
                        {path: '#mainTodayToon/+/div.main1stToon/div/a[]',
                            assign: 'webtoonList', innerPath: {webtoonId: '-/+/a@href?btno', webtoonTitle: 'span.m1t_txt/span.m1t_title', webtoonAuthor: 'span.m1t_txt/span.m1t_author'}}
                    ],
                    css: [
                        {selector: '#webToonChoice .wtc_nav a',
                            style: 'background: #7e7e7e; box-sizing: border-box; color: white; margin: 0 6px; height: 35px; display: block; width: 108px;'},
                        {selector: '#webToonChoice .wtc_nav a .a11y',
                            style: 'position: static; display: block; font-weight: bolder; width: auto; height: 32px; line-height: 30px; text-align: center; text-indent: 0px; font-size: 14px; font-family: Verdana;'},
                        {selector: '#webToonChoice.on1 #wtc_m1 span, #webToonChoice.on2 #wtc_m2 span, #webToonChoice.on3 #wtc_m3 span, #webToonChoice.on4 #wtc_m4 span',
                            style: 'text-shadow: 2px 2px black; border-top: 1px solid #7b6800; border-left: 6px solid #ffdd2f; background: #4f421b; z-index: 2;'},
                        {selector: '#webToonChoice.on1 #wtc_m1, #webToonChoice.on2 #wtc_m2, #webToonChoice.on3 #wtc_m3, #webToonChoice.on4 #wtc_m4',
                            style: 'margin: 0px; width: 120px; border: 1px solid black; margin-bottom: -2px;'},
                        {selector: '#webToonChoice.on2 #wtc_m2 span',
                            style: 'background: #335565; border-top-color: #588295;'},
                        {selector: '#webToonChoice.on3 #wtc_m3 span',
                            style: 'background: #783848; border-top-color: #9c5466;'},
                        {selector: '#webToonChoice.on4 #wtc_m4 span',
                            style: 'background: #5c6f38; border-top-color: #5c6f38;'},
                        {selector: '#webToonChoice .wtc_nav a + a',
                            style: 'border-top: 1px solid #5d5d5d;'},
                        {selector: '#webToonChoice.on1 .wtc_nav a:not(#wtc_m1)::before, #webToonChoice.on2 .wtc_nav a:not(#wtc_m2)::before, #webToonChoice.on3 .wtc_nav a:not(#wtc_m3)::before, #webToonChoice.on4 .wtc_nav a:not(#wtc_m4)::before',
                            style: 'content: ""; display: block; line-height:1px; border-top:1px solid #a4a4a4;'},
                        {selector: '#mtt_dayTab u, .main1stToon h4',
                            style: 'background: none;'},
                        {selector: '.mtt_dayTab .a11y',
                            style: 'position: static; font-family: Verdana; width: auto; height: auto; color: #898989; margin-top: 17px; font-size: 12px; font-weight: bold; text-align: center; text-indent: 0px;'},
                        {selector: '.is_mon .mtt_mon .a11y, .is_tue .mtt_tue .a11y, .is_wed .mtt_wed .a11y, .is_thu .mtt_thu .a11y, .is_fri .mtt_fri .a11y, .is_sat .mtt_sat .a11y, .is_sun .mtt_sun .a11y',
                            style: 'font-style: italic; color: black; font-size: 14px; margin: 14px 8px 0 0;'},
                        {selector: '.main1stToon h4 .a11y',
                            style: 'position: static; display: inline-block; width: auto; height: auto; font-size: 12px; font-family: Verdana; text-indent: 0px; background: #ffff5d; color: black;'},
                        {selector: '.main1stToon h4 .a11y::after',
                            style: 'background: white; content: " Webtoons";'}
                    ]
                },
                {  route: '/webtoon',
                    html: [
                        {path: 'div.wrap/div.genre/dl/dd[]/a',
                            translate: ['Weekday', 'Ranking', 'Completed']}
                    ]
                },
                {  route: '/webtoon/(index|ranking|finish)',
                    html: [
                        {path: 'div.wrap/div.container/div.toonTop/div/a[]',
                            assign: 'webtoonList', innerPath: {webtoonId: '-/+/a@href?btno', webtoonTitle: 'span.toc_detail/span.toc_title', webtoonAuthor: 'span.toc_detail/span.toc_author', webtoonBlurb: 'span.toc_detail/span.toc_txt'}}
                    ],
                    css: [
                        {selector: '.todayOneCut .toc_title, .todayOneCut .toc_txt',
                            style: 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'},
                        {selector: '.todayOneCut .toc_txt',
                            style: 'height: 11px;'},
                        {selector: '.toonTop h3',
                            style: 'background: none; width: auto;'},
                        {selector: '.toonTop h3 .a11y',
                            style: 'font-family: Verdana; padding-bottom: 2px; position: static; width: auto; height: auto; font-size: 14px; text-indent: 0px; color: white; text-shadow: 2px 2px 1px black, 0 0 2px black; font-weight: bolder;'},
                        {selector: '.toonTop h3 .a11y::after',
                            style: 'color: #ffe007;'},
                    ]
                },
                {  route: '/webtoon/index',
                    html: [
                        {path: 'div.wrap/div.container/div.toonTop/div/h3/span',
                            translate: 'No Idea What'},
                        {path: '#webToonList/div.wtl_tabs/div.wtl_tabs_left/a[]/span',
                            translate: ['Weekday', 'Genre']},
                        {path: '#webToonList/div.wtl_table_day/table/thead/tr/th[]/span',
                            translate: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']},
                        {path: '#webToonList/div.wtl_table_genre/table/thead/tr/th[]/span',
                            translate: ['Comic', 'Daily', 'Love', 'Drama', 'Action/Thriller', 'Fantasy', 'Sport']},
                    ],
                    css: [
                        {selector: '.toonTop h3 .a11y::after',
                            style: 'content: " That Is?";'},
                        {selector: '.wtl_tabs_left a',
                            style: 'font-size: 14px; position: relative; height: 18px !important;'},
                        {selector: '.wtl_tabs_left a span',
                            style: 'border-top: 2px solid white;'},
                        {selector: '.wtl_tabs_left a:first-of-type span::after',
                            style: 'position: absolute; right: -10px; top: 2px; background-color: grey; display: block; width: 1px; content: " ";'},
                        {selector: '.wtl_tabs_left a + a',
                            style: 'margin-left: 20px;'},
                        {selector: '.is_day .wtl_tabs_left a.btn_sort_day span, .is_genre .wtl_tabs_left a.btn_sort_genre span',
                            style: 'color: red; border-top: 2px solid red; font-weight: bold;'},
                        {selector: '.wtl_table th',
                            style: 'background: none;'},
                        {selector: '.wtl_table th .a11y',
                            style: 'position: static; overflow: visible; width: auto; height: auto; font-size: inherit; text-indent: 0px; text-align: center;'},
                        {selector: '.wtl_table th + th .a11y',
                            style: 'border-left: 1px grey solid;'},
                        {selector: '.is_mon .wtl_mon .a11y, .is_tue .wtl_tue .a11y, .is_wed .wtl_wed .a11y, .is_thu .wtl_thu .a11y, .is_fri .wtl_fri .a11y, .is_sat .wtl_sat .a11y, .is_sun .wtl_sun .a11y',
                            style: 'height: 38px; margin-top: 1px; border: 2px solid black; border-radius: 5px 5px 0 0; line-height: 38px; background: linear-gradient(#fe8280, #fb4341, #f22d2a, #e6201d, #d51310) red; color: white; text-shadow: 0px 0px 1px black, 1px 1px 2px black;'},
                        {selector: '.is_mon .wtl_mon + th .a11y, .is_tue .wtl_tue + th .a11y, .is_wed .wtl_wed + th .a11y, .is_thu .wtl_thu + th .a11y, .is_fri .wtl_fri + th .a11y, .is_sat .wtl_sat + th .a11y, .is_sun .wtl_sun + th .a11y',
                            style: 'border-left: none;'},
                    ]
                },
                {  route: '/webtoon/(index|finish)',
                    html: [
                        {path: '#webToonList/div.wtl_tabs/div.wtl_tabs_right/a[]/span',
                            translate: ['sort by views', 'sort by comments']},
                        {path: '#webToonList/div.wtl_tabs/+/div/table/tbody/tr/td[]/a[]',
                            assign: 'webtoonList', weekdayList: true, innerPath: {webtoonId: 'span/../a@href?btno', webtoonTitle: 'span.wtl_title', webtoonAuthor: 'span.wtl_author'}}
                    ],
                    css: [
                        {selector: '#webToonList .wtl_title, #webToonList .wtl_author',
                            style: 'padding: 0 4px;'},
                        {selector: '.wtl_tabs a',
                            style: 'background: none !important; position: relative; text-decoration: none; width: auto !important;'},
                        {selector: '.wtl_tabs a .a11y',
                            style: 'position: static; width: auto; height: auto; font-size: inherit; text-indent: 0px;'},
                        {selector: '.wtl_tabs_right a:first-of-type span::after',
                            style: 'position: absolute; right: -10px; top: 0; background-color: grey; display: block; width: 1px; content: " ";'},
                        {selector: '.wtl_tabs_right a + a',
                            style: 'margin-left: 20px;'},
                        {selector: '.is_view .wtl_tabs_right a.btn_sort_view span, .is_reply .wtl_tabs_right a.btn_sort_reply span',
                            style: 'font-weight: bold; color: black;'},
                        {selector: '.wtl_tabs_right',
                            style: 'margin-top: 3px;'},
                    ]
                },
                {  route: '/webtoon/ranking',
                    html: [
                        {path: 'div.wrap/div.container/div.toonTop/div/h3/span',
                            translate: 'Weekly'},
                        {path: 'div.wrap/div.container/div.toonBottom/div/h3',
                            translate: 'Daily ranking'},
                        {path: 'div.wrap/div.container/div.toonBottom/div/div.dr_tabs/div.dr_tabs_right/a[]/span',
                            translate: ['sort by views', 'sort by comments']},
                        {path: 'div.wrap/div.container/div.toonBottom/div/ul/li[]',
                            assign: 'webtoonList', innerPath: {webtoonId: 'a@href?btno', webtoonTitle: 'a/span.dr_txtLine/span.dr_title', webtoonAuthor: 'a/span.dr_txtLine/span.dr_author'}},
                    ],
                    css: [
                        {selector: '.toonTop h3 .a11y::after',
                            style: 'content: " ranking";'},
                        {selector: '.dr_title',
                            style: 'width: 370px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'},
                        {selector: '.dr_tabs a',
                            style: 'background: none !important; position: relative; text-decoration: none; width: auto !important;'},
                        {selector: '.dr_tabs a .a11y',
                            style: 'position: static; width: auto; height: auto; font-size: inherit; text-indent: 0px;'},
                        {selector: '.dr_tabs_right a:first-of-type span::after',
                            style: 'position: absolute; right: -10px; top: 0; background-color: grey; display: block; width: 1px; content: " ";'},
                        {selector: '.dr_tabs_right a + a',
                            style: 'margin-left: 20px;'},
                        {selector: '.is_view .dr_tabs_right a.btn_sort_view span, .is_reply .dr_tabs_right a.btn_sort_reply span',
                            style: 'font-weight: bold; color: black;'},
                        {selector: '.dr_tabs_left',
                            style: 'display: none;'},
                        {selector: '.dailyRank h3',
                            style: 'display: inline-block; width: 49%; position: static; height: auto; font-size: 14px; color: black; text-indent: 0px;'},
                        {selector: '.dr_tabs',
                            style: 'display: inline-block; width: 49%;'},
                    ]
                },
                {  route: '/webtoon/finish',
                    html: [
                        {path: 'div.wrap/div.container/div.toonTop/div/h3/span',
                            translate: 'Recommended'},
                        {path: 'div.wrap/div.container/div.toonBottom/div/h3',
                            translate: 'Completed webtoons'},
                        {path: 'div.wrap/div.container/div.toonBottom/div/div.dr_tabs/div.dr_tabs_right/a[]/span',
                            translate: ['sort by views', 'sort by comments']},
                        {path: 'div.wrap/div.container/div.toonBottom/div/ul/li[]',
                            assign: 'webtoonList', innerPath: {webtoonId: 'a@href?btno', webtoonTitle: 'a/span.dr_txtLine/span.dr_title', webtoonAuthor: 'a/span.dr_txtLine/span.dr_author'}},
                        {path: '#webToonList/div.wtl_table_genre/table/thead/tr/th[]/span',
                            translate: ['Comic', 'Daily', 'Love', 'Drama', 'Action/Thriller', 'Fantasy', 'Sport']}
                    ],
                    css: [
                        {selector: '.toonTop h3 .a11y::after',
                            style: 'content: " picks";'},
                        {selector: '.wtl_tabs_left',
                            style: 'display: none;'},
                        {selector: '#webToonList h3',
                            style: 'display: inline-block; width: 49%; position: static; height: auto; font-size: 14px; color: black; text-indent: 0px;'},
                        {selector: '.wtl_tabs',
                            style: 'display: inline-block; width: 49%;'},
                        {selector: '.wtl_table th',
                            style: 'background: none;'},
                        {selector: '.wtl_table th .a11y',
                            style: 'position: static; overflow: visible; width: auto; color: #444; height: auto; font-size: inherit; text-indent: 0px; text-align: center;'},
                        {selector: '.wtl_table th + th .a11y',
                            style: 'border-left: 1px grey solid;'}
                    ]
                },
                {  route: '/webtoon/list',
                    html: [
                        {path: 'div.wrap/div.container/div.toonTop/div.toonInfo/div.tif_infoBox/div.tif_author',
                            assign: 'webtoonAuthor'},
                        {path: 'div.wrap/div.container/div.toonTop/div.toonInfo/div.tif_infoBox/div.tif_txt',
                            assign: 'webtoonBlurb'},
                        {path: 'div.wrap/div.container/div.toonTop/div.toonInfo/div.tif_infoBox/div.tif_btnArea/a@href?btno',
                            assign: 'webtoonId'},
                        {path: 'div.wrap/div.container/div.toonTop/div.toonInfo/div.tif_infoBox/div.tif_btnArea/a[]/span',
                            translate: ['FIRST', 'FAV', 'AUTHOR', 'SIMILAR']},
                        {path: 'div.wrap/div.container/div.toonBottom/div/div/div/h3/',
                            assign: 'webtoonTitle'},
                        {path: 'div.wrap/div.container/div.toonBottom/div/div/div/h3/i',
                            translate: ' '},
                        {path: 'div.wrap/div.container/div.toonBottom/div/ul/li[]',
                            assign: 'chapterList', innerPath: {chapterId: 'a@href?bsno', chapterTitle: 'a/span.tel_txtLine/span.tel_linkLine/span.tel_title'}},
                        {path: '#tif_customSelect/ul/li[]',
                            assign: 'webtoonList', innerPath: {webtoonId: 'a@href?btno', webtoonTitle: 'a'}},
                        {path: 'div.wrap/div.container/div.toonBottom/div/div/div.tel_tabs_right/a[]/span',
                            translate: ['sort by date', 'sort by comments']}
                    ],
                    css: [
                        {selector: '.tel_tabs a',
                            style: 'background: none !important; position: relative; text-decoration: none; width: auto !important;'},
                        {selector: '.tel_tabs a .a11y',
                            style: 'position: static; width: auto; height: auto; font-size: inherit; text-indent: 0px;'},
                        {selector: '.tel_tabs_right a:first-of-type span::after',
                            style: 'position: absolute; right: -10px; top: 0; background-color: grey; display: block; width: 1px; content: " ";'},
                        {selector: '.tel_tabs_right a + a',
                            style: 'margin-left: 20px;'},
                        {selector: '.is_latest .tel_tabs_right a.btn_sort_latest span, .is_reply .tel_tabs_right a.btn_sort_reply span',
                            style: 'font-weight: bold; color: black;'},
                        {selector: '.tel_tabs_right',
                            style: 'margin-top: 3px;'},
                    ]
                },
                {  route: '/webtoon/detail',
                    html: [
                        {path: 'div.wrap/div.toonViewContainer/div.toonViewInfo/div.tvi_infoBox/h3/a@href?btno',
                            assign: 'webtoonId'},
                        {path: 'div.wrap/div.toonViewContainer/div.toonViewInfo/div.tvi_infoBox/h3/a',
                            assign: 'webtoonTitle'},
                        {path: 'div.wrap/div.toonViewContainer/div.toonViewInfo/div.tvi_infoBox/div.tvi_author/a',
                            assign: 'webtoonAuthor'},
                        {path: 'div.wrap/div.toonViewContainer/div.toonViewInfo/div.tvi_infoBox/div.tvi_episodeInfo/span.tvi_episodeTitle',
                            assign: 'chapterTitle'},
                        {path: 'div.wrap/div.toonViewContainer/div.toonViewInfo/div.tvi_infoBox/div.tvi_btnArea/a.btn_bookmark@onclick?1',
                            assign: 'chapterId'},
                        {path: 'div.wrap/div.toonViewContainer/div.toonViewInfo/div.tvi_infoBox/div.tvi_btnArea/div[]/',
                            translate: ['votes ', 'comments ']},
                        {path: 'div.wrap/div.toonViewContainer/div.toonViewInfo/div.tvi_infoBox/div.tvi_btnArea/a[]/span',
                            translate: ['FIRST', 'FAV']},
                        {path: 'div.wrap/div.toonViewContainer/div.toonNavTop/div/a.btn_prev',
                            translate: 'PREV'},
                        {path: 'div.wrap/div.toonViewContainer/div.toonNavTop/div/a.btn_next',
                            translate: 'NEXT'},
                        {path: 'div.wrap/div.toonViewContainer/div.toonNavTop/div/div',
                            translate: ' '},
                        {path: 'div.wrap/div.toonViewContainer/div.toonView/img[]',
                            assign: 'imageList', innerPath: {style: 'display: block; margin-left:auto; margin-right: auto; text-align: center;'}},
                        {path: '#btn_tntSelect',
                            translate: 'Chapter list'},
                        {path: '#tnt_customSelect/ul/li[]',
                            assign: 'chapterList', innerPath: {chapterId: 'a@href?bsno', chapterTitle: 'a'}},
                        {path: '#tnb_carouselWrap/ul/li[]',
                            assign: 'chapterList', innerPath: {chapterId: 'a@href?bsno', chapterTitle: 'a/span.tnb_episodeNum'}}
                    ],
                    css: [
                        {selector: '.tnb_episodeNum',
                            style: 'width: 169px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'},
                    ]
                },
                {  route: '/webtoon/(detail|list)',
                    css: [
                        {selector: '.btn_1stEpisode .a11y, .btn_bookmark .a11y, .btn_zzim .a11y, .btn_authorOther .a11y, .btn_genreSame .a11y',
                            style: 'position: static; display: inline-block; margin: auto; width: auto; height: auto; font-size: 13px; text-align: center; text-indent: 0px; font-weight: bold; color: #363636; background: white; margin-top: 4px;'},
                        {selector: '.btn_1stEpisode, .btn_bookmark, .btn_zzim, .btn_authorOther, .btn_genreSame',
                            style: 'text-align: center;'},
                        {selector: '.btn_1stEpisode .a11y',
                            style: 'background: #ed1c24; color: white; text-shadow: 1px 1px black, 1px 0px black, 1px -1px black, 0px 1px black, 0px -1px black, -1px 1px black, -1px 0px black, -1px -1px black; padding: 1px 10px;'},
                        {selector: '.btn_authorOther .a11y, .btn_genreSame .a11y',
                            style: 'padding: 1px 20px;'},
                        {selector: '.btn_zzim .a11y',
                            style: 'margin-left: 18px; padding: 1px 0px;'},
                        {selector: '.btn_bookmark .a11y',
                            style: 'margin-left: 18px; padding: 1px 10px;'},
                    ]
                }
            ];
        // ----------------- OLLEH $olleh
        } else if(window.location.hostname == 'webtoon.olleh.com') {
            this.template = [
                {   route: '(/main|/ranking|/toon/(weekList|genreList|toonList|timesList))',
                    html: [
                        {path: '#header/div.top/h1/+',  tagName: 'h3', style: 'margin: 24px 5px; display: inline-block; background: #4c4c4c; width: 24px; height: 12px; cursor: pointer; position: relative;',
                            assign: 'menu'},
                        {path: '#header/div.topEtc/ul/li/+/li/a/img/+',  tagName: 'span', style: 'display: inline-block; width: 68px; background: white; font-size: 16px; font-family: Verdana; text-shadow: 1px 0; line-height: 42px; margin-left: -68px;',
                            translate: 'Ranking'},
                        {path: '#container/div.layout_right/div.m_weekly_ranking/ol/li[]',
                            assign: 'webtoonList', innerPath: {webtoonId: 'a@href?webtoonSeq', webtoonTitle: 'a/div.cont/div.name', webtoonAuthor: 'a/div.cont/div.cntEtc/span.author', webtoonBlurb: 'div.story/span'}},
                        {path: '#container/div.layout_right/div.m_weekly_ranking/div.tit/img', tagName: 'h3',
                            translate: 'Monthly Ranking'},
                        {path: '#container/div.layout_right/div.m_weekly_ranking/div.more/a',
                            translate: '+ More'}
                    ],
                    css: [
                        {selector: '.topEtc .on span',
                            style: 'color: #f14b59;'},
                        {selector: '.topEtc a',
                            style: 'color: #222;'}
                    ]
                },
                {   route: '/toon/(weekList|genreList|toonList|timesList)',
                    html: [
                        {path: '#header/div.subMenu/div/ul/li[]/a',
                            translate: ['Weekday', 'Genre', 'Title']},
                    ]
                },
                {   route: '/toon/(weekList|genreList|toonList)',
                    html: [
                        {path: '#container/div/div/ul/li[]',
                            assign: 'webtoonList', innerPath: {webtoonId: 'a@href?webtoonseq', webtoonTitle: 'a/span.conts/span.name', webtoonAuthor: 'a/span.conts/span.author|a/span.conts/span.info'}}
                    ]
                },
                {   route: '/toon/toonList',
                    html: [
                        {path: '#container/div/div.toon_toon_list/div.tabEtc[]/div.thumbnailList/ul/li[]',
                            assign: 'webtoonList', weekdayList: true, innerPath: {webtoonId: 'a@href?webtoonseq', webtoonTitle: 'a/span.li_tit/span', webtoonAuthor: 'a/span.li_author'}}
                    ]
                },
                {   route: '/toon/genreList',
                    html: [
                        {path: '#container/div/div.toon_genre_list/div.tabEtc[]/div.thumbnailList/ul/li[]',
                            assign: 'webtoonList', weekdayList: true, innerPath: {webtoonId: 'a@href?webtoonseq', webtoonTitle: 'a/span.li_tit/span', webtoonAuthor: 'a/span.li_author'}},
                        {path: '#container/div/div.toon_genre_list/div.tab[]/a',
                            translate: ['Daily', 'Humor', 'Drama', 'Fantasy', 'Emotion', 'Action', 'Complete']}
                    ],
                    css: [
                        {selector: '.toon_genre_list .tab a',
                            style: 'background-image: none !important; box-sizing: border-box; text-align: center; border: 1px solid lightgrey; border-bottom: 1px solid #f14b59; border-left-width: 0px; line-height: 45px; font-weight: bold;'},
                        {selector: '.toon_genre_list .tab.tab01 a',
                            style: 'border-left-width: 1px;'},
                        {selector: '.toon_genre_list .tab a.on',
                            style: 'background: #f14b59; border-color: #f14b59; color: white;'}
                    ]
                },
                {   route: '/toon/weekList',
                    html: [
                        {path: '#container/div/div.toon_day_list/div.btm_conts/div/dl[]/dd[]',
                            assign: 'webtoonList', weekdayList: true, innerPath: {webtoonId: 'a@href?webtoonseq', webtoonTitle: 'a/span.dd_tit/span', webtoonAuthor: 'a/span.dd_author'}},
                        {path: '#container/div/div.toon_day_list/div/div.tit/img', tagName: 'h3',
                            translate: 'Weekday list'},
                        {path: '#container/div/div.toon_day_list/div.btm_conts/div/dl[]/dt',
                            translate: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
                    ],
                    css: [
                        {selector: '.toon_day_list .dl_list dt',
                            style: 'text-indent: 0px; box-sizing: border-box; text-align: center; background: white; border-top: 1px solid #505050; border-right: 1px solid #EEE; line-height: 40px; font-weight: bold;'},
                        {selector: '.toon_day_list .dl_list.dl_list00 dt',
                            style: 'border-right: 0px;'},
                        {selector: '.toon_day_list .dl_list dt.on',
                            style: 'background: #f14b59; position: relative; border-right: none; color: white; border-top: none;'},
                        {selector: '.toon_day_list .dl_list dt.on::before',
                            style: 'content: \'\'; display: block; height: 0px; width: 0px; position: absolute; bottom: 5px; left: 0px; border-top: 15px solid #f14b59; border-left: 48px solid #505050;'},
                        {selector: '.toon_day_list .dl_list dt.on::after',
                            style: 'content: \'\'; display: block; height: 0px; width: 0px; position: absolute; bottom: 5px; right: 0px; border-top: 15px solid #f14b59; border-right: 48px solid #505050;'},
                        {selector: '.toon_day_list .dl_list_on',
                            style: 'position: relative;'},
                        {selector: '.toon_day_list .dl_list_on::after',
                            style: 'content: \'\'; display: block; width: 96px; height: 5px; position: absolute; top: 45px; left: 0px; background: #505050;'},

                    ]
                },
                {   route: '/toon/timesList',
                    html: [
                        {path: '#container/div.layout_left/div.toon_author_list/div/div.thumbEtc/div.main_tit',
                            assign: 'webtoonTitle'},
                        {path: '#container/div.layout_left/div.toon_author_list/div/div.thumbEtc/ul/li/span.author', style: 'background: none; line-height: 1em; font-size: 1em; width: auto; height: 24px; line-height: 24px; font-weight: bold;',
                            translate: 'Author: '},
                        {path: '#container/div.layout_left/div.toon_author_list/div/div.thumbEtc/ul/li/span.wr/',
                            assign: 'webtoonAuthor'},
                        {path: '#container/div.layout_left/div.toon_author_list/div/div.thumbEtc/ul/li/span.wr/a', style: 'background: white; border: 1px solid #555; border-radius: 3px; margin-left: 10px; line-height: 24px; text-align: center;',
                            translate: 'Works'},
                        {path: '#container/div.layout_left/div.toon_author_list/div/div.thumbEtc/div.cont',
                            assign: 'webtoonBlurb'},
                        {path: '#container/div.layout_left/div.toon_author_list/div/div.thumbEtc/div.btn/a@href?webtoonseq',
                            assign: 'webtoonId'},
                        {path: '#container/div.layout_left/div.toon_author_list/div/div.thumbEtc/div.btn/a', style: 'line-height: 27px; text-align: center; box-sizing: border-box; background: #f14b59; border: 1px solid darkred; border-radius: 2px; color: white; font-weight: bold;',
                            translate: 'FIRST'},
                        {path: '#container/div.layout_left/div.toon_author_list/div/div.thumbEtc/div.btn/a.bt_type_favor', style: 'line-height: 27px;  box-sizing: border-box; text-align: center; background: white; border: 1px solid grey; border-radius: 2px; font-weight: bold;',
                            translate: 'FAV'},
                        {path: '#container/div.layout_left/div.toon_work_list/div.list_tit/img', tagName: 'h3',
                            translate: 'Chapter list'},
                        {path: '#container/div.layout_left/div.toon_work_list/div.list_epi[]',
                            assign: 'chapterList', innerPath: {chapterId: 'a@href?timesseq', chapterTitle: 'a/span.thumbEtc/span/span'}}
                    ],
                    css: [
                        {selector: '.toon_author_list .list_cont .wr',
                            style: 'max-width: none;'}
                    ]
                },
                {   route: '/ranking',
                    html: [
                        {path: '#container/div.layout_left/div.ranking_best_list/div/div/img', tagName: 'h3',
                            translate: 'Monthly ranking'},
                        {path: '#container/div.layout_left/div.ranking_best_list/div.listArea[]',
                            assign: 'webtoonList', innerPath: {webtoonId: 'a@href?webtoonSeq', webtoonTitle: 'a/div.rank_cont/div.top/span.name', webtoonAuthor: 'a/div.rank_cont/div.etc/span.author', webtoonBlurb: 'a/div.rank_cont/div.cont_wr/div/span.cont_r'}},
                    ]
                },
                {   route: '/toon/timesDetail',
                    html: [
                        {path: '#wrap/div.toon_header/div/div/h1/+', tagName: 'h2', style: 'display: inline-block; width: 32px; height: 16px; float: left; margin-top: 14px;',
                            assign: 'menu'},
                        {path: '#wrap/div.toon_header/div/div/div.toon_tit/strong', style: 'display: inline-block; max-width: 200px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;',
                            assign: 'webtoonTitle'},
                        {path: '#wrap/div.toon_header/div/div/div.toon_tit/strong/+', tagName: 'span', style: 'display: inline-block; max-width: 200px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;',
                            assign: 'chapterTitle'},
                        {path: '#times_list/option[]',
                            assign: 'chapterList', innerPath: {chapterId: '-/+/option@value', chapterTitle: '-/+/option'}},
                        {path: '#wrap/div.toon_header/div/div.h_right/div.other_btn/a.prev',
                            translate: 'PREV'},
                        {path: '#wrap/div.toon_header/div/div.h_right/div.other_btn/a.next',
                            translate: 'NEXT'},
                        {path: '#wrap/div.toon_header/div/div.h_right/div.other_list/a',
                            translate: 'LIST'},
                        {path: '#wrap/div.toon_header/div/div.h_right/div.other_mark/a',
                            translate: 'FAV'},
                        {path: '../html/head/link/+/meta/+/meta/+/meta@content?webtoonseq',
                            assign: 'webtoonId'},
                        {path: '../html/head/link/+/meta/+/meta/+/meta@content?timesseq',
                            assign: 'chapterId'},
                        {path: '#wrap/div.toon_container/div.toon_view_quick/div/a[]',
                            translate: ['TOP', 'BOTTOM']},
                        {path: '#wrap/div.toon_container/div.toon_view_content/p[]/img',
                            assign: 'imageList', innerPath: {style: 'margin-left: auto; margin-right: auto;'}}
                    ]
                },
            ];
        // ----------------- TTALE $ttale
        } else if(window.location.hostname == 'ttale') {
            this.template = [];
        // ----------------- LENZHIN $lezhin
        } else if(window.location.hostname == 'lezhin') {
            this.template = [];
        }
    },
    
    // ----------------- OVERLAYLOADER.RUN $run
    run: function() {
        if (window.top !== window.self || frameElement) {
            return;
        }
        // ------------------ linearize []s and sort path definitions
        this.resource.search = [];
        this.loadTemplate();
        this.stylesheet = this.create('style', {}); //styling through document.styleSheets throws security errors in Firefox. Don't want to rely on GM_Style.
        for(var index = 0; index < this.template.length; index++) {
            if( new RegExp('^' + this.template[index].route.replace(/\\/g, '').replace(/\./g, '\\.').replace(/\//g, '\/')).test(window.location.pathname/* + window.location.hash*/) ) {
                overlayLoader.addLog('[overlayLoader.path] pathname: ' + this.template[index].route);
                if(this.template[index].html) {
                    for(var path = 0; path < this.template[index].html.length; path++) {
                        if(this.template[index].html[path].next && !this.template[index].html[path].next.join) {
                            this.template[index].html[path].next = [this.template[index].html[path].next];
                        }
                        var detectNext = this.template[index].html[path].path.lastIndexOf('[]');
                        if(detectNext != -1 && !this.template[index].html[path].next) {
                            this.template[index].html[path].next = [];
                        }
                        while(detectNext != -1) {
                            this.template[index].html[path].path = this.template[index].html[path].path.substr(0, detectNext) +  this.template[index].html[path].path.substr(detectNext+2); //delete []
                            var relativeElement = this.template[index].html[path].path.substr(this.template[index].html[path].path.lastIndexOf('/', detectNext-1) +1).replace(/#[a-zA-Z0-9_\-]+/, '');
                            var parentNumber = relativeElement.replace(/\/(\+|\-)([0-9]+)?(\/[^\/\+\-][^\/]*)?/g, '').match(/\//g);
                            this.template[index].html[path].next.push( (parentNumber ? '..' + (parentNumber.length > 1 ? parentNumber.length : '') + '/' : '') + '+/' + relativeElement);
                            detectNext = this.template[index].html[path].path.lastIndexOf('[]');
                        }
                        this.resource.search.push(this.template[index].html[path]);
                    }
                }
                if(this.template[index].css) {
                    for(var rule = 0; rule < this.template[index].css.length; rule++) {
                        this.stylesheet.appendChild(this.create(this.template[index].css[rule].selector + ' {' + this.template[index].css[rule].style + '}'));
                    }
                }
            }
        }
        document.body.appendChild(this.stylesheet);
        delete this.loadTemplate;
        this.resource.search.sort(function(a, b) {return ( ( a.path == b.path ) ? 0 : ( ( a.path > b.path ) ? 1 : -1 ) );});
        // ------------------------ run each path: observe, wait, runPath
        for(var index = 0; index < this.resource.search.length; index++) {
            if(this.resource.search[index].observe) {
                var targetElement = this.fetch(this.resource.search[index].observe);
                if(targetElement) {
                    if(this.observer.indexOf(targetElement) != -1) {
                        targetElement.observer.disconnect();
                        overlayLoader.addLog('Adding function to ' + this.resource.search[index].observe);
                        for (var property in this.resource.search[index].options) {
                            if (this.resource.search[index].options.hasOwnProperty(property) && !targetElement.observer.options[property]) {
                                targetElement.observer.options[property] = true;
                            }
                        }
                    } else {
                        this.observer.push(targetElement);
                        //var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
                        targetElement.observer = new MutationObserver(function(mutations) {
                            overlayLoader.mutationObserved(this, mutations);
                        });
                        targetElement.observer.options = this.resource.search[index].options || {childList: true};
                        targetElement.observer.target = targetElement;
                        overlayLoader.addLog('[overlayLoader.path] Attaching observer to ' + this.resource.search[index].observe);
                        targetElement.observer.actionPath = [];
                    }
                    targetElement.observer.actionPath.push({
                        path: this.resource.search[index].path,
                        next: this.resource.search[index].next || false,
                        translate: this.resource.search[index].translate || false,
                        innerPath: this.resource.search[index].innerPath || false,
                        callback: this.resource.search[index].translate ? 'translate' : (this.resource.search[index].assign == 'imageList' ? 'canvas' : 'listUpdate')
                    });
                    targetElement.observer.observe(targetElement, targetElement.observer.options);
                }
            }
            if(this.resource.search[index].wait) {
                if(this.resource.search[index].wait && document.readyState != "complete") {
                    this.resource.search[index].timer = window.setInterval(function() {
                        var index = arguments[0];
                        if(document.readyState == "complete") {
                            window.clearInterval(overlayLoader.resource.search[index].timer);
                            overlayLoader.resource.search[index].timer2 = window.setTimeout(function() {
                                var index = arguments[0];
                                window.clearTimeout(overlayLoader.resource.search[index].timer2);
                                overlayLoader.resource.search[index].node = overlayLoader.fetch(overlayLoader.resource.search[index].path);
                                if(overlayLoader.resource.search[index].translate) {
                                    overlayLoader.translate(overlayLoader.resource.search[index]);
                                } else {
                                    if(overlayLoader.resource.search[index].assign == 'imageList') {
                                        overlayLoader.canvas(overlayLoader.resource.search[index]);
                                    } else {
                                        overlayLoader.listUpdate(overlayLoader.resource.search[index]);
                                    }
                                }
                            }, 1000, index); 
                        }
                        }, 200, index);
                }
            }
            var node = this.fetch(this.resource.search[index].path);
            if(node) {
                this.resource.search[index].node = node;
                this.runPath(this.resource.search[index]);
            }
        }
        // --------- end of pathing.
        overlayLoader.addLog("[overlayLoader.run] End of pathing.");
        // -- MENU
        if(this.vars.menu) {
            this.vars.menu.node.textContent = '';
            this.vars.menu.node.appendChild(this.create('img', {
                src: british, alt: 'logo', style: 'width: 100%; height: 100%; display: block;',
                onclick: function(){
                    var logs = overlayLoader.create('div', {style: 'position: fixed; width: 80%; height: 80%; background: #DDD; top: 10%; left: 10%; z-index: 99999; text-align: left; border: 1px solid black; border-radius: 1em;'},
                        overlayLoader.create('div', {style: 'padding: 0.5em 1em;; position: relative; background: white; font-weight: bold; border-bottom: 1px solid black; margin-bottom: 1em; border-radius: 1em 1em 0 0;', textContent: 'Overtooning CONSOLE'},
                            overlayLoader.create('span', {style: 'cursor: pointer; position: absolute; display: inline-block; width: 10%; text-align: right; right: 1em;', textContent: 'close', onclick: function(){document.body.removeChild(this.parentNode.parentNode);}})
                        )
                    );
                    for(var i = 0; i < overlayLoader.log.length; i++) {
                        logs.appendChild(overlayLoader.create('p', {textContent: overlayLoader.log[i], style: 'padding: 0 1em;'}));
                    }
                    document.body.appendChild(logs);
                }
            }));
        }
        //-- localStorage and CORS request launch.
        //-- overloaderData {feedList, webtoonList}
        this.data = localStorage.getItem('overloaderData');
        this.data = this.data ? JSON.parse(this.data) : this.defaultData;
        //this.webtoonList
        var accessFeed = [];
        if(this.vars.webtoonId) { //chapter page, or chapterList
            for(var i = 0; i < this.data.webtoonList.length; i++) {
                if(this.data.webtoonList[i].wI == this.value(this.vars.webtoonId)) {
                    accessFeed = this.data.webtoonList[i].fL;
                    if(this.vars.webtoonBlurb && this.vars.webtoonBlurb.node) {
                        this.vars.webtoonBlurb.node.textContent = ' ';
                    }
                    this.value(this.vars.webtoonTitle, this.data.webtoonList[i].wT);
                    this.value(this.vars.webtoonAuthor, this.data.webtoonList[i].wA);
                    this.value(this.vars.webtoonBlurb, this.data.webtoonList[i].wB);
                    for(var j = 0; j < accessFeed.length; j++) {
                        this.queries.push({feedID: accessFeed[j]});
                    }
                    break;
                }
            }
        }
        var MTime = this.MTime();
        for(var j = 0; j < this.data.feedList.length; j++) {
            if(accessFeed.indexOf(j) == -1 && this.data.feedList[j].lastUpdate + 60 * 24 * 7 < MTime) {
                overlayLoader.addLog('[overlayLoader.query] Ping feed: ' + this.data.feedList[j].url + ' (' + j + ')');
                this.queries.push({feedID: j, udpdate: true});
            }
        }
        overlayLoader.addLog('[overlayLoader.path] Queries to be made: ' + this.queries.length);
        /*if(this.vars.imageList && this.vars.imageList.node) {
            if(this.vars.startingImage) {//pageFlip
                this.vars.shuffleImage = [0, 2, -1, -1, -6, -6];
            }
            this.vars.imageList.innerPath.imageId = (this.vars.imageList.innerPath.imageId ? this.vars.imageList.innerPath.imageId : 0);
            this.canvas();
        }*/

        if(this.vars.webtoonList) {
            if(!(this.vars.webtoonList instanceof Array)) {
                this.vars.webtoonList.assign = undefined;
                this.listUpdate(this.vars.webtoonList);
            } else {
                for(var cursor = 0; cursor < this.vars.webtoonList.length; cursor++) {
                    this.vars.webtoonList[cursor].assign = undefined;
                    this.listUpdate(this.vars.webtoonList[cursor]);
                }
            }
        }
        overlayLoader.addLog("[overlayLoader.run] End.");
        this.shiftQueries(false, true);
        return true;
    },
    
    addLog: function(stringLog) {
        console.log(stringLog);
        this.log.push(stringLog);
    },
    
    runPath: function(pathObject) {
        if(!pathObject || !pathObject.node) {
                return false;
        }
        if(pathObject.translate && pathObject.translate.join) {
            this.translate(pathObject);
            return false;
        }
        if(pathObject.tagName && pathObject.node.nodeName != pathObject.tagName) {
            var copyNode = this.create(pathObject.tagName, {innerHTML: pathObject.node.innerHTML ? pathObject.node.innerHTML : ' '});
            if(pathObject.node.className) {
                copyNode.className = pathObject.node.className;
            }
            if(pathObject.node.id) {
                copyNode.id = pathObject.node.id;
            }
            pathObject.node.parentNode.insertBefore(copyNode, pathObject.node);
            pathObject.node = pathObject.node.previousSibling;
            pathObject.node.parentNode.removeChild(pathObject.node.nextSibling);
        }
        if(pathObject.className && pathObject.node.className != pathObject.className) {
            pathObject.node.className = pathObject.className;
        }
        if(pathObject.style) {
            var refNode = (pathObject.node.nodeName == '#text' ? pathObject.node.parentNode : pathObject.node);
            refNode.setAttribute('style', refNode.getAttribute('style') ?  refNode.getAttribute('style') + pathObject.style : pathObject.style);
        }
        if(pathObject.translate !== undefined && pathObject.translate != '') {
                this.value(pathObject.node, pathObject.translate);
        }
        if(pathObject.assign) {
            if(this.vars[pathObject.assign]) {
                if(this.vars[pathObject.assign].node){
                    this.vars[pathObject.assign] = [this.vars[pathObject.assign]];
                }
                this.vars[pathObject.assign].push(pathObject);
            } else {
                this.vars[pathObject.assign] = pathObject;
            }
        }
    },
    
    translate: function(pathObject) {
        if(!pathObject || !pathObject.node || !pathObject.translate) {
            return false;
        }
        if(!pathObject.translate.join) {
            pathObject.translate = [pathObject.translate];
        }
        var cloneTranslate = pathObject.translate.slice(0);
        var clonePathObject = {
            node: pathObject.node,
            translate: false,
            tagName: pathObject.tagName || undefined,
            className: pathObject.className || undefined,
            style: pathObject.style || undefined
        };
        while(clonePathObject.node && cloneTranslate.length > 0) {
            clonePathObject.translate = cloneTranslate.shift();
            this.runPath(clonePathObject);
            clonePathObject.node = (cloneTranslate.length > 0 ? this.getNextNode(clonePathObject.node, pathObject.next) : false);
        }
    },

    mutationObserved: function(observer, mutations) {
        if(document.readyState != "complete") {
            //overlayLoader.addLog(document.readyState);
            this.timer = window.setTimeout(function() {overlayLoader.mutationObserved(observer);}, 500);
            return;
        }
        //overlayLoader.addLog('Mutation observed ' + observer.target.nodeName + '.' + observer.target.className + (observer.target.id ? '#' + observer.target.id : ''));
        if(mutations) {
            mutations.forEach(function(mutation) {
                overlayLoader.addLog('Mutation: ' + mutation.type);
            });
        }
        if(observer.timer) {
            window.clearTimeout(observer.timer);
        }
        observer.timer = window.setTimeout(function() {
            observer.takeRecords(); //dump records.
            observer.disconnect();
            for(var cursor = 0; cursor < observer.actionPath.length; cursor++) {
                observer.actionPath[cursor].node = overlayLoader.fetch(observer.actionPath[cursor].path);
                if(observer.actionPath[cursor].node) {
                    overlayLoader.addLog(observer.actionPath[cursor].callback + ' ' + observer.actionPath[cursor].path);
                    if(observer.actionPath[cursor].innerPath && observer.actionPath[cursor].innerPath.imageId) {
                        observer.actionPath[cursor].innerPath.imageId = 0;
                    }
                    overlayLoader[observer.actionPath[cursor].callback](observer.actionPath[cursor]);
                }
            }
            window.setTimeout(function() { //maybe put this in callback functions (? canvas being slow?).
                observer.observe(observer.target, observer.options);},
                50, observer);
        }, 200, observer);
    },
    
    // ----------------- OVERLAYLOADER.LISTUPDATE $listUpdate
    listUpdate: function(pathObject) {
        if(!pathObject || !pathObject.node || !pathObject.innerPath) {
            overlayLoader.addLog('node not found ' + (pathObject.path || 'nopath') + ' ' + pathObject.node + ' ' + pathObject.innerPath);
            return false;
        }
        if(pathObject.innerPath.chapterId && !overlayLoader.resource.chapterList) {
            return false;
        }
        var untranslatedWebtoon = [];
        while(pathObject.node) {
            if(pathObject.weekdayList && pathObject.node.newList) {
                untranslatedWebtoon = [];
            }
            var innerPath = {};
            for (var property in pathObject.innerPath) {
                if (pathObject.innerPath.hasOwnProperty(property)) {
                    var tryPath = pathObject.innerPath[property].split('|');
                    while(tryPath.length > 0 && !innerPath[property]) {
                        innerPath[property] = overlayLoader.fetch(tryPath.shift(), pathObject.node);
                    }
                }
            }
            if(innerPath.webtoonId) {
                var webtoonInfo = false;
                var webtoonId = overlayLoader.value(innerPath.webtoonId)
                for(var cursor = 0; cursor < overlayLoader.data.webtoonList.length; cursor++) {
                    if(overlayLoader.data.webtoonList[cursor].wI == webtoonId) {
                        webtoonInfo = overlayLoader.data.webtoonList[cursor];
                        break;
                    }
                }
                if(webtoonInfo) {
                    overlayLoader.value(innerPath.webtoonTitle, webtoonInfo.wT);
                    overlayLoader.value(innerPath.webtoonAuthor, webtoonInfo.wA);
                    overlayLoader.value(innerPath.webtoonBlurb, webtoonInfo.wB);
                    overlayLoader.runPath(pathObject);
                    if(untranslatedWebtoon.length) {
                        var saveNodePlace = pathObject.node.nextSibling;
                        var switchNode = untranslatedWebtoon.shift();
                        pathObject.node.parentNode.replaceChild(pathObject.node, switchNode);
                        pathObject.node.parentNode.insertBefore(switchNode, saveNodePlace);
                        pathObject.node = switchNode;
                        untranslatedWebtoon.push(pathObject.node);
                    }
                } else {
                    untranslatedWebtoon.push(pathObject.node);
                }
            } else {
                var chapterInfo = false;
                var chapterId = overlayLoader.value(innerPath.chapterId)
                for(var cursor = 0; cursor < overlayLoader.resource.chapterList.length; cursor++) {
                    if(overlayLoader.resource.chapterList[cursor].id == chapterId) {
                        chapterInfo = overlayLoader.resource.chapterList[cursor];
                        break;
                    }
                }
                if(chapterInfo) {
                    overlayLoader.value(innerPath.chapterTitle, chapterInfo.title);
                    overlayLoader.runPath(pathObject);
                }
            }
            pathObject.node = overlayLoader.getNextNode(pathObject.node, pathObject.next);
        }
        untranslatedWebtoon = [];
    },
    
    value: function(element, setValue) {
        if(!element) {
            return false;
        }
        if(element instanceof Array) {
            for(var i = 0; i < element.length; i++) {
                this.value(element[i], setValue);
            }
        }
        if(element instanceof Attr) {
            if(setValue) {
                element.value = setValue;
            }
            return element.value;
        }
        if(element.node) {
            element = element.node;
        }
        if(!element.nodeValue && element.firstChild) {
            element = element.firstChild;
        }
        if(!element.nodeValue) {
            return false;
        }
        if(setValue) {
            setValue = setValue.split('{endl}');
            element.nodeValue = setValue[0];
            for(var count = setValue.length -1; count > 0; count--) {
                element.parentNode.insertBefore(this.create(setValue[count]), element.nextSibling);
                element.parentNode.insertBefore(this.create('br', {}), element.nextSibling);
            }
        }
        return element.nodeValue;
    },
    
    // ----------------- OVERLAYLOADER.CANVAS $canvas
    canvas: function(pathObject) {
        if(!overlayLoader.resource.generalUrl) {
            return false;
        }
        if(!pathObject) {
            pathObject = overlayLoader.vars.imageList;
        }
        if(!pathObject.node) {
            return false;
        }
        overlayLoader.vars.imageList.node = pathObject.node;
        if(pathObject.node.getAttribute('data-lazy-src') && (pathObject.node.getAttribute('data-lazy-src') != pathObject.node.src ||  pathObject.node.getAttribute('data-lazy-loaded') != 'true' || pathObject.node.getAttribute('data-lazy-resized') != 'true')) { //lazy loading (m.naver), postpone.
            overlayLoader.resource.timer = window.setTimeout(function() {overlayLoader.canvas();}, 1000);
            return false;
        }
        if(overlayLoader.resource.timer) {
            window.clearTimeout(overlayLoader.resource.timer);
        }
        overlayLoader.resource.rawImage = new Image();
        overlayLoader.resource.rawImage.onload = function() {
            if(overlayLoader.vars.imageList.node.nextSibling && overlayLoader.vars.imageList.node.nextSibling.className == 'toonreader_overlay') { //probably pageflip (refresh process).
                overlayLoader.vars.imageList.node.parentNode.removeChild(overlayLoader.vars.imageList.node.nextSibling);
            }
            var tmpImageId = overlayLoader.vars.imageId;
            if(overlayLoader.vars.shuffleImage && overlayLoader.vars.shuffleImage[tmpImageId]) {
                tmpImageId = tmpImageId + parseInt(overlayLoader.vars.shuffleImage[tmpImageId], 10);
            }
            if(overlayLoader.vars.startingImage) {
                tmpImageId += parseInt(overlayLoader.value(overlayLoader.vars.startingImage), 10);
            }
            overlayLoader.resource.imageId = tmpImageId +1;
            
            overlayLoader.resource.naturalCanvas = overlayLoader.create('canvas', {width: this.width, height: this.height, style: 'position: absolute; top: 0; left: 0;'});
            overlayLoader.resource.naturalCanvas.getContext('2d').drawImage(this, 0, 0, this.width, this.height); //set the background (copy the raw).
            overlayLoader.cors(
                overlayLoader.resource.generalUrl.replace('{imgNumber}', overlayLoader.digit(overlayLoader.resource.imageId)),
                'GET', 'arraybuffer', null,
                function(data) {
                    var byteArray = new Uint8Array(data);
                    var binaryString = '';
                    for (var i = 0; i < byteArray.byteLength; i++) {
                        binaryString += String.fromCharCode(byteArray[i]); //extracting the bytes
                    }
                    if(overlayLoader.resource.salt) {
                        binaryString = overlayLoader.shuffle(binaryString);
                    }
                    var base64 = window.btoa(binaryString); //creating base64 string
                    var img = new Image();
                    img.onload = function() {
                        overlayLoader.resource.naturalCanvas.getContext('2d').drawImage(this, 0, 0, this.width, this.height); //copy the overlay onto natural canvas.
                        if(overlayLoader.resource.salt && overlayLoader.resource.naturalCanvas.width > 3 && overlayLoader.resource.naturalCanvas.height > 3 && overlayLoader.vars.imageList.node.width > 3 && overlayLoader.vars.imageList.node.height > 3) {
                            var varWidth = Math.random()*0.05 +0.01, varHeight = Math.random()*0.05 +0.01, riftWidth = Math.random()*0.6 +0.2, riftHeight = Math.random()*0.6 +0.2;
                            overlayLoader.resource.adaptedCanvas = [];
                            var adaptedDimension = [
                                Math.round((overlayLoader.vars.imageList.node.width-2) * (riftWidth + varWidth) +1),
                                Math.round((overlayLoader.vars.imageList.node.width-2) * (1 - riftWidth + varWidth) +1),
                                Math.round((overlayLoader.vars.imageList.node.height-2) * (riftHeight + varHeight) +1),
                                Math.round((overlayLoader.vars.imageList.node.height-2) * (1 - riftHeight + varHeight) +1)
                            ];
                            var naturalDimension = [
                                Math.round(adaptedDimension[0] / overlayLoader.vars.imageList.node.width * overlayLoader.resource.naturalCanvas.width),
                                Math.round(adaptedDimension[1] / overlayLoader.vars.imageList.node.width * overlayLoader.resource.naturalCanvas.width),
                                Math.round(adaptedDimension[2] / overlayLoader.vars.imageList.node.height * overlayLoader.resource.naturalCanvas.height),
                                Math.round(adaptedDimension[3] / overlayLoader.vars.imageList.node.height * overlayLoader.resource.naturalCanvas.height)
                            ];
                            overlayLoader.resource.adaptedCanvas[0] = overlayLoader.create('canvas', {width: adaptedDimension[0], height: adaptedDimension[2], style: 'position: absolute; top: 0; left: 0;'});
                            overlayLoader.resource.adaptedCanvas[0].getContext('2d').drawImage(overlayLoader.resource.naturalCanvas, 0, 0, naturalDimension[0], naturalDimension[2], 0, 0, adaptedDimension[0], adaptedDimension[2]);
                            overlayLoader.resource.adaptedCanvas[1] = overlayLoader.create('canvas', {width: adaptedDimension[1], height: adaptedDimension[2], style: 'position: absolute; top: 0; right:0;'});
                            overlayLoader.resource.adaptedCanvas[1].getContext('2d').drawImage(overlayLoader.resource.naturalCanvas, overlayLoader.resource.naturalCanvas.width - naturalDimension[1], 0, naturalDimension[1], naturalDimension[2], 0, 0, adaptedDimension[1], adaptedDimension[2]);
                            overlayLoader.resource.adaptedCanvas[2] = overlayLoader.create('canvas', {width: adaptedDimension[0], height: adaptedDimension[3], style: 'position: absolute; bottom: 0; left: 0;'});
                            overlayLoader.resource.adaptedCanvas[2].getContext('2d').drawImage(overlayLoader.resource.naturalCanvas, 0, overlayLoader.resource.naturalCanvas.height - naturalDimension[3], naturalDimension[0], naturalDimension[3], 0, 0, adaptedDimension[0], adaptedDimension[3]);
                            overlayLoader.resource.adaptedCanvas[3] = overlayLoader.create('canvas', {width: adaptedDimension[1], height: adaptedDimension[3], style: 'position: absolute; bottom: 0; right: 0;'});
                            overlayLoader.resource.adaptedCanvas[3].getContext('2d').drawImage(overlayLoader.resource.naturalCanvas, overlayLoader.resource.naturalCanvas.width - naturalDimension[1], overlayLoader.resource.naturalCanvas.height - naturalDimension[3], naturalDimension[1], naturalDimension[3], 0, 0, adaptedDimension[1], adaptedDimension[3]);
                        } else {
                            var emptyNodeText = overlayLoader.create(' ');
                            if(overlayLoader.vars.imageList.node.width != overlayLoader.resource.naturalCanvas.width || overlayLoader.vars.imageList.node.width != overlayLoader.resource.naturalCanvas.height) {
                                var adaptedCanvas = overlayLoader.create('canvas', {width: overlayLoader.vars.imageList.node.width, height: overlayLoader.vars.imageList.node.height, style: 'position: absolute; top: 0; left: 0;'});
                                adaptedCanvas.getContext('2d').drawImage(overlayLoader.resource.naturalCanvas, 0, 0, adaptedCanvas.width, adaptedCanvas.height);
                                overlayLoader.resource.adaptedCanvas = [adaptedCanvas, emptyNodeText, emptyNodeText, emptyNodeText];
                            } else {
                                    overlayLoader.resource.adaptedCanvas = [overlayLoader.resource.naturalCanvas, emptyNodeText, emptyNodeText, emptyNodeText];
                            }
                        }
                        var tempStyle = overlayLoader.vars.imageList.innerPath.keepOriginal ? ' margin-top: -' + overlayLoader.vars.imageList.node.height + 'px;' : '';
                        overlayLoader.vars.imageList.node.parentNode.insertBefore( 
                            overlayLoader.create('div', {className: 'toonreader_overlay', style: 'position: relative; height: ' + overlayLoader.vars.imageList.node.height + 'px;'+ tempStyle + ' width: ' + overlayLoader.vars.imageList.node.width + 'px;' + (overlayLoader.vars.imageList.innerPath.style ? overlayLoader.vars.imageList.innerPath.style : '')},
                                overlayLoader.resource.adaptedCanvas[0],
                                overlayLoader.resource.adaptedCanvas[1],
                                overlayLoader.resource.adaptedCanvas[2],
                                overlayLoader.resource.adaptedCanvas[3],
                                overlayLoader.create('div', {style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;'}) //right-click added protection.
                            ),
                            overlayLoader.vars.imageList.node.nextSibling
                        );
                        if(!overlayLoader.vars.imageList.innerPath.keepOriginal) {
                            overlayLoader.vars.imageList.node = overlayLoader.vars.imageList.node.nextSibling;
                            overlayLoader.vars.imageList.node.parentNode.removeChild(overlayLoader.vars.imageList.node.previousSibling);
                        }
                        overlayLoader.getNextImage();
                    };
                    img.onerror = function() {
                        overlayLoader.addLog('[overlayLoader.canvas] overlay '+overlayLoader.vars.imageId+' could not load, check the salt.');
                        overlayLoader.getNextImage();
                    };
                    img.src = "data:image/png;base64," + base64; //creating a base64 uri
                },
                function(error) {
                    overlayLoader.addLog('[overlayLoader.canvas] ('+overlayLoader.vars.imageId+') CORS failed.');
                    overlayLoader.getNextImage();
                }
            );
        };
        overlayLoader.resource.rawImage.onerror = function() {
            overlayLoader.addLog('[overlayLoader.canvas] Raw image '+overlayLoader.vars.imageId+' has problems loading.');
            overlayLoader.getNextImage();
        };
        overlayLoader.resource.rawImage.src = pathObject.node.src;
    },
    
    getNextImage: function() {
        overlayLoader.vars.imageId++;
        overlayLoader.vars.imageList.node = overlayLoader.getNextNode(overlayLoader.vars.imageList.node.nextSibling, overlayLoader.vars.imageList.next);
        if(overlayLoader.vars.imageList.node) {
                overlayLoader.canvas();
        }
    },
    
    getNextNode: function(node, nextArray) {
        if(node && nextArray && nextArray[0]) {
            var saveNode = node;
            var currentNode = this.fetch(nextArray[0], saveNode);
            for(var cursor = 1; !currentNode && cursor < nextArray.length; cursor++) {
                currentNode = this.fetch(nextArray[cursor], saveNode);
            }
            if(currentNode) {
                if(cursor > 1 && cursor == nextArray.length) {
                    currentNode.newList = true;
                }
                return currentNode;
            }
        }
        return false;
    },
    
    // $query
    shiftQueries: function(data, firstcall) {
        if(!firstcall) {
            var feedId = overlayLoader.queries.shift().feedID;
            if(!feedId) {
                feedId = 0;
            }
            overlayLoader.data.feedList[feedId].lastUpdate = overlayLoader.MTime();
            data = JSON.parse(data);
            if(!data) {
                overlayLoader.addLog('[overlayLoader.json] parsing failed.');
                data = {};
            }
            if(data.data) {
                data = JSON.parse(overlayLoader.base64decode(data.data));
            }
            if(data.teamName && typeof data.teamName == 'string' && /^[0-9a-zA-Z.,;&@"'(){}!?*~_\[\] +=\-]+$/.test(data.teamName)) {
                overlayLoader.data.feedList[feedId].name = data.teamName.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            }
            if(data.teamURL && typeof data.teamURL == 'string' && /^https?:\/\/[a-z0-9\-]+(\.[a-z0-9\-]+)+([\/?].+)?$/i.test(data.teamURL)) {
                overlayLoader.data.feedList[feedId].teamUrl = data.teamURL;
            }
            //--- MAYBE UPDATE - test against group precedence. $incomplete
            if(data.title && !overlayLoader.scanlated && overlayLoader.vars.webtoonTitle) {
                overlayLoader.value(overlayLoader.vars.webtoonTitle, data.title);
            }
            if(data.author && !overlayLoader.scanlated && overlayLoader.vars.webtoonAuthor) {
                overlayLoader.value(overlayLoader.vars.webtoonAuthor, data.author);
            }
            if(data.description && !overlayLoader.scanlated && overlayLoader.vars.webtoonBlurb) {
                overlayLoader.value(overlayLoader.vars.webtoonBlurb, data.description);
            }
            if(data.chapterList && data.chapterList instanceof Array) {
                overlayLoader.resource.chapterList = data.chapterList;
                if(overlayLoader.vars.chapterList) {
                    if(!(overlayLoader.vars.chapterList instanceof Array)) {
                        overlayLoader.listUpdate(overlayLoader.vars.chapterList);
                    } else {
                        for(cursor = 0; cursor < overlayLoader.vars.chapterList.length; cursor++) {
                            overlayLoader.listUpdate(overlayLoader.vars.chapterList[cursor]);
                        }
                    }
                }
            }
            if(data.generalUrl && !overlayLoader.scanlated) {
                overlayLoader.scanlated = true;
                if(overlayLoader.vars.chapterTitle && data.chapterName && typeof data.chapterName == 'string') {
                    overlayLoader.value(overlayLoader.vars.chapterTitle, data.chapterName);
                }
                if(data.salt) {
                    overlayLoader.resource.salt = parseInt(data.salt, 10);
                }
                //--- pagination $incomplete
                /*if(data.pagination && overlayLoader.value(overlayLoader.vars.startingImage) > 1 && data.pagination.length && data.pagination.length >= overlayLoader.startingImage -1) {
                    overlayLoader.resource.startingImage = data.pagination[overlayLoader.startingImage -2];
                } else {
                    overlayLoader.startingImage = 0;
                }*/
                overlayLoader.resource.generalUrl = data.generalUrl;
                overlayLoader.canvas();
            }
            if(overlayLoader.scanlated) {
                 while(overlayLoader.queries.length && overlayLoader.queries[0].update == false) {
                    overlayLoader.queries.shift();
                }
            }
            if(data.remove) {
                if(typeof data.remove != 'object') {
                    data.remove = [data.remove];
                }
                for(var toRemove = data.remove.length-1; toRemove >= 0; toRemove--) {
                    for(var i = 0; i < overlayLoader.data.webtoonList.length; i++) {
                        if(overlayLoader.data.webtoonList[i].wI == data.remove[toRemove]) {
                            var removeFeed = overlayLoader.data.webtoonList[i].fL.indexOf(feedId);
                            if(removeFeed != -1) {
                                overlayLoader.data.webtoonList[i].fL.slice(removeFeed,1);
                            }
                            if(overlayLoader.data.webtoonList[i].fL.length == 0) {
                                overlayLoader.data.webtoonList.slice(i,1);
                            }
                            break;
                        }
                    }
                }
            }
            if(data.add) {
                if(!data.add[0] || !data.add[0].id) {
                    data.add = [data.add];
                }
                for(var i = data.add.length -1; i >= 0; i--) {
                    if( data.add[i].id && typeof data.add[i].id == 'string' && /^[0-9a-zA-Z_\-]+$/.test(data.add[i].id) &&
                        data.add[i].title && typeof data.add[i].title == 'string' && /^[0-9a-zA-Z.,;&@"'(){}!?*~_\[\] +=\-]+$/.test(data.add[i].title) &&
                        data.add[i].author && typeof data.add[i].author == 'string' && /^[0-9a-zA-Z.,;&@"'(){}!?*~_\[\] +=\-]+$/.test(data.add[i].author) &&
                        data.add[i].blurb && typeof data.add[i].blurb == 'string' && /^[0-9a-zA-Z.,;:&@"'(){}!?*~_\[\] +=\-]+$/.test(data.add[i].blurb)) {
                        var alreadyInserted = false;
                        for(var j = 0; j < overlayLoader.data.webtoonList.length; j++) {
                            if(overlayLoader.data.webtoonList[j].wI == data.add[i].id) {
                                alreadyInserted = j;
                                //ask if changes are to be committed!!!!!!!!!
                                if(overlayLoader.data.webtoonList[j].fL.indexOf(feedId) == -1) {
                                    overlayLoader.data.webtoonList[j].fL.push(feedId);
                                }
                                break;
                            }
                        }
                        if(alreadyInserted === false) {
                            overlayLoader.data.webtoonList.push({
                                wI: data.add[i].id, //Id
                                wT: data.add[i].title.replace(/^\s+/, '').replace(/\s+$/, ''), //Title
                                wA: data.add[i].author.replace(/^\s+/, '').replace(/\s+$/, ''), //Author
                                wB: data.add[i].blurb.replace(/^\s+/, '').replace(/\s+$/, ''),  //Blurb
                                fL: [feedId]
                            });
                        }
                    }
                }
                if(overlayLoader.vars.webtoonList) {
                    overlayLoader.addLog('webtoonList after CORS');
                    if(!(overlayLoader.vars.webtoonList instanceof Array)) {
                        overlayLoader.vars.webtoonList.node = overlayLoader.fetch(overlayLoader.vars.webtoonList.path);
                        overlayLoader.listUpdate(overlayLoader.vars.webtoonList);
                    } else {
                        for(var cursor = 0; cursor < overlayLoader.vars.webtoonList.length; cursor++) {
                            overlayLoader.vars.webtoonList[cursor].node = overlayLoader.fetch(overlayLoader.vars.webtoonList[cursor].path);
                            overlayLoader.listUpdate(overlayLoader.vars.webtoonList[cursor]);
                        }
                    }
                }
            }
        localStorage.setItem('overloaderData', JSON.stringify(overlayLoader.data));
        }
        if(overlayLoader.queries.length) {
            var j = overlayLoader.queries[0].feedID;
            var queryUrl = this.data.feedList[j].url + '/' + window.location.hostname + '/' + (this.value(this.vars.webtoonId) || '0') + '/' + (this.value(this.vars.chapterId) || '0') + '.json?' + (this.data.feedList[j].lastUpdate ? this.MTime() - this.data.feedList[j].lastUpdate+1 : 0).toString();
            overlayLoader.cors(
                queryUrl, 'GET', '', '',
                function(data) {overlayLoader.shiftQueries(data);},
                function(error) {overlayLoader.addLog('[overlayLoader.cors] '+error.message); overlayLoader.queries.shift(); overlayLoader.shiftQueries(false, true);}
            );
        }
    },
    
    digit: function (number) {
        return (number < 10 ? '0' + number : number);
    },
    
    // ----------------- OVERLAYLOADER.FETCH $fetch
    fetch: function (path, node) {
        if(!path) {
            overlayLoader.addLog('[overlayLoader.fetch] no path');
            return false;
        } else if (typeof path == 'string') { //first iteration of that path.
            if(!node) {
                node = document.body;
            }
            path = {tag: path.substr(Math.max(0, path.indexOf('#'))).split('/'), current: 0};
            if(this.savePath.node[0] && this.savePath.node[0] === node) { //same source node
                while(this.savePath.name[path.current+1] && path.tag[path.current] && this.savePath.name[path.current+1] == path.tag[path.current]) {
                    path.current++;
                    node = this.savePath.node[path.current];
                }
                if(path.current == path.tag.length) { //same node searched in the end.
                    return node;
                }
                this.savePath.node = this.savePath.node.slice(0, path.current+2);
                this.savePath.name = this.savePath.name.slice(0, path.current+2);
            } else {
                this.savePath = {node: [node], name: ['sourceNode']};
            }
        }
        if(path.tag[path.current] == '') {
            return node && node.firstChild ? node.firstChild : false;
        } else if(/^(\+|-|\.\.)[0-9]*$/.test(path.tag[path.current])) {
            var property = path.tag[path.current][0] == '.' ? 'parentNode' : (path.tag[path.current][0] == '+' ? 'nextSibling' : 'previousSibling');
            for(var amount = Math.max(1, parseInt(path.tag[path.current].replace(/(\+|-|\.\.)/, '0'), 10)); amount && node[property]; amount--) {
                node = node[property];
            }
            if(amount != 0) {
                overlayLoader.addLog('[overlayLoader.fetch] node not found ' + property + ' for ' + path.tag.join('/') + ' (' + path.current + ' : ' + path.tag[path.current] + ')');
                return false;
            }
        } else {
            if(path.current == 0 || !/^(\+|-|\.\.)[0-9]*$/.test(path.tag[path.current - 1])) {
                node = path.tag[path.current].match(/^~/) ? node.lastChild : node.firstChild;
            }
            var compare = {
                id: path.tag[path.current].match(/#[a-zA-Z0-9_\-]+/),
                nodeName: path.tag[path.current].match(/^~?([a-zA-Z0-9]+)/),
                movingProperty: path.tag[path.current].match(/^~/) ? 'previousSibling' : 'nextSibling',
                className: path.tag[path.current].match(/\.[a-zA-Z0-9 _\-]+/),
                attribute: path.tag[path.current].match(/@([a-z]+)(\?[a-zA-Z0-9_\-]+)?/)
            };
            if(compare.id) {
                node = document.getElementById(compare.id[0].substr(1));
            } else if(compare.nodeName) {
                compare.nodeName = compare.nodeName[1].toLowerCase();
                if(compare.className) {
                    compare.className = compare.className[0].substr(1);
                    while(node && (node.nodeName.toLowerCase() != compare.nodeName || !this.compareClassName(compare.className, node.className))) {
                        node = node[compare.movingProperty];
                    }
                } else {
                    while(node && node.nodeName.toLowerCase() != compare.nodeName) {
                        node = node[compare.movingProperty];
                    }
                }
            } else if(compare.attribute) {
                //-- missing
                overlayLoader.addLog('[overlayLoader.fetch] Attribute alone. Should be patched');;
            }else {
                overlayLoader.addLog('[overlayLoader.fetch] insufficient identifier for ' + path.tag.join('/') + ' (' + path.current + ': ' + path.tag[path.current] + ')');
                return false;
            }
            if(node && compare.attribute) {
                node = node.attributes[compare.attribute[1]];
                if(node && compare.attribute[2]) { //treatment required.
                    node = node.value;
                    compare.attribute[2] = compare.attribute[2].substr(1);
                    if(compare.attribute[2].match(/^path?[0-9-]+$/)) { //"path" is a keyword, unfortunately (attribute named "path" won't work). $incomplete
                        node = node.split('/');
                        node = node[parseInt(compare.attribute[2].substr(4), 10) >= 0 ? parseInt(compare.attribute[2].substr(4), 10) : node.length +  parseInt(compare.attribute[2].substr(4), 10)];
                    } else if(compare.attribute[2].match(/^-?[0-9]+$/)) { //parse numbers and take one.
                        var numbers = node.match(/-?[0-9]+/g);
                        node = numbers[parseInt(compare.attribute[2], 10) >= 0 ? parseInt(compare.attribute[2], 10) : numbers.length +  parseInt(compare.attribute[2], 10)];
                    } else {
                        node = node.match(new RegExp(compare.attribute[2] + "=([^&]+)", ''))[1];
                    }
                    return node ? this.create(node) : false;
                }
                return node;
            }
        }
        if(!node) {
            if(!path.tag[0].match(/^(\.|\+|\-)/) && this.savePath.node[0] == document.body) {
                overlayLoader.addLog('[overlayLoader.fetch] node not found ' + path.tag.join('/') + ' (' + path.current + ': ' + path.tag[path.current] + ')');
            }
            return false;
        }
        path.current++;
        this.savePath.node[path.current] = node;
        this.savePath.name[path.current] = path.tag[path.current-1];
        return (path.current < path.tag.length) ? this.fetch(path, node) : node;
    },
                    
    create: function () {
        switch(arguments.length) {
            case 1:
                var A = document.createTextNode(arguments[0]);
            break;
            default:
                var A = document.createElement(arguments[0]),
                    B = arguments[1];
                for (var b in B) {
                    if (b.indexOf("on") == 0) {
                        A.addEventListener ? A.addEventListener(b.substring(2), B[b], false) : A.attachEvent(b,B[b]);
                    } else if (",style,accesskey,id,name,src,href,which,doonge,classid,".indexOf("," + b.toLowerCase()) != -1) {
                        A.setAttribute(b, B[b]);
                    } else {
                        A[b] = B[b];
                    }
                }
                for(var i = 2, len = arguments.length; i < len; ++i) {
                    A.appendChild(arguments[i]);
                }
            }
        return A;
    },
    
    compareClassName: function(className, splitNames) {
        if(splitNames.trim() == className.trim()) {
            return true;
        }
        splitNames = splitNames.split(' ');
        for(var index = 0; index < splitNames.length; index++) {
            if(splitNames[index] == className) {
                return true;
            }
        }
        return false;
    },

    cors: function (url, method, type, data, callback, errback) {
        var req;
        if(XMLHttpRequest) {
            req = new XMLHttpRequest();
            overlayLoader.addLog('[overlayLoader.cors] ' + url);
            if(req.withCredentials !== undefined) {
                req.open(method, url, true);
                req.responseType = type;
                req.onerror = errback;
                req.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            callback(this.responseType == '' ? this.responseText : this.response);
                        } else {
                        overlayLoader.addLog('[overlayLoader.cors] Response returned with non-OK status');
                        }
                    }
                };
                req.send(/*data*/);
            }
        } else {
            overlayLoader.addLog('[overlayLoader.cors] XmlHTTPRequest 2 not fully supported');
        }
    },
    
    stringToInt: function(s) {
        if(!s.length) {
            return s;
        }
        if(/^[0-9]+$/.test(s)) {
            return parseInt(s, 10);
        }
        var keyStr = '0123456789abcdefghijklmnopqrstuvwxyz-_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var n = 0;
        for(var i = 0; i < s.length; i++) {
            var c = keyStr.indexOf(s.charAt(i));
            n = n * 64 + c;
        }
        return n;
    },
    
    shuffle: function(data) {
        var imageId = this.resource.imageId + this.resource.salt,
            chapterId = parseInt(this.value(this.vars.chapterId), 10),
            webtoonId = this.stringToInt(this.value(this.vars.webtoonId)),
            shuffle = '',
            returnData = '';
        shuffle += this.keyList[((webtoonId + chapterId) + imageId) % this.keyList.length];
        shuffle += this.keyList[((webtoonId + 1) + ((chapterId + 1) * (imageId + 1))) % this.keyList.length];
        shuffle += this.keyList[(((webtoonId + 1) * (chapterId + 1)) + (imageId + 1)) % this.keyList.length];
        shuffle += this.keyList[webtoonId % this.keyList.length];
        shuffle += this.keyList[chapterId % this.keyList.length];
        shuffle += this.keyList[imageId % this.keyList.length];
        for(var i = 0; i < data.length; i++) {
            returnData += String.fromCharCode(data.charCodeAt(i) ^ shuffle.charCodeAt(i % shuffle.length));
        }
        return returnData;
    },
    
    MTime: function() {
        return Math.round(new Date().getTime() / 1000 / 60);
    },
    
    base64decode: function(input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        do {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
               output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
               output = output + String.fromCharCode(chr3);
            }
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);
        return unescape(output);
    }

};

overlayLoader.run();
//delete overlayLoader.run;