
Deferred.define();
Deferred.prototype._fire = function (okng, value) {
    var next = "ok";
    try {
        value = this.callback[okng].call(this, value);
    } catch (e) {
        next  = "ng";
        if (Deferred.debug) console.error(e);
        value = e;
    }
    if (value instanceof Deferred) {
        value._next = this._next;
    } else {
        if (this._next) this._next._fire(next, value);
    }
    return this;
}

var p = function() {
    console.log(Array.prototype.slice.call(arguments, 0));
}

var is = function(a, b, mes) {
    equals(a.toString(), b.toString(), mes);
}

function mockAjax(opts) {
    if (opts.url.indexOf('http') == 0) {
        var orig_url = opts.url;
        var url = URI.parse(opts.url);
        opts.url = '/tests/data/' + url.schema + '/' + url.host + url.path + escape(url.search).replace(/%/g, '_');
        // console.log([opts.url, '<-', orig_url].join(' '));
    }
    return opts;
}

var orig_ajax = $.ajax; $.ajax = function (opts) {
    opts = mockAjax(opts);
    return orig_ajax(opts);
}

var Bookmark = Model.Bookmark, Tag = Model.Tag;

Deferred.test = function(name, t, count, wait) {
    var d = new Deferred();
    var search = location.search;
    var func = function() {
        setTimeout(function() {
            var setupDeferred = new Deferred(), teardownDeferred = new Deferred();
            var setup = Deferred.test.setup, teardown = Deferred.test.teardown;
            setupDeferred.next(function() {
                next(function() {
                    var args = [name, function() {
                        stop(wait || 3000);
                        try {
                            t(teardownDeferred);
                        } catch(e) {
                            ok(false, 'test error: ' + e.toString());
                            teardownDeferred.call();
                        }
                    }];
                    if (count) args.push(count)
                    test.apply(test, args);
                });//, 0);
                return teardownDeferred;
            }).next(function() {
                teardown(d);
            });
            setup(setupDeferred);
        }, 0);
    }
    if (search.indexOf('?') == 0) {
        if (decodeURIComponent(search.substring(1)) != name) {
            setTimeout(function() {
                d.call();
            }, 0);
        } else {
            func();
        }
    } else {
        func();
    }
    return d;
};

// var i = 0;
Deferred.test.setup = function(d) {
//    console.log('setup' + (++i));
    Timer.__defineGetter__('now', function() { return (new Date).getTime() });
    d.call();
};

Deferred.test.teardown = function(d) {
    start(); // XXX
//    console.log('teardown' + i);
    d.call();
};

Deferred.prototype.method = function(name) {
    return d[name]();
};

Deferred.register('test', Deferred.test);

var Database = Deferred.WebDatabase;
var Model = Database.Model, SQL = Database.SQL;

Deferred.
test("uri", function(d) {
    var hatena = 'http://www.hatena.ne.jp/foobar?query=foo#hash=bar';
    var u = URI.parse(hatena);
    equals(u.search, '?query=foo');
    equals(u.hash, '#hash=bar');
    equals(u.schema, 'http');
    ok(!u.isHTTPS, 'is not HTTPS');
    equals(u.port, '');
    equals(u.host, 'www.hatena.ne.jp');
    equals(u.path, '/foobar');
    equals(u.href, hatena);
    equals(u.path_query, '/foobar?query=foo');
    equals(u.encodeURI, encodeURIComponent(hatena));
    equals(u.entryURL, B_HTTP + 'entry/www.hatena.ne.jp/foobar?query=foo%23hash=bar');

    hatena = 'https://www.hatena.ne.jp/';
    u = URI.parse(hatena);
    equals(u.search, '');
    equals(u.hash, '');
    equals(u.schema, 'https');
    ok(u.isHTTPS, 'isHTTPS');
    equals(u.port, '');
    equals(u.host, 'www.hatena.ne.jp');
    equals(u.path, '/');
    equals(u.href, hatena);
    equals(u.path_query, '/');
    equals(u.encodeURI, encodeURIComponent(hatena));
    equals(u.entryURL, B_HTTP + 'entry/s/www.hatena.ne.jp/');

    hatena = 'http://www.hatena.ne.jp/foobar?query1=foo%23&query2=bar#test';
    u = URI.parse(hatena);
    equals(u.param('query1'), 'foo#');
    equals(u.param('query2'), 'bar');
    u.param({query2: 'bar2'});
    equals(u.param('query2'), 'bar2');
    u.param({
        query1: 'bar#',
        query2: null,
    });
    equals(u.param('query1'), 'bar#');
    equals(u.param('query2'), null);
    equals(u.search, '?query1=bar%23');
    u.param({query3: 'baz'});
    equals(u.search, '?query1=bar%23&query3=baz');
    var uriqueryundef;
    u.param({
        query1: uriqueryundef,
        query2: null,
        query3: null,
    });
    equals(u.search, '');

    d.call();
}, 30, 1000).

test("timer", function(d){
    var t = Timer.create(10, 5); // 10ms, 5times
    var i = 0;
    t.bind('timer', function(ev, c) {
        equals(c, ++i);
    });
    t.bind('timerComplete', function(ev, c) {
        equals(c, 5);
        d.call();
    });
    t.start();
}, 6, 1000).

test("timer stop", function(d){
    var t = Timer.create(10, 5); // 10ms, 5times
    var i = 0;
    t.bind('timer', function(ev, c) {
        equals(c, ++i);
        if (c == 3) t.stop();
    });
    t.bind('timerComplete', function(ev, c) {
        ok(false, 'not call this');
    });
    setTimeout(function() { d.call() }, 500);
    t.start();
}, 3, 1000).

test('ExpireCache', function(d) {
    ExpireCache.clearAllCaches();
    var cache = new ExpireCache('testcache' + (new Date-0));
    ok(cache.get('foo') == null );
    cache.set('foo', 'bar');
    equals(cache.get('foo'), 'bar');
    cache.set('foo1', 'baz1');
    equals(cache.get('foo1'), 'baz1');
    cache.clear('foo1');
    ok(cache.get('foo1') == null, 'cache clear');
    cache.clearAll();
    ok(cache.get('foo') == null, 'cache clear all');

    var cache2 = new ExpireCache('testcache1' + (new Date-0), 60, 'JSON');
    var data = {foo: 'bar'};
    cache2.set('data', data);
    equals(cache2.get('data').foo, 'bar', 'serialize json');

    cache = new ExpireCache('testcache2' + (new Date-0), 0.01); // 10ms cache
    cache.set('foo1', 'bar');
    equals(cache.get('foo1'), 'bar');
    wait(0.2).next(function() {
        ok(cache.get('foo1') == null, 'cache expired');
        d.call();
    });
}, 8, 3000).

test('HTTPCache', function(d) {
    ExpireCache.clearAllCaches();
    var cache = new HTTPCache('test');
    var url = 'http://b.hatena.ne.jp/index.html';
    var r_tmp;
    cache.get(url).next(function(res) {
        ok(res, 'get cache1');
        return res.toString();
    }).next(function(res1) {
        ok(cache.has(url), 'has cache');
        cache.get(url).next(function(res) {
            ok(res, 'get cache2');
            is(res, res1, 'eq cache');
            cache.clearAll();
            ok(!cache.has(url), 'cache clear all');
        });
    }).next(function() {
        d.call();
    });
}, 5, 3000).

test('HTTPCache(s)', function(d) {
    var url = 'http://b.hatena.ne.jp/index.html';
    ExpireCache.clearAllCaches();
    Deferred.parallel([
        HTTPCache.counter.get('https://www.hatena.ne.jp/').next(function(r) {
            ok(r == null, 'counter cache null');
        }),
        HTTPCache.counter.get(url).next(function(r) {
            ok(r, 'counter cache');
            ok(r >= 1, 'counter cache');
        }),
        HTTPCache.comment.get(url).next(function(r) {
            ok(r, 'comment cache');
            ok(r.count >= 1, 'comment cache count');
        }),
        HTTPCache.entry.get(url).next(function(r) {
            ok(r, 'entry cache');
        })
    ]).next(function() { return Deferred.parallel([
        HTTPCache.counter.get('https://www.hatena.ne.jp/').next(function(r) {
            ok(r == null, '2: counter cache null');
        }),
        HTTPCache.counter.get(url).next(function(r) {
            ok(r, '2: counter cache');
            ok(r >= 1, '2: counter cache');
        }),
        HTTPCache.comment.get(url).next(function(r) {
            ok(r, '2: comment cache');
            ok(r.count >= 1, '2: comment cache count');
        }),
        HTTPCache.entry.get(url).next(function(r) {
            ok(r, '2: entry cache');
        })
    ]) }).next(function() { d.call(); });
}, 12, 1000).

test('Model Bookmark/Tag', function(d) {
    var db = new Database('testModelBookmarkTag');
    Model.getDatabase = function() { return db };
    // Database.debugMessage = true;
    Model.initialize().next(function() {
        ok(true, 'initialize model');
        var bookmark = new Bookmark({
            url: 'http://www.hatena.ne.jp/',
            comment: '[hatena][はてな]これはすごい',
            title: 'はてなのサイト',
            date: 1255519120
        });
        bookmark.saveWithTransaction().next(function(b) {
            equals(b.id, 1);
            ok(b.search.indexOf('これはすごい') != -1, 'search comment');
            ok(b.search.indexOf('サイト') != -1, 'search title');
            Tag.find({}).next(function(tags) {
                equals(tags.length, 2);
                equals(tags[0].name, 'hatena');
                equals(tags[1].name, 'はてな');
            }).next(function() {
                db.transaction(function() {
                    for (var i = 0;  i < 99; i++) {
                        var b = new Bookmark({
                            url: 'http://www.hatena.ne.jp/' + i,
                            comment: '[hatena][はてな]これはすごい' + i,
                            title: 'はてなのサイト' + i,
                            date: 1255519120 + i
                        });
                        b.save().next();
                    }
                }).next(function() {
                    ok(true, '100 bookmark insert');
                    Tag.count().next(function(c) {
                        equals(c, 200);
                        Bookmark.search('なのサ').next(function(r) {
                            equals(r.length, 20, 'search res');
                            Bookmark.search('すごい5').next(function(r) {
                                equals(r.length, 11, 'search res2');
                                equals(r[r.length-1].url, 'http://www.hatena.ne.jp/59', 'search order');
                                d.call();
                            });
                        });
                    });
                });
            });
        });
    });
}, 12, 2000).

test('UserManeger', function(d) {
    // UserManager.MY_NAME_URL = '/tests/data/hatenatest.my.name';
    UserManager.deferred('bind', 'UserChange').next(function(ev, user) {
        ok(true, 'Loggin!');
        equals(UserManager.user, user, 'user');
        equals(user.name, 'hatenatest');
        ok(user.ignores instanceof RegExp, 'ignores regexp list');
        ok(user.public != user.private, 'public/private');
        ok(user.database instanceof Database, 'database instance');
        UserManager.clearUser();
        ok(UserManager.user != user, 'no user');
        d.call();

        UserManager.unbind('UserChange');
    });
    UserManager.login();
}, 7, 1000).

test('sync sync sync', function(d) {
    Timer.__defineGetter__('now', function() { return 1255663923100 });
    var db = new Database('SyncTest');
    Model.getDatabase = function() { return db };
    var user = new User('hatenatest', {});
    Sync.getDataURL = function() {
        return user.dataURL;
    }
    Sync.deferred('bind', 'progress').next(function(ev, obj) {
        if (obj.value !== null && obj.value == 0) {
            ok(true, 'progress start');
        }
    });
    Sync.deferred('bind', 'complete').next(function() {
        ok(true, 'Sync!');
        Sync.unbind('complete');
        Bookmark.count().next(function(r) {
            equals(r, 518, 'total count');
            Tag.find({where: {name: 'db'}}).next(function(r) {
                equals(r.length, 13, 'tag');

                Sync.deferred('bind', 'complete').next(function() {
                    ok(true, 'sync sync');
                    Bookmark.count().next(function(r) {
                        equals(r, 519, 'total count2');
                        Tag.find({where: {name: 'db'}}).next(function(r) {
                            equals(r.length, 14, 'tag2');
                            Bookmark.search('高速').next(function(r) {
                                equals(r.length, 3, 'search');
                                Tag.getNameCountHash().next(function(tags) {
                                    equals(Object.keys(tags).length, 88);
                                    equals(tags['並行'], 40);
                                    equals(tags['javascript'], 11);
                                    d.call();
                                });
                            });
                        });
                    });
                });
                Sync.sync();
            });
        });
    });
    Sync.init();
}, 12, 10000).

test('finished', function(d) {
    ok(true, 'finished!!!');
    d.call();
}).

error(function(e) {
    console.log('error' + e.toString());
    throw(e);
});

