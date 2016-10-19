// ==UserScript==
// @name            overtoonin
// @namespace       http://www.bumblebits.net
// @author          doonge@oddsquad.org
// @version         1.1.3
// @description     Load overlay from scanlation teams while browsing original webtoons.
// @match           http://comic.naver.com/*
// @match           http://m.comic.naver.com/*
// @match           http://webtoon.daum.net/*
// @match           http://cartoon.media.daum.net/*
// @match           http://comico.toast.com/*
// @match           http://www.comico.jp/*
// @match           http://www.foxtoon.com/*
// @match           http://page.kakao.com/*
// @match           http://comics.nate.com/*
// @match           http://webtoon.olleh.com/*
// @match           http://ttale.com/*
// @match           http://www.lezhin.com/*
// @match           https://ex-ac.lezhin.com/*
// @grant           none
// ==/UserScript==

var OTOON_VERSION = '1.1.3';
var OTOON_MESSAGE = 'Removing leftover console log commands (lag)';

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
                        arguments[0].callback([{target: arguments[0].node}]);
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
var overtooning = {
    //lang: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry ?
    storage: {                  //default values (overwritten by localStorage if exists)
        feed: [{url: 'http://otoon-api.bumblebits.net', name: 'Default feed', lang: ['en', 'es'], lastUpdate: 0}],
        webtoon: [],
        config: {
            debug: 3,               //verbosity of logs.
            active: true,           //stops the execution of this script early, if false (only display menu).
            lang: [],             //bypass the browser's user agent language, if needed.
            memoryLimit: 0,       //limit for the low memory devices (in megapixels).
            lazyLoading: true,         //images are to be loaded in order.
        },
        text: {
            _SETTING:           'Setting',
            _SETTING_LAZYLOAD:  'Ordered loading',
            _SETTING_LAZYLOAD_I:'Force the original images to be loaded one by one (automatically set to yes if you set a memory limit below).',
            _SETTING_MEMORY:    'Memory Limit (MPixel)',
            _SETTING_MEMORY_I:  'Limit the maximum memory available for image processing (low power devices). In megapixels (width/1024 x height/1024).',
            _SETTING_LANG:      'Force language preferences',
            _SETTING_LANG_I:    'Only use if the autodetect language feature is not enough. Currently available values are: ',
            _SETTING_DISABLE:   'Disable Overtooning on this website',
            _SETTING_RESET:     'Reset Overtooning data',
            _SETTING_RESET_I:   'If nothing works, maybe this will help.',
            _FEED:              'Feed',
            _FEED_TEMPLATE:     'Set this feed as layout translator.',
            _FEED_REFRESH:      'Refresh the data served by this feed.',
            _WEBTOON:           'Webtoon',
            _WEBTOON_FEED:      'Set this feed as primary choice for this webtoon.',
            _LOG:               'Log',
            _TEMPLATE:          'Layout',
            _TEMPLATE_I:        'Edit the layout (advanced users).',
            _ROUGH:             'Rough',
            _ROUGH_I:           'Placeholder for the Rough Translation functionality (not available yet).',
            _YES:               'Yes',
            _NO:                'No',
            _APPLY:             'Apply'
        },
        template: [],
        
        exec: function(func, property) {
            if(property) {
                if(!property.join) {
                    property = [property];
                }
                for(var i = property.length -1; i > -1; i--) {
                    this[func](property[i]);
                }
            } else {
                this.exec(func, ['feed', 'webtoon', 'config', 'text', 'template']);
            }
        },
        load: function(property) {
            var data = localStorage.getItem('overtooning.' + property);
            if(data && (data = JSON.parse(data))) {
                this[property] = data;
            }  
        },
        save: function(property) {
            if(this[property]) {
                localStorage.setItem('overtooning.' + property, JSON.stringify(this[property]));
            }
        },
        erase: function(property) {
            localStorage.removeItem('overtooning.' + property);
        }
    },

    jar: { //holds temporary shared vars for internal functions
        node: { //store properties like webtoonId, webtoonTitle etc...
            nodeList: {},
            valueList: {},
            routineList: {},
            pathList: {},
            addNode: function(property, node, path) {
                if(!this.nodeList[property]) {
                    this.nodeList[property] = [];
                }
                if(!this.pathList[property]) {
                    this.pathList[property] = [];
                }
                var index = this.nodeList[property].indexOf(node);
                if(index == -1) { // no duplicate node
                    var pathIndex = this.pathList[property].indexOf(path);
                    if(pathIndex == -1) {
                        this.nodeList[property].push(node);
                        return this.nodeList[property].length-1;
                    }
                    this.nodeList[property][pathIndex] = node;
                    return pathIndex;
                }
                return index;
            },
            value: function(property, value) {
                if(typeof value == 'string') {
                    this.valueList[property] = value;
                    var nodeList = [];
                    for(var i = this.nodeList[property] ? this.nodeList[property].length -1 : -1; i > -1; i--) {
                        if(document.contains(this.nodeList[property][i]) || this.nodeList[property][i] instanceof Attr) { //what to do with Attr?
                            nodeList.push(this.nodeList[property][i]);
                            overtooning.value(this.nodeList[property][i], value);
                        }
                    }
                    this.nodeList[property] = nodeList;
                }
                if(typeof this.valueList[property] !== 'undefined') {
                    return this.valueList[property];
                }
                return false;
            },
            routine: function(property, func, args) {
                if(typeof func == 'function') {
                    this.routineList[property] = {func: func, args: args};
                    var nodeList = [];
                    for(var i = this.nodeList[property] ? this.nodeList[property].length -1 : -1; i > -1; i--) { //empty orphans.
                        if(document.contains(this.nodeList[property][i])) {
                            nodeList.push(this.nodeList[property][i]);
                        }
                    }
                    this.nodeList[property] = nodeList;
                }
                for(var i = this.nodeList[property] ? this.nodeList[property].length -1 : -1; i > -1; i--) {
                    var node = this.nodeList[property][i],
                        unactiveNode = [],
                        order = (this.routineList[property].args && this.routineList[property].args.order),
                        active = false,
                        item = 0;
                    while(node) {
                        item++;
                        this.routineList[property].args.item = item;
                        active = this.routineList[property].func(node, this.routineList[property].args);
                        if(order) { //order subroutine
                            if(!active) {
                                unactiveNode.push(node);
                            } else {
                                if(unactiveNode.length) {
                                    var saveNodePlace = node.nextSibling; //we should move them all
                                    var switchNode = unactiveNode.shift(); // but will mess with the order because we do not care about non translated stuff
                                    node.parentNode.replaceChild(node, switchNode);
                                    node.parentNode.insertBefore(switchNode, saveNodePlace);
                                    node = switchNode;
                                    unactiveNode.push(node);
                                }
                            }
                        }
                        if(this.routineList[property].args && this.routineList[property].args.next) {
                            node = overtooning.next(node, this.routineList[property].args.next);
                            if(order && node.newList && this.routineList[property].args.multiple) {
                                unactiveNode = [];
                            }
                            if(node && node.node) {
                                node = node.node;
                            } else {
                                node = false;
                            }
                        } else {
                            node = false;
                        }
                    }
                }
            },
            refresh: function(property) {
                if(typeof property !== 'undefined') {
                    if(typeof this.valueList[property] == 'string') {
                        this.value(property, this.value(property));
                    } else if(typeof this.routineList[property].func == 'function') {
                        this.routine(property);
                    }
                } else {
                    for(property in this.valueList) {
                        this.refresh(property);
                    }
                }
            }
        },
        log: [],
        fetch: {node: [], name: []},
        run: {},
        menu: {}, //holds the menu node container.
        query: [],
        rawImage: new Image(),
        overlay: new Image(),
        splitOverlay: 0, //whether or not overlays are split (gives split height)
        canvas: [],
        pixel: 'data:image/svg+xml,<svg%20xmlns="http://www.w3.org/2000/svg"%20width="1"%20height="1"></svg>',
        pixelRatio: 0,
        currentImage: 0,
        busy: false,
        timer: false,
        interval: false,
        maxDimension: 1024 * 1024, //set default expected image's size to 1 Megapixel
        bufferSize: 0,
        internalWebtoonId: -1,
        observer: [],
        forceRaw: false //Cheese-like compromize
    },        

    menu: {
        close: function() {
            if(overtooning.jar.menu.container) {
                overtooning.jar.menu.container.parentNode.removeChild(overtooning.jar.menu.container);
            }
        },
        console: function(element, category) {
            if(!overtooning.jar.menu.container) {
                overtooning.jar.menu.container = overtooning.create('div', {id: 'otoon-console'},
                    overtooning.create('div', {className: 'otoon-row otoon-header', style: 'font-weight: bold; border-bottom: 1px solid black;'},
                        overtooning.create('a', {className: 'otoon-col otoon-button otoon-logo', textContent: 'Overtooning', href: 'http://overtooning.bumblebits.net', target: '_blank', style: 'text-decoration: none !important;'}, overtooning.create('small', {textContent: ' ' + OTOON_VERSION})),
                        overtooning.create('span', {className: 'otoon-col otoon-button otoon-close', textContent: 'X', onclick: overtooning.menu.close})
                    )
                );
            }
            while(overtooning.jar.menu.container.firstChild.nextSibling) {
                overtooning.jar.menu.container.removeChild(overtooning.jar.menu.container.firstChild.nextSibling);
            }
            overtooning.jar.menu.container.appendChild(overtooning.create('div', {className: 'otoon-row otoon-menu', style: 'position: relative; font-weight: bold; border-bottom: 1px solid black;'},
                overtooning.create('span', {
                    className: 'otoon-col otoon-button otoon-log' + (category == 'log' ? ' otoon-active':''),
                    textContent: overtooning.storage.text._LOG, onclick: overtooning.menu.log}),
                overtooning.create('span', {
                    className: 'otoon-col otoon-button otoon-general' + (category == 'general' ? ' otoon-active':''),
                    textContent: overtooning.storage.text._SETTING, onclick: overtooning.menu.setting}),
                overtooning.create('span', {
                    className: 'otoon-col otoon-button otoon-feed' + (category == 'feed' ? ' otoon-active':''),
                    textContent: overtooning.storage.text._FEED, onclick: overtooning.menu.feed}),
                overtooning.create('span', {
                    className: 'otoon-col otoon-button otoon-webtoon' + (category == 'webtoon' ? ' otoon-active':''),
                    textContent: overtooning.storage.text._WEBTOON, onclick: overtooning.menu.webtoon}),
                overtooning.create('span', {
                    className: 'otoon-col otoon-button otoon-template' + (category == 'template' ? ' otoon-active':''),
                    textContent: overtooning.storage.text._TEMPLATE, onclick: overtooning.menu.template}),
                overtooning.create('span', {
                    className: 'otoon-col otoon-button otoon-rough' + (category == 'rough' ? ' otoon-active':''),
                    textContent: overtooning.storage.text._ROUGH, onclick: overtooning.menu.rough})
            ));
            
            if(element) {
                element.className = 'otoon-col';
                overtooning.jar.menu.container.appendChild(overtooning.create('div', {className: 'otoon-row otoon-body'}, element));
            }
            if(!overtooning.jar.menu.container.parentNode) {
                document.body.appendChild(overtooning.jar.menu.container);
            }
        },
        log: function() {
            var logs = overtooning.create('div', {});
            if(!overtooning.jar.log.length) {
                logs.appendChild(overtooning.create('Empty Log'))
            }
            for(var i = 0; i < overtooning.jar.log.length; i++) {
                logs.appendChild(overtooning.create('p', {textContent: overtooning.jar.log[i], style: 'padding: 0 1em;'}));
            }
            overtooning.menu.console(logs, 'log');
        },
        setting: function() {
            var settings = overtooning.create('div', {});
            
            settings.appendChild(overtooning.create('div', {className: 'otoon-row'},
                overtooning.create('span', {className: 'otoon-col otoon-option-name', textContent: overtooning.storage.text._SETTING_LAZYLOAD}),
                overtooning.create('span', {className: 'otoon-col otoon-option-value'},
                    overtooning.create('input', {className: 'otoon-toggler otoon-hidden', id: 'otoon-lazyload-y', name: 'lazyload', type: 'radio', value: '1',
                        onclick: function() {overtooning.storage.config.lazyLoading = true; overtooning.storage.save('config');}}),
                    overtooning.create('label', {className: 'otoon-option otoon-yes', for: 'otoon-lazyload-y', textContent: overtooning.storage.text._YES}),
                    overtooning.create('input', {className: 'otoon-toggler otoon-hidden', id: 'otoon-lazyload-n', name: 'lazyload', type: 'radio', value: '0',
                        onclick: function() {overtooning.storage.config.lazyLoading = false; overtooning.storage.save('config');}}),
                    overtooning.create('label', {className: 'otoon-option otoon-no', for: 'otoon-lazyload-n', textContent: overtooning.storage.text._NO})
                    ),
                overtooning.create('span', {className: 'otoon-col otoon-info', textContent: overtooning.storage.text._SETTING_LAZYLOAD_I})
            ));

            settings.appendChild(overtooning.create('div', {className: 'otoon-row'},
                overtooning.create('span', {className: 'otoon-col otoon-option-name', textContent: overtooning.storage.text._SETTING_MEMORY}),
                overtooning.create('span', {className: 'otoon-col otoon-option-value'},
                    overtooning.create('input', {type: 'text', id: 'otoon-memorylimit', style: 'width: 40%;', value: Math.round(overtooning.storage.config.memoryLimit / 1024 / 1024)}),
                    overtooning.create('span', {className: 'otoon-option otoon-yes', textContent: overtooning.storage.text._APPLY,
                    onclick: function() {
                        var memoryLimit = Math.min(Math.max(document.getElementById('otoon-memorylimit').value, 0), 100);
                        overtooning.storage.config.memoryLimit = memoryLimit * 1024 * 1024;
                        overtooning.storage.save('config');
                    }})
                ),
                overtooning.create('span', {className: 'otoon-col otoon-info', textContent: overtooning.storage.text._SETTING_MEMORY_I})
            ));

            var lang = overtooning.lang();
            settings.appendChild(overtooning.create('div', {className: 'otoon-row'},
                overtooning.create('span', {className: 'otoon-col otoon-option-name', textContent: overtooning.storage.text._SETTING_LANG}),
                overtooning.create('span', {className: 'otoon-col otoon-option-value'},
                    overtooning.create('input', {type: 'text', id: 'otoon-lang', style: 'width: 40%;', value: overtooning.storage.config.lang ? overtooning.storage.config.lang.join(', ') : ''}),
                    overtooning.create('span', {className: 'otoon-option otoon-yes', textContent: overtooning.storage.text._APPLY,
                    onclick: function() {
                        var lang = overtooning.lang(),
                            result = [],
                            input = document.getElementById('otoon-lang');
                        var inputValue = input.value.split(',');
                        for(var i = inputValue.length-1; i > -1; i--){
                            if(lang.indexOf(inputValue[i].trim()) != -1) {
                                result.unshift(inputValue[i].trim());
                            }
                        }
                        if(overtooning.storage.config.lang != result) {
                            overtooning.storage.config.lang = result;
                            overtooning.storage.save('config');
                            //ping new template?
                            overtooning.cors(
                                overtooning.storage.feed[0].url + '/' + window.location.hostname + '/0/0.json?t=0&lang='+result.join(','), 'GET', '', '',
                                function(data) {overtooning.jar.query.unshift({feedId: 0, ping: true}); overtooning.query(data); overtooning.menu.setting();},
                                function(error) {overtooning.addLog('[overtooning.run] No template can be loaded'); overtooning.menu.log();}
                            );
                        }
                        input.value = result.join(', ');
                    }})
                ),
                overtooning.create('span', {className: 'otoon-col otoon-info', textContent: overtooning.storage.text._SETTING_LANG_I + lang.join(', ')})
            ));

            settings.appendChild(overtooning.create('div', {className: 'otoon-row'},
                overtooning.create('span', {className: 'otoon-col otoon-option-name', textContent: overtooning.storage.text._SETTING_DISABLE}),
                overtooning.create('span', {className: 'otoon-col otoon-option-value'},
                    overtooning.create('input', {className: 'otoon-toggler otoon-hidden', id: 'otoon-disable-y', name: 'disable', type: 'radio', value: '1',
                        onclick: function() {overtooning.storage.config.disable = true; overtooning.storage.save('config');}}),
                    overtooning.create('label', {className: 'otoon-option otoon-no', for: 'otoon-disable-y', textContent: overtooning.storage.text._YES}),
                    overtooning.create('input', {className: 'otoon-toggler otoon-hidden', id: 'otoon-disable-n', name: 'disable', type: 'radio', value: '0',
                        onclick: function() {overtooning.storage.config.disable = false; overtooning.storage.save('config');}}),
                    overtooning.create('label', {className: 'otoon-option otoon-yes', for: 'otoon-disable-n', textContent: overtooning.storage.text._NO})
                    )
            ));

            settings.appendChild(overtooning.create('div', {className: 'otoon-row'},
                overtooning.create('span', {className: 'otoon-col otoon-option-name', textContent: overtooning.storage.text._SETTING_RESET}),
                overtooning.create('span', {className: 'otoon-col otoon-option-value'},
                    overtooning.create('span', {className: 'otoon-option otoon-no', textContent: overtooning.storage.text._APPLY,
                    onclick: function() {
                        overtooning.storage.exec('erase');
                        window.setTimeout(function() {document.location.reload()}, 3000);
                    }})
                ),
                overtooning.create('span', {className: 'otoon-col otoon-info', textContent: overtooning.storage.text._SETTING_RESET_I})
            ));
            
            overtooning.menu.console(settings, 'general');
            
            document.getElementById(overtooning.storage.config.lazyLoading ? 'otoon-lazyload-y' : 'otoon-lazyload-n').checked = true;
            document.getElementById(overtooning.storage.config.disable ? 'otoon-disable-y' : 'otoon-disable-n').checked = true;
        },
        feed: function() {
            var feeds = overtooning.create('div', {});
            if(!overtooning.storage.feed.length) {
                feeds.appendChild(overtooning.create('no feed'))
            }
            for(var i = 0; i < overtooning.storage.feed.length; i++) {
                feeds.appendChild(overtooning.create('p', {textContent: overtooning.storage.feed[i].url}));
            }
            overtooning.menu.console(feeds, 'feed');
        },
        webtoon: function() {
            var webtoons = overtooning.create('div', {});
            if(!overtooning.storage.webtoon.length) {
                webtoons.appendChild(overtooning.create('no webtoon'))
            }
            for(var i = 0; i < overtooning.storage.webtoon.length; i++) {
                webtoons.appendChild(overtooning.create('p', {textContent: overtooning.storage.webtoon[i].wT}));
            }
            overtooning.menu.console(webtoons, 'webtoon');
        },
        template: function() {
            var template = overtooning.create('div', {});
            overtooning.storage.load('template');
            template.appendChild(overtooning.create('textarea', {style: 'width: 100%; height: 50em;', textContent: JSON.stringify(overtooning.storage.template, null, '    ')}));
            overtooning.storage.template = null;
            overtooning.menu.console(template, 'template');
        },
        rough: function() {
            var rough = overtooning.create('div', {});
            rough.appendChild(overtooning.create('p', {textContent: 'not yet'}));
            overtooning.menu.console(rough, 'rough');
        }
    },
    
    lang: function() {
        var lang = [];
        for(var i = overtooning.storage.feed.length -1; i > -1; i--) {
            if(overtooning.storage.feed[i].lang && overtooning.storage.feed[i].lang.length) {
                for(var j = overtooning.storage.feed[i].lang.length -1; j > -1; j--) {
                    if(lang.indexOf(overtooning.storage.feed[i].lang[j]) == -1) {
                        lang.unshift(overtooning.storage.feed[i].lang[j]);
                    }
                }
            }
        }
        return lang;
    },
    
    mutation: function(MutationRecord) {
        var observerId = -1, targetElement = MutationRecord[0].target;
        for(var i = overtooning.jar.observer.length -1; i > -1; i--) {
            if(targetElement == overtooning.jar.observer[i].target) {
                observerId = i;
                break;
            }
        }
        if(observerId != -1) {
            overtooning.jar.observer[observerId].observer.disconnect();
            overtooning.addLog('[overtooning.observe] Mutation observed ' + overtooning.jar.observer[observerId].path);
            overtooning.jar.fetch = {node: [], name: []}; //desactivate save node function (maybe remove it ?).
            overtooning.runTemplate(overtooning.jar.observer[observerId].template);
            overtooning.jar.observer[observerId].observer.observe(overtooning.jar.observer[observerId].target, overtooning.jar.observer[observerId].options);
        }
    },
    
    run: function() {
        if (window.top !== window.self || window.frameElement) {
            return;
        }
        
        overtooning.storage.exec('load');
        
        if(!overtooning.jar.run.stylesheet) {
            overtooning.jar.run.stylesheet = overtooning.create('style', {});
            overtooning.jar.run.stylesheet.textContent = overtooning.getBaseCss();
            delete overtooning.getBaseCss;
        }
        if(!overtooning.jar.run.stylesheet.parentNode) {
            document.body.appendChild(overtooning.jar.run.stylesheet);
        }
        
        if(!overtooning.storage.template || !overtooning.storage.template.length) {
            //legacy localStorage variables
            localStorage.removeItem('doongeFeeds');
            localStorage.removeItem('overloaderData');
            // end of legacy
            if(!overtooning.storage.feed || !overtooning.storage.feed.length) {
                overtooning.showFeed();
            } else {
                overtooning.jar.query.push({feedId: 0, ping: true});
                overtooning.cors(
                    overtooning.storage.feed[0].url + '/' + window.location.hostname + '/0/0.json?t=0'+
                        (overtooning.storage.config.lang ? overtooning.storage.config.lang.join(',') : ''), 'GET', '', '',
                    function(data) {overtooning.query(data); if(overtooning.storage.template.length) overtooning.run();},
                    function(error) {overtooning.addLog('[overtooning.run] No template can be loaded'); overtooning.menu.log();}
                );
            }
            return false;
        }

        if(!overtooning.jar.run.template) {
            overtooning.jar.run.template = [];
            var priorityTemplate = [];
            //select proper routes and populate main queue (overtooning.jar.run.template)
            for(var index = overtooning.storage.template.length -1; index > -1; index--) {
                if( new RegExp('^' + overtooning.storage.template[index].route.replace(/\\/g, '').replace(/\./g, '\\.').replace(/\//g, '\/')).test(window.location.pathname/* + window.location.hash*/) ) {
                    overtooning.addLog('[overtooning.run] pathname: ' + overtooning.storage.template[index].route);
                    if(overtooning.storage.template[index].html) {
                        for(var path = overtooning.storage.template[index].html.length -1; path > -1; path--) {
                            if(overtooning.storage.template[index].html[path].assign && /^overtooning|webtoonId|chapterId$/.test(overtooning.storage.template[index].html[path].assign)) {
                                priorityTemplate.push(overtooning.storage.template[index].html[path]);
                            } else {
                                overtooning.jar.run.template.push(overtooning.storage.template[index].html[path]);
                            }
                        }
                    }
                    if(overtooning.storage.template[index].css && !overtooning.storage.config.disable) {
                        overtooning.jar.run.stylesheet.textContent += overtooning.storage.template[index].css;
                    }
                }
            }
            overtooning.storage.template = [];
            if(priorityTemplate.length) {
                overtooning.runTemplate(priorityTemplate);
                priorityTemplate = [];
            }
            
            if(!overtooning.jar.node.value('overtooning')) {
                overtooning.addLog('[overtooning.run] Could not bootstrap - correct template?');
                overtooning.menu.log();
            }
            
            if(overtooning.storage.config.disable) {
                 overtooning.addLog('[overtooning.run] User has disabled Overtooning on this website.');
                return false;
            }
            
            var webtoonId = false;
            if(webtoonId = overtooning.jar.node.value('webtoonId')) {
                 for(var i = overtooning.storage.webtoon.length -1; i > -1; i--) {
                    if(overtooning.storage.webtoon[i].wI == webtoonId) {
                        overtooning.jar.internalWebtoonId = i;
                        overtooning.jar.node.value('webtoonTitle', overtooning.storage.webtoon[i].wT);
                        overtooning.jar.node.value('webtoonAuthor', overtooning.storage.webtoon[i].wA);
                        overtooning.jar.node.value('webtoonBlurb', overtooning.storage.webtoon[i].wB);
                    }
                }
            }
            
            //*// Cheese in the Trap exception
            var forceWebtoonId = window.location.hash.match(new RegExp('^#otoon=([0-9a-zA-Z_-]+)$'));
            if(forceWebtoonId) {
                overtooning.jar.node.value('chapterId', forceWebtoonId[1]);
                overtooning.jar.forceRaw = true;
                overtooning.jar.saveAssignImageList = overtooning.assign.imageList;
                overtooning.assign.imageList = function(data) {  //do nothing
                    overtooning.jar.node.routineList.imageList = {args: data};
                };
            }

            //*/
            
            overtooning.jar.run.template.sort(function(a, b) {return ( ( a.path == b.path ) ? 0 : ( ( a.path > b.path ) ? 1 : -1 ) );});
            //populate wait and observers queues (overtooning.jar.run.wait and overtooning.jar.run.observe).
            overtooning.jar.run.wait = [];
            overtooning.jar.run.observe = [];
            for(var index = 0; index <  overtooning.jar.run.template.length; index++) { //wait and observers setup
                if(overtooning.jar.run.template[index].wait) {
                    overtooning.jar.run.wait.push(overtooning.jar.run.template[index]);
                }
                if(overtooning.jar.run.template[index].observe) {
                    var targetElement = overtooning.fetch(overtooning.jar.run.template[index].observe);
                    if(targetElement) {
                        var observerId = -1;
                        for(var i = overtooning.jar.observer.length -1; i > -1; i--) {
                            if(targetElement == overtooning.jar.observer[i].target) {
                                observerId = i;
                                break;
                            }
                        }
                        if(observerId == -1) {
                            overtooning.addLog('[overtooning.run.observe] Attaching observer to ' + overtooning.jar.run.template[index].observe);
                            overtooning.jar.observer.push({
                                target: targetElement,
                                path: overtooning.jar.run.template[index].observe,
                                options: overtooning.jar.run.template[index].options || {childList: true},
                                template: []
                            });
                            observerId = overtooning.jar.observer.length -1;
                            overtooning.jar.observer[observerId].observer = new MutationObserver(overtooning.mutation);
                        } else {
                            overtooning.jar.observer[observerId].observer.disconnect();
                            overtooning.addLog('[overtooning.run.observe] Overloading ' + overtooning.jar.run.template[index].observe);
                            for(var property in overtooning.jar.run.template[index].options) {
                                if (overtooning.jar.run.template[index].options.hasOwnProperty(property) && !overtooning.jar.observer[observerId].options[property]) {
                                    overtooning.jar.observer[observerId].options[property] = true;
                                }
                            }
                        }
                        delete overtooning.jar.run.template[index].observe;
                        delete overtooning.jar.run.template[index].options;
                        overtooning.jar.observer[observerId].template.push(overtooning.jar.run.template[index]);
                        overtooning.jar.observer[observerId].observer.observe(overtooning.jar.observer[observerId].target, overtooning.jar.observer[observerId].options);
                    }
                }
            }
            //if overtooning.jar.run.wait isn't empty, plan it.
            if(overtooning.jar.run.wait.length) {
                overtooning.jar.run.timer = window.setInterval(function() {
                    if(document.readyState == "complete") {
                        window.clearInterval(overtooning.jar.run.timer);
                        overtooning.runTemplate(overtooning.jar.run.wait);
                        delete overtooning.jar.run.wait;
                    }
                }, 1000);
            }
        }

        //once every image has been described
        if(!overtooning.jar.pixelRatio) {
            var ctx = document.createElement("canvas").getContext("2d"),
                dpr = window.devicePixelRatio || 1,
                bsr = ctx.webkitBackingStorePixelRatio ||
                      ctx.mozBackingStorePixelRatio ||
                      ctx.msBackingStorePixelRatio ||
                      ctx.oBackingStorePixelRatio ||
                      ctx.backingStorePixelRatio || 1;
            overtooning.jar.pixelRatio =  dpr / bsr;
            if(overtooning.jar.pixelRatio != 1) {
                overtooning.console('[overtooning.run] Pixel Ratio: ' + overtooning.jar.pixelRatio);
            }
        }
        
        overtooning.jar.rawImage.onload = overtooning.rawImageOnLoad;
        overtooning.jar.rawImage.onerror = overtooning.rawImageOnError;
        overtooning.jar.overlay.onload = overtooning.overlayOnLoad;
        overtooning.jar.overlay.onerror = overtooning.overlayOnError;
        
        overtooning.runTemplate(overtooning.jar.run.template);
        overtooning.addLog('[overtooning.template] End.');

        var MTime = overtooning.MTime(),
            priorityFeed = [];
        if(overtooning.jar.internalWebtoonId != -1) {
            priorityFeed = overtooning.storage.webtoon[overtooning.jar.internalWebtoonId].fL;
            for(var j = 0; j < priorityFeed.length; j++) {
                overtooning.jar.query.push({feedId: priorityFeed[j]});
            }
        }
        for(var j = 0; j < overtooning.storage.feed.length; j++) {
            if(priorityFeed.indexOf(j) == -1 && overtooning.storage.feed[j].lastUpdate + 60 * 24 * 7 < MTime) {
                overtooning.addLog('[overtooning.run] Ping feed: ' + overtooning.storage.feed[j].url + ' (' + j + ')');
                overtooning.jar.query.push({feedId: j, ping: true});
            }
        }
        overtooning.addLog('[overtooning.run] Queries to be made: ' + overtooning.jar.query.length);
        if(overtooning.jar.query) {
            overtooning.query();
        }
        
        overtooning.addLog('[overtooning.run] End.');
        //overtooning.menu.console();
    },

    assign: {
        generic: function(data) {
            overtooning.jar.node.addNode(data.assign, data.node, data.path);
            if(overtooning.jar.node.value(data.assign)) {
                overtooning.jar.node.value(data.assign, overtooning.jar.node.value(data.assign), data.assign == 'webtoonBlurb' ? true : false);
            }
        },
        webtoonId: function(data) { // no need to add node.
            if(!overtooning.jar.node.value('webtoonId')) {
                overtooning.jar.node.value('webtoonId', overtooning.value(data.node));
            }
        },
        chapterId: function(data) { // no need to add node.
            if(!overtooning.jar.node.value('chapterId')) {
                overtooning.jar.node.value('chapterId', overtooning.value(data.node));
            }
        },
        overtooning: function(data) { // simple setup
            overtooning.jar.node.value('overtooning', '1');
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('viewBox', '0 0 64 64');
            svg.setAttribute('style', 'width: 100%; height: 100%; overflow: visible;');
            svg.setAttribute('title', 'overTooning');
            svg.onclick = function() {
                //allow select and copy/paste (disallowed from naver).
                document.oncontextmenu = null;
                document.onselectstart = null;
                //end;
               overtooning.menu.log();
            };
            var path = document.createElementNS(svg.namespaceURI, 'path');
            path.setAttribute('d', 'M32 4c18 0 32 12 32 26s-14 26-32 26c-2 0-3 0-5 0-7 7-15 8-23 8v-2c4-2 8-6 8-10 0-1 0-1 0-2-7-5-12-12-12-20 0-14 14-26 32-26zM48 25l-11-2-5-10-5 10-11 2 8 8-2 11 10-5 10 5-2-11 8-8z');
            svg.appendChild(path);
            data.node.appendChild(svg);
        },
        webtoonList: function(data) {
            overtooning.jar.node.addNode(data.assign, data.node, data.path);
            delete data.node;
            data.order = true;
            overtooning.jar.node.routine(data.assign, overtooning.webtoonList, data);
        },
        chapterList: function(data) {
            overtooning.jar.node.addNode(data.assign, data.node, data.path);
            delete data.node;
            overtooning.jar.node.routine(data.assign, overtooning.chapterList, data);
        },
        imageList: function(data) {
            //overtooning.addLog('[overtooning.assign] Call to imageList');
            if(overtooning.jar.busy) { //nope, but prioritize this function over loadImage() timer.
                if(overtooning.jar.timer) {
                    window.clearTimeout(overtooning.jar.timer);
                    overtooning.jar.timer = false;
                }
                if(!overtooning.jar.interval) {
                    overtooning.jar.interval = window.setInterval(overtooning.assign.imageList, 1000);
                }
                overtooning.addLog('[overtooning.canvas] Cancelled: already busy loading an image');
                return false;
            }
            if(!overtooning.storage.config.memoryLimit) { //no need to keep interval if no memory limit.
                window.clearInterval(overtooning.jar.interval);
                overtooning.jar.interval = false;
            } else if(!overtooning.jar.interval){
                overtooning.jar.interval = window.setInterval(overtooning.assign.imageList, 1000);
            }
            //console.log('[imageList] running');
            //clean canvas list.
            var replaceCanvas = [];
            for(var i = overtooning.jar.canvas.length -1; i > -1; i--) {
                if(document.contains(overtooning.jar.canvas[i].ref)) {
                    replaceCanvas.push(overtooning.jar.canvas[i]);
                } else {
                    overtooning.jar.canvas[i].ref.src = overtooning.jar.pixel;
                    overtooning.jar.canvas[i].ref = null;
                    if(overtooning.jar.canvas[i].node) {
                        overtooning.jar.canvas[i].node.textContent = '';
                        overtooning.jar.canvas[i].node = null;
                    }
                    overtooning.jar.canvas[i].activeNode = null;
                }
            }
            overtooning.jar.canvas = replaceCanvas;
            replaceCanvas = [];

            //launch analysis routine which populates overtooning.jar.canvas.
            if(data) {
                overtooning.jar.node.addNode(data.assign, data.node, data.path);
                overtooning.jar.node.routine(data.assign, overtooning.imageList, data);
                overtooning.jar.node.nodeList.imageList = []; //ugly but we don't need it.
                //data.node = first node, lastNode = last node. (we have "next").
                overtooning.jar.node.routineList.imageList.args.lastNode = overtooning.jar.canvas[overtooning.jar.canvas.length-1].ref;
            } else {
                var test = overtooning.fetch(overtooning.jar.node.routineList.imageList.args.path);
                if(test != overtooning.jar.node.routineList.imageList.args.node) { //different first or last node!
                    overtooning.jar.node.routineList.imageList.args.item = 1;
                    overtooning.jar.node.routine('imageList', overtooning.imageList, overtooning.jar.node.routineList.imageList.args);
                    overtooning.addLog('[overtooning.canvas] Image list updated (new starting node).');
                } else if(test = overtooning.next(overtooning.jar.node.routineList.imageList.args.lastNode, overtooning.jar.node.routineList.imageList.args.next)) {
                    while(test) {
                        test = test.node;
                        overtooning.jar.node.routineList.imageList.args.item++;
                        overtooning.jar.node.routineList.imageList.args.lastNode = test;
                        overtooning.imageList(test, overtooning.jar.node.routineList.imageList.args);
                        test = overtooning.next(test, overtooning.jar.node.routineList.imageList.args.next);
                    }
                    overtooning.addLog('[overtooning.canvas] Image list updated (new ending node).');
                }
            }

            var position = {top: 0, left: 0, width: 0, height: 0},
                comparer = function(a, b) {
                    if(a.distance == -1) return 1;
                    if(b.distance == -1) return -1;
                    if(a.distance < b.distance) return -1;
                    if(a.distance > b.distance) return 1;
                    return 0;
                };
            //Orders images in current viewing order, relative to top-left scroll value.
            for(var i = overtooning.jar.canvas.length-1; i > -1; i--) {
                if(overtooning.jar.canvas[i].activeNode.style.display == 'none') {
                    overtooning.jar.canvas[i].distance = -1;
                } else {
                    position = overtooning.jar.canvas[i].activeNode.getBoundingClientRect();
                    overtooning.jar.canvas[i].distance = Math.pow(position.top, 2) + Math.pow(position.left, 2);
                }
                overtooning.jar.canvas[i].top = position.top;
                overtooning.jar.canvas[i].left = position.left;
                replaceCanvas.splice(overtooning.pivot(overtooning.jar.canvas[i], replaceCanvas, comparer) +1, 0, overtooning.jar.canvas[i]);
            }
            overtooning.jar.canvas = replaceCanvas;
            replaceCanvas = [];
            //overtooning.addLog('yeah '+ JSON.stringify(overtooning.jar.canvas));//do something.
            /*//var string = '';
            for(var i= 0; i < 6; i++) {
                string += ' ' +  overtooning.jar.canvas[i].item + '('+overtooning.jar.canvas[i].loaded+')';
            }
            //console.log('[imageList] order ' + string);
            //*/
            overtooning.loadImage();
        }
    },
    
    webtoonList: function(node, args) {
        if(args && args.innerPath && args.innerPath.webtoonId) {
            var webtoonId = overtooning.fetch(args.innerPath.webtoonId, node, true),
                webtoonInfo = false;
            webtoonId = webtoonId ? overtooning.value(webtoonId) : false;
            for(var i = overtooning.storage.webtoon.length -1; i > -1; i--) {
                if(overtooning.storage.webtoon[i].wI == webtoonId) {
                    webtoonInfo = overtooning.storage.webtoon[i];
                    break;
                }
            }
            if(webtoonInfo) {
                shortProperty = {webtoonTitle: 'wT', webtoonAuthor: 'wA', webtoonBlurb: 'wB'};
                for(property in shortProperty) {
                    if(args.innerPath[property]) {
                        var subNode = overtooning.fetch(args.innerPath[property], node, true);
                        if(subNode) {
                            overtooning.value(subNode, webtoonInfo[shortProperty[property]]);
                        }
                    }
                }
                return true;
            }    
        }
        return false;
    },
    
    chapterList: function(node, args) {
        if(args && args.innerPath && args.innerPath.chapterId && overtooning.jar.chapterList) { // args chapterList is to be added on CORS request
            var chapterId = overtooning.fetch(args.innerPath.chapterId, node, true),
                chapterInfo = false;
            chapterId = chapterId ? overtooning.value(chapterId) : false;
            for(var i = overtooning.jar.chapterList.length -1; i > -1; i--) {
                if(overtooning.jar.chapterList[i].id == chapterId) {
                    chapterInfo = overtooning.jar.chapterList[i];
                    break;
                }
            }
            if(chapterInfo) {
               var subNode = overtooning.fetch(args.innerPath.chapterTitle, node, true);
                if(subNode) {
                    overtooning.value(subNode, chapterInfo.title);
                }
                return true;
            }
        }
        return false;
    },
    
    imageList: function(node, args) {
        var index = -1,
            src = false;
        
        for(var i = overtooning.jar.canvas.length -1; i > -1; i--) {
            if(overtooning.jar.canvas[i].ref == node) {
                index = i;
                break;
            }
        }
        if(index == -1) {
            overtooning.jar.canvas.push({ref: node});
            index = overtooning.jar.canvas.length -1;
        }

        if(!overtooning.jar.canvas[index].src) {
            if(args.innerPath && args.innerPath.src && node.getAttribute(args.innerPath.src)) {
                overtooning.jar.canvas[index].src = node.getAttribute(args.innerPath.src);
                overtooning.jar.canvas[index].attribute = args.innerPath.src;
            } else {
                overtooning.jar.canvas[index].src = node.src;
            }
            if(overtooning.storage.config.lazyLoading && node.src == overtooning.jar.canvas[index].src) {
                node.src = overtooning.jar.pixel;
            }
        }
        
        if(!overtooning.jar.canvas[index].activeNode) {
            overtooning.jar.canvas[index].activeNode = overtooning.jar.canvas[index].ref
        }

        overtooning.jar.canvas[index].style = args.innerPath && args.innerPath.style ? args.innerPath.style : '';
        //more intricate way to calculate imageNumber (distord or depending on page node) here.
        overtooning.jar.canvas[index].item = args.item;
    },
    
    loadImage: function() {
        if(overtooning.jar.timer) {
            window.clearTimeout(overtooning.jar.timer);
            overtooning.jar.timer = false;
        }
        if(overtooning.jar.busy) {
            return false;
        }
        var workToDo = false, fullyLoaded = true;
        for(var i = 0; i < overtooning.jar.canvas.length; i++) {
            if(!overtooning.jar.canvas[i].loaded) {
                if( overtooning.jar.canvas[i].ref.src == overtooning.jar.pixel || 
                    overtooning.jar.canvas[i].ref.src == ('data:image/svg+xml,<svg%20xmlns="http://www.w3.org/2000/svg"%20width="'+overtooning.jar.canvas[i].width+'"%20height="'+overtooning.jar.canvas[i].height+'"></svg>') || overtooning.jar.canvas[i].ref.src == overtooning.jar.canvas[i].src) {
                    overtooning.jar.currentImage = i;
                    workToDo = true;
                    break;
                } else {
                    fullyLoaded = false;
                }
            }
        }
        if(!workToDo) {
            if(!fullyLoaded) {
                overtooning.jar.timer = window.setTimeout(overtooning.loadImage, 1000);
            } else {
                overtooning.addLog('[overtooning.canvas] All images have been loaded. No lazyloading.');
            }
            return false;
        }
        //free memory
        if(overtooning.storage.config.memoryLimit) {
            var megapixel = overtooning.jar.maxDimension,
                cursor = overtooning.jar.canvas.length -1;
            if(overtooning.jar.canvas[overtooning.jar.currentImage].width) {
                megapixel = overtooning.jar.canvas[overtooning.jar.currentImage].width * overtooning.jar.canvas[overtooning.jar.currentImage].height;
            }
            while(cursor > overtooning.jar.currentImage && overtooning.jar.bufferSize + megapixel > overtooning.storage.config.memoryLimit) {
                var rect = overtooning.jar.canvas[cursor].activeNode.getBoundingClientRect();
                var isVisible = (
                    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
                    rect.bottom > 0 &&
                    rect.right > 0
                );
                if(overtooning.jar.canvas[cursor].loaded && !isVisible) {
                    overtooning.addLog('[overtooning.canvas.memoryLimit] Unloading image ' + overtooning.jar.canvas[cursor].item);
                    overtooning.jar.canvas[cursor].loaded = false;
                    overtooning.jar.canvas[cursor].ref.src = 'data:image/svg+xml,<svg%20xmlns="http://www.w3.org/2000/svg"%20width="'+overtooning.jar.canvas[cursor].width+'"%20height="'+overtooning.jar.canvas[cursor].height+'"></svg>';
                    if(overtooning.jar.canvas[cursor].node) {
                        overtooning.jar.canvas[cursor].node.textContent = '';
                    }
                    overtooning.jar.canvas[cursor].node.className = 'otoon-overlay hidden';
                    overtooning.jar.bufferSize -= overtooning.jar.canvas[cursor].width * overtooning.jar.canvas[cursor].height;
                }
                cursor--;
            }
            if(overtooning.jar.bufferSize && overtooning.jar.bufferSize + megapixel > overtooning.storage.config.memoryLimit) {
                return false;
            }
        }
        overtooning.jar.busy = true;
        overtooning.jar.rawImage.src = overtooning.jar.canvas[overtooning.jar.currentImage].src;
    },
    
    rawImageOnLoad: function() {
        var pointer = overtooning.jar.canvas[overtooning.jar.currentImage];
        if(pointer.ref.src != overtooning.jar.rawImage.src) { //our lazyloading or their
            overtooning.addLog('[overtooning.canvas] Loading image ' + pointer.item);
            pointer.ref.src = overtooning.jar.rawImage.src;
            /*window.setTimeout(overtooning.jar.rawImage.onload, 5000);
            return false;*/
        }
        if(document.readyState != "complete") {
            overtooning.addLog('[overtooning.canvas] still loading...');
            window.setTimeout(overtooning.jar.rawImage.onload, 100);
            return;
        } 
        pointer.loaded = true;
        if(pointer.attribute) { // their lazyloading, let's break it.
            pointer.ref.removeAttribute(pointer.attribute);
            delete pointer.attribute;
        }
        
        pointer.width = overtooning.jar.rawImage.naturalWidth;
        pointer.height = overtooning.jar.rawImage.naturalHeight;
        pointer.ref.width = overtooning.jar.rawImage.naturalWidth;
        pointer.ref.height = overtooning.jar.rawImage.naturalHeight;
        
        var mgpxl = overtooning.jar.rawImage.naturalWidth * overtooning.jar.rawImage.naturalHeight;
        if (mgpxl > overtooning.jar.maxDimension) {
            overtooning.jar.maxDimension = mgpxl;
        }
        overtooning.jar.bufferSize += mgpxl;

        //pointer.clientWidth = pointer.activeNode.clientWidth;
        //pointer.clientHeight = pointer.activeNode.clientHeight;

        if(overtooning.jar.generalUrl) {
            window.setTimeout(function() {overtooning.jar.overlay.src = overtooning.jar.generalUrl.replace('{imgNumber}', overtooning.digit(pointer.item, 2));}, 200);
            return true;
        }
        overtooning.jar.busy = false;
        if(!overtooning.storage.config.memoryLimit || (overtooning.jar.bufferSize + overtooning.jar.maxDimension <= overtooning.storage.config.memoryLimit)) {
            window.setTimeout(overtooning.assign.imageList, 200);
        }
    },
    
    rawImageOnError: function() {
        overtooning.addLog('[overtooning.canvas] Error while loading image ' + overtooning.jar.canvas[overtooning.jar.currentImage].item);
        overtooning.jar.canvas[overtooning.jar.currentImage].ref.src = this.src;
        overtooning.jar.canvas[overtooning.jar.currentImage].loaded = true;
        overtooning.jar.busy = false;
        if(!overtooning.storage.config.memoryLimit || (overtooning.jar.bufferSize + overtooning.jar.maxDimension <= overtooning.storage.config.memoryLimit)) {
            window.setTimeout(overtooning.assign.imageList, 200);
        }
    },
    
    overlayOnLoad: function() {
        var pointer = overtooning.jar.canvas[overtooning.jar.currentImage];
        overtooning.addLog('[overtooning.canvas] Loading overlay ' + pointer.item);
        if(!pointer.node) {
            pointer.node = overtooning.create('div', {
                className: 'otoon-overlay'
                /*,
                style: 'position: relative;'+
                    ' width: ' + pointer.activeNode.clientWidth + 'px;'+
                    ' height: ' + pointer.activeNode.clientHeight + 'px;'+
                    pointer.style
                */
                }
            );
        } else {
            pointer.node.className = 'otoon-overlay';
        }

        var mode = pointer.height >= pointer.width ? 'height' : 'width',
            start = 0,
            stop = pointer[mode],
            naturalCanvas,
            increment = Math.floor(1024 * 1024 / (mode == 'height' ? pointer.width : pointer.height)), //max 1 megapixel per canvas.
            dim = {height: pointer.height, width: pointer.width},
            cursor = {height: 0, width: 0};
        // possible improvement for the memory management mode:
        //  instead of filling to to bottom or left to right, check if the opposite is better each time
        while(start != stop) {
            /*if(start > 0) {
                start -= Math.floor(Math.random()*10 + 5);
            }*/
            if(start + increment > stop) {
                increment = stop - start;
            }
            dim[mode] = increment;
            cursor[mode] = start;
            
            naturalCanvas = overtooning.create('canvas', {
                width: dim.width, height: dim.height/*,
                style: 'position: absolute; top: ' + cursor.height + 'px; left: '+ cursor.width +'px;'*/
            });
            naturalCanvas.getContext('2d').drawImage(
                overtooning.jar.rawImage,
                cursor.width, cursor.height,
                dim.width, dim.height, 0, 0, dim.width, dim.height
            );
            naturalCanvas.getContext('2d').drawImage(
                overtooning.jar.overlay,
                cursor.width, cursor.height,
                dim.width, dim.height, 0, 0, dim.width, dim.height
            );
            
            if(/*pointer.activeNode.clientHeight != pointer.height ||*/ overtooning.jar.pixelRatio != 1) {
                /*var heightMod = pointer.activeNode.clientHeight / pointer.height;
                var widthMod = pointer.activeNode.clientWidth / pointer.width;*/
                /*if(start == 0 && pointer.activeNode.clientHeight != pointer.height) {
                    overtooning.addLog('[overtooning.canvas] Adjusting size for item '+pointer.item+': Width '+ pointer.activeNode.clientWidth +' / '+ pointer.width +' - Height '+ pointer.activeNode.clientHeight +' / '+ pointer.height);
                }*/
                var copyCanvas = overtooning.create('canvas', {
                    width: Math.round(naturalCanvas.width * overtooning.jar.pixelRatio),
                    height: Math.round(naturalCanvas.height * overtooning.jar.pixelRatio),
                    /*style: 'position: absolute; top: ' + (cursor.height ? Math.round(cursor.height * heightMod) : 0) + 'px;'+
                        ' left: ' + (cursor.width ? Math.round(cursor.width * widthMod) : 0) + 'px;'*/}
                );
                //copyCanvas.style.width =  mode == 'height' ? pointer.activeNode.clientWidth +'px' : Math.round(increment * widthMod) +'px';
                //copyCanvas.style.height =  mode == 'height' ? Math.round(increment * heightMod) +'px' : pointer.activeNode.clientHeight +'px';
                copyCanvas.getContext('2d').setTransform(overtooning.jar.pixelRatio, 0, 0, overtooning.jar.pixelRatio, 0, 0);
                copyCanvas.getContext('2d').drawImage(naturalCanvas, 0, 0);
                naturalCanvas = copyCanvas;
                copyCanvas = null;
            }
            
            pointer.node.appendChild(naturalCanvas);
            start += increment;
        }
        
        pointer.node.appendChild(overtooning.create('div', {style: 'position: absolute; top:0; left:0; width: 100%; height: 100%;'}));
        //free some memory maybe.
        pointer.ref.src = 'data:image/svg+xml,<svg%20xmlns="http://www.w3.org/2000/svg"%20width="'+pointer.width+'"%20height="'+pointer.height+'"></svg>';
        //*//
        overtooning.jar.onloadSave = overtooning.jar.rawImage.onload;
        overtooning.jar.rawImage.onload = function() {overtooning.jar.rawImage.onload = overtooning.jar.onloadSave; overtooning.jar.onloadSave = null;};
        overtooning.jar.rawImage.src = overtooning.jar.pixel;
        //*/
        if(pointer.ref.previousSibling != pointer.node) {
            pointer.ref.parentNode.insertBefore(pointer.node, pointer.ref);
        }
        pointer.activeNode = pointer.node;
        overtooning.jar.busy = false;
        if(!overtooning.storage.config.memoryLimit || (overtooning.jar.bufferSize + overtooning.jar.maxDimension <= overtooning.storage.config.memoryLimit)) {
            window.setTimeout(overtooning.assign.imageList, 200);
        }
    },
    
    overlayOnError: function() {
        overtooning.addLog('[overtooning.canvas] Error while loading overlay ' + overtooning.jar.canvas[overtooning.jar.currentImage].item);
        overtooning.jar.busy = false;
        if(!overtooning.storage.config.memoryLimit || (overtooning.jar.bufferSize + overtooning.jar.maxDimension <= overtooning.storage.config.memoryLimit)) {
            window.setTimeout(overtooning.assign.imageList, 200);
        }
    },
    
    runTemplate: function(template) {
        if(!template || !template.length) {
            return false;
        }
        for(var index = 0; index < template.length; index++) {
            //console.log(template[index].path);
            var node = overtooning.fetch(template[index].path);
            if(node) {
                node = overtooning.runCommand(node, template[index]); //not possible to call by reference node.
                if(template[index].next && !template[index].assign) { // assign nexts are managed through their own way.
                    var item = 1;
                    while(next = overtooning.next(node, template[index].next)) {
                        template[index].item = item;
                        node = overtooning.runCommand(next.node, template[index]); //we don't care about newList, so we don't really care about the whole next object.
                        item++;
                    }
                }
            }
        }
        template = [];
    },
    
    next: function(node, nextArray) {
        if(node && nextArray && nextArray[0]) {
            var saveNode = node;
            var currentNode = overtooning.fetch(nextArray[0], saveNode, true);
            for(var cursor = 1; !currentNode && cursor < nextArray.length; cursor++) {
                currentNode = overtooning.fetch(nextArray[cursor], saveNode, true);
            }
            if(currentNode) {
                return {node: currentNode, newList: (cursor > 1 && cursor == nextArray.length)?true:false};
            }
        }
        return false;
    },
    
    pivot: function(element, array, comparer, start, end) {
        if(array.length === 0)
            return -1;
        
        start = start || 0;
        end = end || array.length;
        var pivot = (start + end) >> 1,
            c = comparer(element, array[pivot]);

        if(end - start <= 1) return c == -1 ? pivot -1 : pivot;
        switch(c) {
            case -1: return overtooning.pivot(element, array, comparer, start, pivot);
            case 0: return pivot;
            case 1: return overtooning.pivot(element, array, comparer, pivot, end);
        }
    },

    runCommand: function (node, command) {
        if(command.assign && command.assign == 'overtooning') {
            node.parentNode.insertBefore(overtooning.create('div', {}),
                node.nextSibling);
            node = node.nextSibling;
        } else if(command.new && command.tagName) {
             node.parentNode.insertBefore(overtooning.create(command.tagName, {}),
                node.nextSibling);
            node = node.nextSibling;
        }
        if(command.tagName && node.nodeName != command.tagName) {
            var copyNode = overtooning.create(command.tagName, {innerHTML: node.innerHTML ? node.innerHTML : ' '}); //insecure?
            if(node.className) {
                copyNode.className = node.className;
            }
            if(node.id) {
                copyNode.id = node.id;
            }
            node.parentNode.insertBefore(copyNode, node);
            node = node.previousSibling;
            node.parentNode.removeChild(node.nextSibling);
        }
        if(command.className && node.className != command.className) {
            if(!node.saveClass) {
                node.saveClass = node.className;
            }
            node.className = command.className;
        }
        if(command.style) {
            /*if(!node.saveStyle) {
                node.saveStyle = node.getAttribute('style') || '';
            }*/
            node.setAttribute('style', (node.getAttribute('style') || '') + command.style);
        }
        if(command.assign) {
            var property = overtooning.assign[command.assign] ? command.assign : 'generic';
            overtooning.assign[property]({
                node: node,
                assign: command.assign,
                path: command.path,
                innerPath: command.innerPath ? command.innerPath : false,
                next: command.next ? command.next : false,
                multiple: command.multiple ? command.multiple : false,
            });
        } else if(command.translate) {
            overtooning.translate(node, {
                translate: command.translate,
                into: command.into ? command.into : false,
                item: command.item ? command.item : 0
            });
        }
        return node;
    },
    
    translate: function(node, data) {
        if(!node || !data.translate) {
            return false;
        }

        if(!data.translate.join) {
            data.translate = [data.translate];
        }
        if(data.into && !data.into.join) {
            data.into = [data.into];
        }
        //into = check and replace all words, no into = replace into translate[item]
        if(data.into) {
            var nodeValue = overtooning.value(node).split("\n");
            for(var i = data.translate.length -1; i > -1; i--) {
                for(var j = nodeValue.length -1; j > -1; j--) {
                    nodeValue[j] = nodeValue[j].replace(data.translate[i], data.into[i] ? data.into[i] : data.translate[i]);
                }
                console.log(nodeValue);
            }
            console.log(nodeValue.join("\n"));
            overtooning.value(node, nodeValue.join("\n"));
        } else {
            if(!data.item) {
                data.item = 0;
            }
            if(data.translate[data.item]) {
                overtooning.value(node, data.translate[data.item]);
            }
        }
    },
    
    query: function(data) {
        if(data) {
            var query = overtooning.jar.query.shift();
            var feedId = query.feedId;
            overtooning.addLog('[overtooning.cors] Analyzing response.');
            try {data = JSON.parse(data);}
            catch(e) {
                overtooning.addLog('[overtooning.json] Parsing failed.');
                data = {};
            }
            if(!data.overtooning) {
                overtooning.addLog('[overtooning.cors] Data not intented for overtooning.');
                data = {};
            }
            delete data.overtooning;
            overtooning.storage.feed[feedId].lastUpdate = overtooning.MTime();
            //fix local dictionary
            if(data.text && feedId == 0) { //instead of checking against 0, add a feedId template option?
                for(var key in data.text) {
                    if(overtooning.storage.text[key]) {
                        overtooning.storage.text[key] = data.text[key];
                    }
                }
                overtooning.storage.save('text');
            }
            if(data.template && feedId == 0) {
                for(var index = 0; index < data.template.length; index++) {
                    if(data.template[index].html) {
                        for(var path = 0; path < data.template[index].html.length; path++) {
                            //fix simple next value
                            if(data.template[index].html[path].next && !data.template[index].html[path].next.join) {
                                data.template[index].html[path].next = [data.template[index].html[path].next];
                            }
                            
                            //fix short hand brackets in path and innerPath.
                            var newPath = overtooning.openBrackets(data.template[index].html[path].path, data.template[index].html[path].next);
                            if(newPath.next) {
                                if(data.template[index].html[path].next) {
                                    for(var i = 0; i < newPath.next.length; i++) {
                                        data.template[index].html[path].next.push(newPath.next[i]);
                                    }
                                } else {
                                    data.template[index].html[path].next = newPath.next;
                                }
                            }
                            data.template[index].html[path].path = newPath.path;
                            
                            if(data.template[index].html[path].innerPath) {
                                for(var property in data.template[index].html[path].innerPath) {
                                    if(/^(webtoon|chapter)/.test(property)) {
                                        newPath = overtooning.openBrackets(data.template[index].html[path].innerPath[property]);
                                        data.template[index].html[path].innerPath[property] = newPath.path;
                                    }
                                }
                            }
                                                        
                            //fix dictionary data into the template
                            if(data.text && data.template[index].html[path].translate) {
                                if(data.template[index].html[path].translate.join) {
                                    for(var cursor = data.template[index].html[path].translate.length; cursor != 0; cursor--) {
                                        var attribute = data.template[index].html[path].translate[cursor-1];
                                        if(data.text[attribute]) {
                                            data.template[index].html[path].translate[cursor-1] = data.text[attribute];
                                        }
                                    }
                                } else {
                                    var attribute = data.template[index].html[path].translate;
                                    if(data.text[attribute]) {
                                        data.template[index].html[path].translate = data.text[attribute];
                                    }
                                }
                                if(data.template[index].html[path].into) {
                                    if(data.template[index].html[path].into.join) {
                                        for(var cursor = data.template[index].html[path].into.length; cursor != 0; cursor--) {
                                            var attribute = data.template[index].html[path].into[cursor-1];
                                            if(data.text[attribute]) {
                                                data.template[index].html[path].into[cursor-1] = data.text[attribute];
                                            }
                                        }
                                    } else {
                                        var attribute = data.template[index].html[path].into;
                                        if(data.text[attribute]) {
                                            data.template[index].html[path].join = data.text[attribute];
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if(data.template[index].css && data.template[index].css.join) {
                        data.template[index].css = data.template[index].css.join('');
                    }
                }
                overtooning.storage.template = data.template;
                overtooning.storage.save('template');
                delete data.template;
                delete data.text;
            }
            

            if(data.feedName && typeof data.feedName == 'string' && data.feedName.length < 50) {
                overtooning.storage.feed[feedId].name = data.feedName;
                delete data.feedName;
            }
            if(data.feedText && typeof data.feedText == 'string' && data.feedText.length < 256) {
                overtooning.storage.feed[feedId].text = data.feedText;
                delete data.feedText;
            }
            if(data.feedLang && data.feedLang[0]) {
                overtooning.storage.feed[feedId].lang = [];
                for(var i =0; i < data.feedLang.length; i++) {
                    if(typeof data.feedLang[i] == 'string' && data.feedLang[i].length < 20) {
                        overtooning.storage.feed[feedId].lang.push(data.feedLang[i]);
                    }
                }
                delete data.feedLang;
            }

            if(data.add) {
                if(!data.add[0] || !data.add[0].id) {
                    data.add = [data.add];
                }
                
                for(var i = data.add.length -1; i > -1; i--) {
                    if( data.add[i].id && typeof data.add[i].id == 'string' && /^[0-9a-zA-Z_\-]+$/.test(data.add[i].id) &&
                        data.add[i].title && typeof data.add[i].title == 'string' && data.add[i].title.length < 100 &&
                        data.add[i].author && typeof data.add[i].author == 'string' && data.add[i].author.length < 100 &&
                        (data.add[i].blurb ? typeof data.add[i].blurb == 'string' && data.add[i].blurb.length < 500 : true)) {
                        var alreadyInserted = false;
                        for(var j = overtooning.storage.webtoon.length -1; j > -1; j--) {
                            if(overtooning.storage.webtoon[j].wI == data.add[i].id) {
                                alreadyInserted = j;
                                //ask if changes are to be committed!!!!!!!!!
                                if(overtooning.storage.webtoon[j].fL.indexOf(feedId) == -1) {
                                    overtooning.storage.webtoon[j].fL.push(feedId);
                                }
                                break;
                            }
                        }
                        if(alreadyInserted === false) {
                            overtooning.storage.webtoon.push({
                                wI: data.add[i].id,
                                wT: data.add[i].title,
                                wA: data.add[i].author,
                                wB: data.add[i].blurb ? data.add[i].blurb : '',
                                fL: [feedId]
                            });
                        }
                    }
                }
            }
            if(data.remove) {
                if(typeof data.remove != 'object') {
                    data.remove = [data.remove];
                }
                for(var toRemove = data.remove.length-1; toRemove > -1; toRemove--) {
                    for(var i = overtooning.storage.webtoon.length -1; i > -1; i--) {
                        if(overtooning.storage.webtoon[i].wI == data.remove[toRemove]) {
                            var removeFeed = overtooning.storage.webtoon[i].fL.indexOf(feedId);
                            if(removeFeed != -1) {
                                overtooning.storage.webtoon[i].fL.slice(removeFeed,1);
                            }
                            if(overtooning.storage.webtoon[i].fL.length == 0) {
                                if(i == overtooning.jar.internalWebtoonId) {
                                    overtooning.jar.internalWebtoonId = -1;
                                }
                                overtooning.storage.webtoon.slice(i,1);
                            }
                            break;
                        }
                    }
                }
            }
            if(data.add || data.remove) {
                delete data.add;
                delete data.remove;
                overtooning.storage.save('webtoon');
                overtooning.jar.node.routine('webtoonList');
            }

            if(!query.ping && !overtooning.jar.scanlated) { //not just a ping, or no precedence found
                if(data.chapterList) {
                    if(data.chapterList instanceof Array) {
                        if(!overtooning.jar.chapterList) {
                            overtooning.jar.chapterList = data.chapterList;
                        } else { //add only non existing chapters
                            for(var i = data.chapterList.length -1; i > -1; i--) {
                                var alreadyExisting = false;
                                for(var j = overtooning.jar.chapterList.length -1; j > -1; j--) {
                                    if(overtooning.jar.chapterList[j].id == data.chapterList[i].id) {
                                        alreadyExisting = true;
                                        break;
                                    }
                                }
                                if(!alreadyExisting) {
                                    overtooning.jar.chapterList.push(data.chapterList[i]);
                                }
                            }
                        }
                        overtooning.jar.node.routine('chapterList');
                    }
                    delete data.chapterList;
                }

                if(data.raw) {
                    overtooning.forceRaw((data.raw.length && data.raw.length > 1) ? data.raw : null);
                } else if(overtooning.jar.forceRaw) {
                    overtooning.forceRaw();
                }
                if(overtooning.jar.internalWebtoonId != -1 && feedId == overtooning.storage.webtoon[overtooning.jar.internalWebtoonId].fL[0]) {
                    var change = false;
                    if(data.webtoonTitle) {
                        if(data.webtoonTitle == overtooning.jar.node.value('webtoonTitle') || typeof data.webtoonTitle != 'string' || data.webtoonTitle.length > 100) {
                            delete data.webtoonTitle;
                        } else {
                            overtooning.storage.webtoon[overtooning.jar.internalWebtoonId].wT = data.webtoonTitle;
                            change = true;
                        }
                    }
                    if(data.webtoonAuthor) {
                        if(data.webtoonAuthor == overtooning.jar.node.value('webtoonAuthor') || typeof data.webtoonAuthor != 'string' || data.webtoonAuthor.length > 100) {
                            delete data.webtoonAuthor;
                        } else {
                            overtooning.storage.webtoon[overtooning.jar.internalWebtoonId].wA = data.webtoonAuthor;
                            change = true;
                        }
                    }
                    if(data.webtoonBlurb) {
                        if(data.webtoonBlurb == overtooning.jar.node.value('webtoonBlurb') || typeof data.webtoonBlurb != 'string' || data.webtoonBlurb.length > 500) {
                            delete data.webtoonBlurb;
                        } else {
                            overtooning.storage.webtoon[overtooning.jar.internalWebtoonId].wB = data.webtoonBlurb;
                            change = true;
                        }
                    }
                    if(change) {
                        overtooning.addLog('[overtooning.query] Webtoon data changed (id: '+ overtooning.storage.webtoon[overtooning.jar.internalWebtoonId].wI +').');
                        overtooning.storage.save('webtoon');
                    }
                }

                if(data.generalUrl) {
                    overtooning.jar.scanlated = true;
                    overtooning.jar.generalUrl = data.generalUrl;
                    if(overtooning.jar.canvas) {
                        for(var i = overtooning.jar.canvas.length -1; i > -1; i--) {
                            overtooning.jar.canvas[i].loaded = false;
                        }
                    }
                    overtooning.assign.imageList(); //hum...
                    delete data.generalUrl;
                }
                
                for(property in data) {
                    if(typeof data[property] == 'string' && overtooning.jar.node.nodeList[property] && overtooning.jar.node.nodeList[property].length) {
                        overtooning.jar.node.value(property, data[property], property == 'webtoonBlurb' ? true : false);
                    }
                }
                
                if(overtooning.scanlated) {
                     while(overtooning.jar.query.length && !overtooning.jar.query[0].ping) {
                        overtooning.query.shift();
                    }
                }
            }
        overtooning.storage.save('feed');
        }
        if(overtooning.jar.query.length) {
            var j = overtooning.jar.query[0].feedId;
            var queryUrl = overtooning.storage.feed[j].url + '/' + window.location.hostname + '/' +
                (overtooning.jar.node.value('webtoonId') || '0') + '/' +
                (overtooning.jar.node.value('chapterId') || '0') + '.json?' +
                't=' + (overtooning.storage.feed[j].lastUpdate ? Math.abs(overtooning.MTime() - overtooning.storage.feed[j].lastUpdate+1) : 0).toString() +
                (overtooning.storage.config.lang.length ? '&lang='+overtooning.storage.config.lang.join(',') : '');
            overtooning.cors(
                queryUrl, 'GET', '', '',
                function(data) {overtooning.query(data);},
                function(error) {overtooning.addLog('[overtooning.cors] '+error.message); overtooning.jar.query.shift(); overtooning.query();}
            );
        }
    },
    
    forceRaw: function(raw) { //To be deprecated once webtoons.com finishes Cheese in the Trap S3.
        // --------------------- DESKTOP NAVER ------------------------ //
        if(window.location.hostname == 'comic.naver.com') {
            // --------------------- chapter list ------------------------ //
            if(new RegExp('list.nhn$').test(window.location.pathname)) {
                overtooning.jar.run.stylesheet.textContent += '.otoon-virtual {cursor: pointer; display: inline-block; padding: 4px 8px 4px 7px; border: 1px solid #FFF; font: bold 13px Verdana !important; color: black;} .current {cursor: pointer}';
                
                var navNode = overtooning.fetch('#content/div.pagenavigation'),
                    insertChapters = 0,
                    chapterPerPage = 10;
                navNode.textContent = '';
                for(var i = overtooning.jar.chapterList.length -1; i > -1; i--) {
                    if(overtooning.jar.chapterList[i].thumbnail) {
                        insertChapters++;
                    }
                }
                var maxPages = Math.floor(insertChapters / chapterPerPage);
                for(var i = maxPages; i > -1; i--) {
                    navNode.appendChild(overtooning.create('span', {className: 'otoon-virtual', onclick: overtooning.naverEvent.chapterList, textContent: maxPages - i+1}));
                }
                navNode.firstChild.click();
            // --------------------- chapter ------------------------ //
            } else if(new RegExp('detail.nhn$').test(window.location.pathname)) {
                if(raw) {
                    var refNode = overtooning.fetch(overtooning.jar.node.routineList.imageList.args.path),
                        imgNode = false,
                        parentLength = overtooning.jar.node.routineList.imageList.args.next[0].split('/').length;

                    refNode.src = overtooning.jar.pixel + ' ';
                    while(imgNode = overtooning.next(refNode, overtooning.jar.node.routineList.imageList.args.next)) {
                        imgNode = imgNode.node;
                        var upOneLevel = parentLength;
                        while(upOneLevel > 1) {
                            upOneLevel--;
                            imgNode = imgNode.parentNode;
                        }
                        imgNode.parentNode.removeChild(imgNode);
                        overtooning.jar.fetch.node = [];
                    }

                    if(parentLength > 1) {
                        var parentNode = imgNode;
                        while(parentLength > 0) {
                            parentNode = parentNode.parentNode;
                            parentLength--;
                        }
                        parentNode.parentNode.insertBefore(imgNode, parentNode);
                        parentNode.parentNode.removeChild(parentNode);
                    }

                    overtooning.jar.node.routineList.imageList.args.next = ['+img'];

                    if(raw.length > 1) {
                        refNode.removeAttribute('width');
                        refNode.removeAttribute('height');
                        refNode.src = raw[1];
                        if(raw[0] != '' && raw[0] != 'create') {
                            refNode.setAttribute('style', raw[0]);
                        }
                    }
                    for(var i = 2; i < raw.length; i++) {
                        refNode.parentNode.insertBefore(
                            overtooning.create('img', {src: raw[i]}),
                            refNode.nextSibling);
                        refNode = refNode.nextSibling;
                        if(raw[0] != '') {
                            refNode.setAttribute('style', raw[0]);
                        }
                    }
                }
                
                
                overtooning.assign.imageList = overtooning.jar.saveAssignImageList;
                overtooning.jar.saveAssignImageList = null;
                overtooning.runTemplate([overtooning.jar.node.routineList.imageList.args]);

                overtooning.jar.run.stylesheet.textContent += '#comic_before, #comic_after {display: none !important;} .comic_lst .inner_lst {width: auto; overflow: hidden; white-space: nowrap;} .comic_lst .item {float: none; position: static; display: inline-block;} .comic_lst .item a[href="#"] {visibility: hidden;}';
                var comic_move = document.getElementById('comic_move');
                comic_move.textContent = '';
                comic_move.appendChild(overtooning.create('span', {style: 'display: inline-block; width: 0; height: 40px; vertical-align: top; margin-left: -364px;'}));
                for(var i = 0; i < 13; i++) {
                    comic_move.appendChild(
                        overtooning.create('div', {className: 'item'},
                            overtooning.create('a', {href: '#', onclick: overtooning.naverEvent.loadHashLink},
                                overtooning.create('span', {className: 'thmb'},
                                    overtooning.create('img', {width: 70, height: 42, src: overtooning.jar.pixel})
                                ),
                                overtooning.create('span', {className: 'subj', textContent: ' '})
                            )
                        )
                    );
                }
                var comic_before = document.getElementById('comic_before');
                elClone = comic_before.cloneNode(true);
                elClone.setAttribute('id', 'otoon_before');
                elClone.onclick = overtooning.naverEvent.comicMoveLeft;
                comic_before.parentNode.insertBefore(elClone, comic_before);
                
                var comic_after = document.getElementById('comic_after');
                elClone = comic_after.cloneNode(true);
                elClone.setAttribute('id', 'otoon_after');
                elClone.onclick = overtooning.naverEvent.comicMoveRight;
                comic_after.parentNode.insertBefore(elClone, comic_after);

                var chapterId = parseInt(overtooning.jar.node.value('chapterId'));
                overtooning.naverEvent.displayComicMove(chapterId);
                
                var index = -1;
                for(var i = 0; i < overtooning.jar.chapterList.length; i++) {
                    if(overtooning.jar.chapterList[i].id == chapterId) {
                        index = i;
                        break;
                    }
                }
                
                var navURL = {
                    first: '?titleId=' + overtooning.jar.node.value('webtoonId') + '&no=1#otoon=' + overtooning.jar.chapterList[0].id,
                    last: '?titleId=' + overtooning.jar.node.value('webtoonId') + '&no=1#otoon=' + overtooning.jar.chapterList[overtooning.jar.chapterList.length -1].id,
                    previous: index > 0 ? '?titleId=' + overtooning.jar.node.value('webtoonId') + '&no=1#otoon=' + overtooning.jar.chapterList[index -1].id : false,
                    next: index < overtooning.jar.chapterList.length -1 ? '?titleId=' + overtooning.jar.node.value('webtoonId') + '&no=1#otoon=' + overtooning.jar.chapterList[index +1].id : false
                };

               
                var navBarNode = overtooning.fetch('#content/div/div.tit_area/div/div'),
                    remoconNode = overtooning.fetch('#comicRemocon/div.remote_cont/div'),
                    quickNavNode = document.getElementById('comicSequence').parentNode;

                navBarNode.textContent = '';
                if(remoconNode) {
                    remoconNode.textContent = '';
                }
                remoconNode.textContent = '';
                quickNavNode.textContent = '';
                
                quickNavNode.appendChild(overtooning.create('input', {id: 'comicSequence', type: 'text', style: 'width: 31px;', value: index+1, onclick: function() {this.focus(); return false;}}));
                quickNavNode.appendChild(overtooning.create('span', {textContent: ' / '}));
                quickNavNode.appendChild(overtooning.create('span', {className: 'total', textContent: overtooning.jar.chapterList.length}));
                quickNavNode.appendChild(overtooning.create('a', {className: 'btn_move', textContent: 'go!', onclick: function() {
                    var goTo = parseInt(document.getElementById('comicSequence').value) -1;
                    if(goTo > -1 && goTo < overtooning.jar.chapterList.length) {
                        window.location = '?titleId=' + overtooning.jar.node.value('webtoonId') + '&no=1#otoon=' + overtooning.jar.chapterList[goTo].id;
                        window.location.reload();
                    }
                }}));
                  
                if(navURL.previous) {
                    navBarNode.appendChild(
                        overtooning.create('span', {className: 'pre'},
                            overtooning.create('a', {textContent: 'Prev', href: navURL.previous, onclick: overtooning.naverEvent.loadHashLink})
                        )
                    );
                    if(remoconNode) {
                        remoconNode.appendChild(overtooning.create('a', {className: 'btn_prev_end', textContent: 'first', href: navURL.first, onclick: overtooning.naverEvent.loadHashLink}));
                        remoconNode.appendChild(overtooning.create('a', {className: 'btn_prev', textContent: 'prev', href: navURL.previous, onclick: overtooning.naverEvent.loadHashLink}));
                    }
                } else {
                    if(remoconNode) {
                        remoconNode.appendChild(overtooning.create('span', {className: 'btn_prev_end dim', textContent: 'first'}));
                        remoconNode.appendChild(overtooning.create('span', {className: 'btn_prev dim', textContent: 'prev'}));
                    }
                }
                if(navURL.next) {
                    if(navURL.previous) {
                        navBarNode.appendChild( overtooning.create('span', {className: 'bar', textContent: '|'}));
                    }
                    navBarNode.appendChild(
                        overtooning.create('span', {className: 'next'},
                            overtooning.create('a', {textContent: 'Next', href: navURL.next, onclick: overtooning.naverEvent.loadHashLink})
                        )
                    );
                    if(remoconNode) {
                        remoconNode.appendChild(overtooning.create('a', {className: 'btn_next', textContent: 'next', href: navURL.next, onclick: overtooning.naverEvent.loadHashLink}));
                        remoconNode.appendChild(overtooning.create('a', {className: 'btn_next_end', textContent: 'last', href: navURL.last, onclick: overtooning.naverEvent.loadHashLink}));
                    }
                } else {
                    if(remoconNode) {
                        remoconNode.appendChild(overtooning.create('span', {className: 'btn_next dim', textContent: 'next'}));
                        remoconNode.appendChild(overtooning.create('span', {className: 'btn_next_end dim', textContent: 'last'}));
                    }
                }
            }
        } else if(window.location.hostname == 'm.comic.naver.com') {
            // --------------------- chapter list ------------------------ //
            if(new RegExp('list.nhn$').test(window.location.pathname)) {
                var adNode = overtooning.fetch('#form/div.toon_notice');
                if(adNode) {
                    adNode.parentNode.removeChild(adNode);
                }
                var navNode = document.getElementById('pageList'),
                    linkName = window.location.pathname.replace('list.nhn', 'detail.nhn?no=1&titleId='+overtooning.jar.node.value('webtoonId')+'#otoon=');
                navNode.textContent = '';
                for(var i = overtooning.jar.chapterList.length -1; i > -1; i--) {
                    navNode.appendChild(
                        overtooning.create('li', {},
                            overtooning.create('div', {className: 'lst'},
                                overtooning.create('a', {href: linkName + overtooning.jar.chapterList[i].id},
                                    overtooning.create('span', {className: 'im_br'},
                                        overtooning.create('span', {className: 'im_inbr'},
                                            overtooning.create('img', {width: 71, height: 42, src: overtooning.jar.chapterList[i].thumbnail})
                                        )
                                    ),
                                    overtooning.create('div', {className: 'toon_info'},
                                        overtooning.create('h4', {},
                                            overtooning.create('span', {className: 'toon_name'},
                                                overtooning.create('strong', {},
                                                    overtooning.create('span', {textContent: overtooning.jar.chapterList[i].title})
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    );
                }
            // --------------------- chapter ------------------------ //
            } else if(new RegExp('detail.nhn$').test(window.location.pathname)) {
                if(raw) {
                    var refNode = overtooning.fetch(overtooning.jar.node.routineList.imageList.args.path),
                        imgNode = false,
                        parentLength = overtooning.jar.node.routineList.imageList.args.next[0].split('/').length;
                    refNode.src = overtooning.jar.pixel + ' ';
                    while(imgNode = overtooning.next(refNode, overtooning.jar.node.routineList.imageList.args.next)) {
                        imgNode = imgNode.node;
                        var upOneLevel = parentLength;
                        while(upOneLevel > 2) {
                            upOneLevel--;
                            imgNode = imgNode.parentNode;
                        }
                        imgNode.parentNode.removeChild(imgNode);
                        overtooning.jar.fetch.node = [];
                    }
                    if(parentLength > 2) {
                        var parentNode = refNode;
                        while(parentLength > 1) {
                            parentNode = parentNode.parentNode;
                            parentLength--;
                        }
                        parentNode.parentNode.insertBefore(refNode, parentNode);
                        parentNode.parentNode.removeChild(parentNode);
                    }
                    overtooning.jar.node.routineList.imageList.args.next = ['+img'];

                    if(raw.length > 2) {
                        refNode.removeAttribute('width');
                        refNode.removeAttribute('height');
                        refNode.src = raw[1];
                        if(raw[0] != '') {
                            refNode.setAttribute('style', raw[0]);
                        }
                    }
                    for(var i = 2; i < raw.length; i++) {
                        refNode.parentNode.insertBefore(
                            overtooning.create('img', {src: raw[i]}),
                            refNode.nextSibling);
                        refNode = refNode.nextSibling;
                        if(raw[0] != '') {
                            refNode.setAttribute('style', raw[0]);
                        }
                    }
                }

                overtooning.assign.imageList = overtooning.jar.saveAssignImageList;
                overtooning.jar.saveAssignImageList = null;
                overtooning.runTemplate([overtooning.jar.node.routineList.imageList.args]);
                
                var navNode = overtooning.fetch('#spiLayer1/+div/p'),
                    chapterId = overtooning.jar.node.value('chapterId'),
                    chapterIndex = -1;
                
                navNode.textContent = '';
                for(var i = 0; i < overtooning.jar.chapterList.length; i++) {
                    if(overtooning.jar.chapterList[i].id == chapterId) {
                        chapterIndex = i;
                        break;
                    }
                }
                
                var navURL = {
                    previous: chapterIndex > 0 ? '?titleId=' + overtooning.jar.node.value('webtoonId') + '&no=1#otoon=' + overtooning.jar.chapterList[chapterIndex -1].id : false,
                    next: chapterIndex < overtooning.jar.chapterList.length -1 ? '?titleId=' + overtooning.jar.node.value('webtoonId') + '&no=1#otoon=' + overtooning.jar.chapterList[chapterIndex +1].id : false
                };
                
                var classNav = (navURL.previous && navURL.next) ? 'w33' : 'w50';
                if(navURL.previous) {
                    navNode.appendChild(overtooning.create('a', {className: classNav, href: navURL.previous, onclick: overtooning.naverEvent.loadHashLink},
                        overtooning.create('span', {className: 'pv', textContent: 'Previous'})
                    ));
                }
                if(navURL.next) {
                    navNode.appendChild(overtooning.create('a', {className: classNav, href: navURL.next, onclick: overtooning.naverEvent.loadHashLink},
                        overtooning.create('span', {className: 'nx', textContent: 'Next'})
                    ));
                }
                navNode.appendChild(overtooning.create('a', {className: classNav, href: 'list.nhn?titleId=' + overtooning.jar.node.value('webtoonId'), textContent: 'List'}));
            }
        }
    },

    naverEvent: { //To be deprecated once webtoons.com finishes Cheese in the Trap S3.
        loadHashLink: function() {
            window.location = this.href;
            window.location.reload();
        },
        
        chapterList: function() {
            var currentNode = overtooning.fetch('#content/div.pagenavigation/span.current');
            if(currentNode) {
                    currentNode.className = 'otoon-virtual';
            }
            this.className = 'otoon-virtual current';
            var modifyHTML = overtooning.fetch('#content/table/tbody');
            if(modifyHTML) {
                modifyHTML.innerHTML = '';
                var offset = (parseInt(this.textContent) -1) * 10,
                    i = overtooning.jar.chapterList.length -1;
                while(offset > 0) {
                    if(overtooning.jar.chapterList[i].thumbnail) {
                        offset--;
                    }
                    i--;
                }
                offset = 10;
                var linkName = window.location.pathname.replace('list.nhn', 'detail.nhn?no=1&titleId='+overtooning.jar.node.value('webtoonId')+'#otoon=');
                while(offset > 0 && i > -1) {
                    if(overtooning.jar.chapterList[i].thumbnail) {
                        offset--;
                        modifyHTML.appendChild(overtooning.create('tr', {},
                                overtooning.create('td', {}, overtooning.create('img', {src: overtooning.jar.chapterList[i].thumbnail, alt: overtooning.jar.chapterList[i].title, title: overtooning.jar.chapterList[i].title, height: 41, width: 71})),
                                overtooning.create('td', {className: 'title'},
                                    overtooning.create('a', {
                                            href: linkName + overtooning.jar.chapterList[i].id,
                                            textContent: overtooning.jar.chapterList[i].title})),
                                overtooning.create('td', {}),
                                overtooning.create('td', {})
                        ));
                    }
                    i--;
                }
            }
            
        },
        
        displayComicMove: function(chapterId) {
            if(overtooning.jar.chapterList) {
                var index = -1;
                for(var i = 0; i < overtooning.jar.chapterList.length; i++) {
                    if(overtooning.jar.chapterList[i].id == chapterId) {
                        index = i;
                        break;
                    }
                }
                if(index != -1) {
                    var node = overtooning.fetch('#comic_move/div/a');
                    for(var j = -6; j < 7; j++) {
                        if(index + j > -1 && index+ j < overtooning.jar.chapterList.length) {
                            node.href = '?titleId=' + overtooning.jar.node.value('webtoonId') + '&no=1#otoon=' + overtooning.jar.chapterList[index+j].id;
                            node.className = (overtooning.jar.chapterList[index+j].id == parseInt(overtooning.jar.node.value('chapterId'))) ? 'on' : '';
                            node.firstChild.firstChild.src = overtooning.jar.chapterList[index+j].thumbnail;
                            node.lastChild.textContent = overtooning.jar.chapterList[index+j].title;
                        } else {
                            node.href = '#';
                        }
                        node = overtooning.fetch('^1/+div/a', node, true)
                    }

                    document.getElementById('otoon_before').setAttribute('style', index -3 > 0 ? 'visibility: visible;' : 'visibility: hidden;');
                    document.getElementById('otoon_after').setAttribute('style', index +3 >= overtooning.jar.chapterList.length ? 'visibility: hidden;' : 'visibility: visible;');
                }
            }
        },
        
        comicMoveLeft: function() {
            if(overtooning.jar.chapterList) {
                var chapterId = parseInt(document.getElementById('comic_move').childNodes[7].firstChild.href.split('=').pop());
                var index = -1;
                for(var i = 0; i < overtooning.jar.chapterList.length; i++) {
                    if(overtooning.jar.chapterList[i].id == chapterId) {
                        index = i;
                        break;
                    }
                }
                console.log(index);
                if(index != -1) {
                    var moveLeft = index - 3 > -1 ? 3 : index;
                    console.log(index-moveLeft);
                    overtooning.naverEvent.displayComicMove(overtooning.jar.chapterList[index-moveLeft].id);
                }
            }
            return false;
        },
        comicMoveRight: function() {
            if(overtooning.jar.chapterList) {
                var chapterId = parseInt(document.getElementById('comic_move').childNodes[7].firstChild.href.split('=').pop());
                var index = -1;
                for(var i = 0; i < overtooning.jar.chapterList.length; i++) {
                    if(overtooning.jar.chapterList[i].id == chapterId) {
                        index = i;
                        break;
                    }
                }
                console.log(index);
                if(index != -1) {
                    var moveRight = index + 3 <  overtooning.jar.chapterList.length ? 3 : overtooning.jar.chapterList.length - index;
                    console.log(index+moveRight);
                    overtooning.naverEvent.displayComicMove(overtooning.jar.chapterList[index+moveRight].id);
                }
            }
            return false;
        },
    },

    openBrackets: function(path, next) {
        var bracket;
        while((bracket = path.lastIndexOf('[')) != -1) {
            var length = path.length;
            if(bracket < length -1) { //superfluous, but oh well.
                if(path[bracket+1] != ']') {
                    var repeat = 0, pad = 0;
                    while(bracket + 1 + pad < length && path[bracket+1+pad].match(/^[0-9]$/)) {
                        repeat = repeat * 10 + parseInt(path[bracket+1+pad]);
                        pad++;
                    }
                    var element = path.substr(0, bracket);
                    element = element.substr(element.lastIndexOf('/') +1).replace(/#[a-zA-Z0-9_\-]+/, '');
                    var step = '+';
                    if(element[0].match(/^[~+^-]$/)){
                        switch(element[0]) {
                            case '~':
                            case '-':
                            step = '-';
                            default:
                            element = element.substr(1);
                        }
                    }
                    step = '/' + step + element;
                    // step.repeat(repeat-1) not compatible with safari and old version of browsers.
                    path = path.substr(0, bracket) + Array(repeat).join(step) + path.substr(bracket+2+pad); //replace [number]
                } else {
                    if(!next) {
                        next = [];
                    }
                    path = path.substr(0, bracket) + path.substr(bracket+2); //delete []
                    var element = path.substr(path.lastIndexOf('/', bracket-1) +1).replace(/#[a-zA-Z0-9_\-]+/, '');
                    var parentNumber = element.match(/\/[^+\-]/g); //MISSING: discount ^ parents.
                    if(!parentNumber && element[0].match(/^[~+^-]$/)) {
                        element = element.substr(1);
                    }
                    next.push( (parentNumber ? '^' + parentNumber.length + '/' : '') + '+' + element);
                }
            }
        }
        return {path: path, next: next};
    },
    
    getBaseCss: function() {
        return '#otoon-console {'+
            'position: absolute;'+
            'top: 0; left: 0;'+
            'padding: 2em;'+
            'box-sizing: border-box;'+
            'background: rgba(0, 0, 0, 0.5);'+
            'width: 100%; min-height: 100%;'+
            'z-index: 99999;'+
            'text-align: left;'+
        '}' +
        '#otoon-console .otoon-row {'+
            'background: white;'+
        '}' +
        '.otoon-col {'+
            'padding: 1.5em;'+
        '}'+
        '.otoon-row .otoon-row {'+
            'margin: 0 -1.5em;'+
        '}'+
        '.otoon-button, #otoon-console a:hover, .otoon-option {'+
            'cursor: pointer;'+
            'color: white;'+
            'text-shadow: 1px 1px 1px black, 1px -1px 1px black, -1px 1px 1px black, -1px -1px 1px black;'+
        '}'+
        '.otoon-overlay:not(.hidden) + img, .otoon-hidden {'+
            'display: none !important;'+
        '}'+
        '.otoon-overlay {'+
            'position: relative;'+
        '}'+
        '.otoon-overlay canvas {'+
            'max-width: 100%; max-height: 100%; display: block; margin: 0 auto;'+
        '}'+
        '.otoon-col.otoon-info {'+
            'padding: 0 1.5em 1em 1.5em;'+
            'font-style: italic;'+
        '}'+
        '.otoon-button:not(:hover):not(.otoon-active), .otoon-toggler:not(:checked) + .otoon-option:not(:hover):not(.otoon-active) {'+
            'color: black;'+
            'background: white !important;'+
            'text-shadow: 0 0 0 black;'+
        '}'+
        '.otoon-row .otoon-close {'+
            'background: #F36858;'+
            'padding: 0.5em;'+
            'width: 10%;'+
            'text-align: right;'+
        '}'+
        '.otoon-row .otoon-no {'+
            'background: #F36858;'+
        '}'+
        '.otoon-yes, .otoon-no {'+
            'display: inline-block; width: 50%; height: 100%; text-align: center; line-height: 2em;'+
        '}'+
        '.otoon-col.otoon-option-value {'+
            'padding: 1.5em 1.5em 0.5em 1.5em;'+
        '}'+
        '.otoon-row .otoon-general {'+
            'background: #51A2E5;'+
        '}'+
        '.otoon-row .otoon-feed {'+
            'background: #01C685;'+
        '}'+
        '.otoon-row .otoon-webtoon, .otoon-row .otoon-yes {'+
            'background: #8DD630;'+
        '}'+
        '.otoon-row .otoon-log {'+
            'background: #9B8AEF;'+
        '}'+
        '.otoon-row .otoon-logo {'+
            'background: #BEBFA4;'+
            'width: 90%;'+
            'padding: 0.5em;'+
        '}'+
        '.otoon-row .otoon-rough {'+
            'background: #E68323;'+
        '}'+
        '.otoon-row .otoon-template {'+
            'background: #F4C41F;'+
        '}'+
        '.otoon-menu {'+
            'text-align: center;'+
        '}'+
        '@media screen and (min-width:20em) {'+
            '.otoon-menu .otoon-col {width: 50%;}'+
            '.otoon-col.otoon-option-name, .otoon-col.otoon-option-value {width: 50%;}'+
        '}'+
        '@media screen and (min-width:30em) {'+
            '.otoon-menu .otoon-col {width: 33.332%;}'+
        '}'+
        '@media screen and (min-width:60em) {'+
            '.otoon-menu .otoon-col {width: 16.666%;}'+
        '}'+
        '@media only screen {'+
            '.otoon-col {'+
                'display: inline-block;'+
                'overflow: hidden;'+
                'width: 100%;'+
                'box-sizing: border-box;'+
                'vertical-align:top;'+
            '}'+
        '}';  
    },
    
    addLog: function(stringLog) {
        if(console) console.log(stringLog);
        this.jar.log.push(stringLog);
    },
 
    value: function(element, setValue, multiline) { //revamp: treewalker for textnodes?
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
        if(setValue && !element.nodeValue) {
            element.textContent = ' ';
        }
        if(!element.nodeValue && element.firstChild) {
            element = element.firstChild;
        }
        if(!element.nodeValue) {
            return false;
        }
        if(setValue) {
            if(multiline) {
                setValue = setValue.split("\n");
                element.nodeValue = setValue[0];
                for(var count = setValue.length -1; count > 0; count--) {
                    element.parentNode.insertBefore(this.create(setValue[count]), element.nextSibling);
                    element.parentNode.insertBefore(this.create('br', {}), element.nextSibling);
                }
            } else {
                element.nodeValue = setValue;
            }
        }
        return element.nodeValue;
    },
    
    digit: function (number, width, filler) {
        filler = filler || '0';
        number = number + '';
        return number.length >= width ? number : new Array(width - number.length + 1).join(filler) + number;
    },

    fetch: function (path, node, nolog) {
        if(!path) {
            this.addLog('[overtooning.fetch] no path');
            return false;
        } else if (typeof path == 'string') { //first iteration of that path.
            if(!node) {
                if(path.substr(0, 5) == 'head/') { //AH!
                    node = document.head;
                    path = path.substr(5);
                } else {
                    node = document.body;
                }
            }
            path = {tag: path.substr(Math.max(0, path.indexOf('#'))).split('/'), current: 0};
            if(this.jar.fetch.node[0] && this.jar.fetch.node[0] === node) { //same source node
                while(this.jar.fetch.name[path.current+1] && path.tag[path.current] && this.jar.fetch.name[path.current+1] == path.tag[path.current]) {
                    path.current++;
                    node = this.jar.fetch.node[path.current];
                }
                if(path.current == path.tag.length) { //same node searched in the end.
                    return node;
                }
                this.jar.fetch.node = this.jar.fetch.node.slice(0, path.current+2);
                this.jar.fetch.name = this.jar.fetch.name.slice(0, path.current+2);
            } else {
                this.jar.fetch = {node: [node], name: ['sourceNode']};
            }
        }
        if(path.tag[path.current] == '') { //should not be necessary anymore
            return node && node.firstChild ? node.firstChild : false;
        } else {
            // 1 is #nodeID or tagName, 2 is .className (or attributeName=value), 3 is attribute to return
            var pathData = /^((?:#|~|\+|-|\^)?(?:[a-z0-9A-Z_-]*))?((?:\.[a-zA-Z0-9 _-]+(?:=[a-zA-Z0-9 _-]+)?)*)?(@[a-zA-Z0-9_-]+(?:\?(?:=[a-zA-Z_-]+|[pn]-?[0-9]+))?)?$/.exec(path.tag[path.current]);
            //console.log(pathData.toString());
            if(!pathData[1] && !pathData[2]) {
                this.addLog('[overtooning.fetch] Malformed request ' + path.tag[path.current]);
                return false
            }
            
            if(pathData[1] && pathData[1][0] == '#') {
                if(pathData[1].length < 2) {
                    this.addLog('[overtooning.fetch] Illegal ID # at ' + path.tag[path.current]);
                    return false
                }
                node = document.getElementById(pathData[1].substr(1));
            } else {
                var movingProperty = 'nextSibling', compare = [];
                if(pathData[1]) {
                    var slash = true;
                    switch(pathData[1][0]) {
                        case '~':
                        movingProperty = 'previousSibling';
                        node = node.lastChild;
                        break;
                        case '+':
                        node = node.nextSibling;
                        break;
                        case '-':
                        movingProperty = 'previousSibling';
                        node = node.previousSibling;
                        break;
                        case '^':
                        movingProperty = 'parentNode';
                        node = node.parentNode;
                        break;
                        default:
                        node = node.firstChild;
                        slash = false;
                    }
                    if(slash) {
                        pathData[1] = pathData[1].substr(1);
                    }
                    if(pathData[1].length > 0) { //nodeName
                        var attribute = 'nodeName';
                        if(pathData[1].match(/^[0-9]+$/)) {
                            attribute = 'increment';
                            pathData[1] = parseInt(pathData[1]) -1;
                        } else if(pathData[1] == '_text') {
                            pathData[2] = null;
                            pathData[3] = null;
                            pathData[1] = '#text';
                        }
                        compare.push({attribute: attribute, value: pathData[1]});
                    }
                } else {
                    node = node.firstChild;
                }
                if(pathData[2]) { //attributes
                    pathData[2] = pathData[2].substr(1).split('.');
                    var tmp;
                    for(var cursor = pathData[2].length -1; cursor > -1; cursor--) {
                        tmp = pathData[2][cursor].split('=');
                        if(tmp[1]) {
                            compare.push({attribute: tmp[0], value: tmp[1]});
                        } else {
                            compare.push({attribute: 'className', value: tmp[0]});
                        }
                    }
                }
                if(compare.length == 0) {
                    this.addLog('[overtooning.fetch] No qualifier at ' + path.tag[path.current]);
                    return false
                }
               
                var found = false;
                while(node && !found) {
                    found = true;
                    for(var cursor = compare.length -1; cursor > -1; cursor --) {
                        switch(compare[cursor].attribute) {
                            case 'increment':
                            found = compare[cursor].value-- <= 0;
                            break;
                            case 'nodeName':
                            found = node.nodeName.toLowerCase() == compare[cursor].value; 
                            break;
                            case 'className':
                            found = node.className ? this.compareClassName(compare[cursor].value, node.className) : false;
                            break;
                            default:
                            found = node.getAttribute(compare[cursor].attribute) == compare[cursor].value;
                        }
                        if(!found) {
                            node = node[movingProperty];
                            break;
                        }
                    }
                }
            }
            if(!node) {
                if(!nolog) {
                    this.addLog('[overtooning.fetch] Node not found ' + path.tag.join('/') + '(' + path.current + ') : ' + path.tag[path.current]);
                }
                return false
            }
            path.current++;
            this.jar.fetch.node[path.current] = node;
            this.jar.fetch.name[path.current] = path.tag[path.current-1];
            if(pathData[3]) {//force return attribute
                var attribute = pathData[3].substr(1).split('?');
                if(node.attributes && typeof node.attributes[attribute[0]] != 'undefined' && node.attributes[attribute[0]].nodeName == attribute[0]) {
                    node = node.attributes[attribute[0]];
                } else {
                   return false;
                }
                //node = node.getAttributeNode(attribute[0]);
                if(!attribute[1]) {
                    return node;
                }
                node = node.value;
                //filter function
                switch(attribute[1][0]) {
                    case '=': //query filter
                    node = node.match(new RegExp(attribute[1].substr(1) + "=([^&]+)", ''));
                    attribute[1] = '=1';
                    break;
                    case 'p': //path filter
                    node = node.split('/');
                    break;
                    case 'n': //number filter
                    node = node.match(/-?[0-9]+/g);
                    break;
                }
                if(!node) return false;
                attribute[1] = attribute[1].substr(1);
                var cursor = parseInt(attribute[1], 10) % node.length;
                if(cursor < 0) {
                    cursor += node.length;
                }
                return overtooning.create(node[cursor]);
            }
            return (path.current < path.tag.length) ? this.fetch(path, node, nolog? true : false) : node;
        }   
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
                    } else if (",style,accesskey,id,name,src,href,for,value,".indexOf("," + b.toLowerCase()) != -1) {
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
            overtooning.addLog('[overtooning.cors] ' + url);
            if(req.withCredentials !== undefined) {
                req.open(method, url, true);
                req.responseType = type;
                req.onerror = errback;
                req.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            callback(this.responseType == '' ? this.responseText : this.response);
                        } else {
                        overtooning.addLog('[overtooning.cors] Response returned with non-OK status');
                        if(errback) errback({message: '[overtooning.cors] Response returned with non-OK status'});
                        }
                    }
                };
                req.send(/*data*/);
            }
        } else {
            overtooning.addLog('[overtooning.cors] XmlHTTPRequest 2 not fully supported');
            if(errback) errback({message: '[overtooning.cors] XmlHTTPRequest 2 not fully supported'});
        }
    },
  
    MTime: function() {
        return Math.round(new Date().getTime() / 1000 / 60);
    }
}

overtooning.run();
