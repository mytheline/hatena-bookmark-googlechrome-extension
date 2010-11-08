
var BG = chrome.extension.getBackgroundPage();
var user = BG.UserManager.user;

Config.View = {
    autoObserve: function() {
        var self = this;
        $(':text').each(self.textUpdateHandler);
        $(':radio').each(self.radioHander);
        $(':checkbox').each(self.checkboxHander);
        $('select').each(self.selectHandler);
        /*
        Object.keys(Config.configs).forEach(function(key) {
            var targets = document.getElementsByName(key);
            for (var i = 0;  i < targets.length; i++) {
                var target = targets[i];
                self.typeObserbers[target.type](target);
            }
        });
        */
    },
    textUpdateHandler: function() {
        var target = $(this);
        var key = target.attr('name');
        target.attr('value', Config.get(key));
        target.keyupD;
        var updateHandler = function() {
            if (target.keyupD) {
                target.keyupD.cancel();
                target.keyupD = null;
            }
            var val = target.attr('value');
            Config.set(key, val);
            var newVal = Config.get(key);
            if (val != newVal) {
                target.attr('value', newVal);
                Config.View.afterUpdate(key);
            }
        };
        target.bind('change', updateHandler);
        target.bind('keyup', function() {
            if (target.keyupD) target.keyupD.cancel();
            target.keyupD = Deferred.wait(1).next(function() {
                updateHandler();
            });
        });
    },
    radioHander: function(target) {
        var target = $(this);
        var key = target.attr('name');
        // bool only ... XXX
        var config = Config.configs[key];
        var culVal = Config.get(key);
        if ((culVal) && target.attr('value') == '1') {
            target.attr('checked', 'checked');
        } else if (!culVal && target.attr('value') == '0') {
            target.attr('checked', 'checked');
        }
        var updateHandler = function() {
            if (target.attr('checked')) {
                var val = target.attr('value');
                Config.set(key, val);
                Config.View.afterUpdate(key);
            }
        };
        target.bind('change', updateHandler);
        Config.View.afterUpdate(key);
    },
    selectHandler: function(target) {
        var target = $(this);
        var key = target.attr('name');
        var config = Config.configs[key];
        var culVal = Config.get(key);
        if (target.attr('value') != culVal) {
            target.val(culVal);
        }
        var updateHandler = function() {
            var val = target.attr('value');
            Config.set(key, val);
            Config.View.afterUpdate(key);
        };
        target.bind('change', updateHandler);
        Config.View.afterUpdate(key);
    },
    checkboxHander: function(target) {
        var target = $(this);
        var key = target.attr('name');
        var config = Config.configs[key];
        var culVal = Config.get(key);
        target.attr('checked', culVal ? 'checked' : '');
        var updateHandler = function() {
            Config.set(key, target.is(':checked'));
            Config.View.afterUpdate(key);
        };
        target.bind('change', updateHandler);
        Config.View.afterUpdate(key);
    },
    afterUpdate: function(key) {
        if (this.afterUpdates[key]) this.afterUpdates[key](key);
    },
    afterUpdates: {
        'popup.window.autosize' : function(key) {
            var val = Config.get(key);
            $("input.popup-input-size").each(function() {
                var el = this;
                setTimeout(function() {
                    if (val) {
                        el.setAttribute('disabled', true);
                    } else {
                        el.removeAttribute('disabled');
                    }
                }, 10);
            });
        },
        'popup.commentviewer.autodetect.enabled' : function(key) {
            var val = Config.get(key);
            $("input.commentviewer-autodetect-input").each(function() {
                var el = this;
                setTimeout(function() {
                    if (!val) {
                        el.setAttribute('disabled', true);
                    } else {
                        el.removeAttribute('disabled');
                    }
                }, 10);
            });
        }
    },

}

function showInitDB() {
    $('#db-username').text(user.name);
    $('#init-db').show();
}

function resetDB() {
    if (window.confirm(sprintf('ユーザー『%s』のローカルデータベースを再同期します。よろしいですか？', user.name))) {
        user.resetDatabase();
    }
}

function resetAll() {
    if (window.confirm('初期設定に戻します。よろしいですか？')) {
        Config.clearALL();
        location.reload();
    }
}

$(document).ready(function() {
    Config.View.autoObserve();
    $('body').show();
    if (user) showInitDB();
});



