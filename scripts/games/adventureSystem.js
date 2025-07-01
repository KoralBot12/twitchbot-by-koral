/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global Packages */

(function() {
    var joinTime = $.getSetIniDbNumber('adventureSettings', 'joinTime', 60),
        coolDown = $.getSetIniDbNumber('adventureSettings', 'coolDown', 900),
        gainPercent = $.getSetIniDbNumber('adventureSettings', 'gainPercent', 30),
        minBet = $.getSetIniDbNumber('adventureSettings', 'minBet', 10),
        maxBet = $.getSetIniDbNumber('adventureSettings', 'maxBet', 1000),
        enterMessage = $.getSetIniDbBoolean('adventureSettings', 'enterMessage', false),
        warningMessage = $.getSetIniDbBoolean('adventureSettings', 'warningMessage', false),
        coolDownAnnounce = $.getSetIniDbBoolean('adventureSettings', 'coolDownAnnounce', false),
        startPermission = $.getSetIniDbNumber('adventureSettings', 'startPermission', $.PERMISSION.Viewer),
        odds = $.getSetIniDbNumber('adventureSettings', 'odds', 50),
        currentAdventure = {},
        stories = [],
        lastStory,
        _currentAdventureLock = new Packages.java.util.concurrent.locks.ReentrantLock(),
        timer;


    function reloadAdventure() {
        joinTime = $.getIniDbNumber('adventureSettings', 'joinTime');
        coolDown = $.getIniDbNumber('adventureSettings', 'coolDown');
        gainPercent = $.getIniDbNumber('adventureSettings', 'gainPercent');
        minBet = $.getIniDbNumber('adventureSettings', 'minBet');
        maxBet = $.getIniDbNumber('adventureSettings', 'maxBet');
        enterMessage = $.getIniDbBoolean('adventureSettings', 'enterMessage');
        warningMessage = $.getIniDbBoolean('adventureSettings', 'warningMessage');
        coolDownAnnounce = $.getIniDbBoolean('adventureSettings', 'coolDownAnnounce');
        odds = $.getIniDbNumber('adventureSettings', 'odds');
        startPermission = $.getIniDbNumber('adventureSettings', 'startPermission');
    }

    /**
     * Loads stories from the prefixes 'adventuresystem.stories.default' (only if the language
     * property of 'adventuresystem.stories.default.enabled' is set to 'true') and
     * 'adventuresystem.stories'.
     *
     * Clears any previously loaded stories.
     *
     * @function loadStories
     */
    function loadStories() {
        clearCurrentAdventure();

        stories = [];

        // For backwards compatibility, load default stories if the variable is not set
        if (!$.lang.exists('adventuresystem.stories.default') || $.lang.get('adventuresystem.stories.default') === 'true') {
            loadStoriesFromPrefix('adventuresystem.stories');
        }

        loadStoriesFromPrefix('adventuresystem.stories.custom');

        $.consoleDebug($.lang.get('adventuresystem.loaded', stories.length));

        for (let i in stories) {
            if (stories[i].game === null) {
                return;
            }
        }

        $.log.warn('You must have at least one adventure that doesn\'t require a game to be set.');
        _currentAdventureLock.lock();
        try {
            currentAdventure.gameState = 2;
        } finally {
            _currentAdventureLock.unlock();
        }
    }

    /**
     * Loads stories from a specific prefix in the language table and adds them to the
     * global stories array.
     *
     * @param {string} prefix - The prefix underneath which the stories can be found
     * @example
     * // Import stories with adventuresystem.stories.custom.X.title as title and
     * // adventuresystem.stories.custom.X.chapter.Y as chapters
     * loadStoriesFromPrefix('adventuresystem.stories.custom');
     */
    function loadStoriesFromPrefix(prefix) {
        for (let storyId = 1; $.lang.exists(prefix + '.' + storyId + '.title'); storyId++) {
            let lines = [];
            for (let chapterId = 1; $.lang.exists(prefix + '.' + storyId + '.chapter.' + chapterId); chapterId++) {
                lines.push($.lang.get(prefix + '.' + storyId + '.chapter.' + chapterId));
            }

            stories.push({
                game: ($.lang.exists(prefix + '.' + storyId + '.game') ? $.lang.get(prefix + '.' + storyId + '.game') : null),
                title: $.lang.get(prefix + '.' + storyId + '.title'),
                odds: $.lang.exists(prefix + '.' + storyId + '.odds') ? parseInt($.lang.get(prefix + '.' + storyId + '.odds')) : null,
                lines: lines
            });

            $.consoleDebug($.lang.get('adventuresystem.loaded.prefix', storyId, prefix));
        }
    }

    /**
     * @function top5
     */
    function top5() {
        let payoutsKeys = $.inidb.GetKeyList('adventurePayouts', ''),
            temp = [],
            counter = 1,
            top5users = [];

        if (payoutsKeys.length === 0) {
            $.say($.lang.get('adventuresystem.top5.empty'));
        }

        for (let i in payoutsKeys) {
            if ($.equalsIgnoreCase(payoutsKeys[i], $.ownerName) || $.equalsIgnoreCase(payoutsKeys[i], $.botName)) {
                continue;
            }

            temp.push({
                username: payoutsKeys[i],
                amount: parseInt($.getIniDbString('adventurePayouts', payoutsKeys[i]))
            });
        }

        temp.sort(function(a, b) {
            return (a.amount < b.amount ? 1 : -1);
        });

        for (let i in temp) {
            if (counter <= 5) {
                top5users.push(counter + '. ' + temp[i].username + ': ' + $.getPointsString(temp[i].amount));
                counter++;
            }
        }

        $.say($.lang.get('adventuresystem.top5', top5users.join(', ')));
    }

    /**
     * @function checkUserAlreadyJoined
     * @param {string} username
     * @returns {boolean}
     */
    function checkUserAlreadyJoined(username) {
        username = $.jsString(username);
        _currentAdventureLock.lock();
        try {
            for (let i in currentAdventure.users) {
                if (currentAdventure.users[i].username === username) {
                    return true;
                }
            }
        } finally {
            _currentAdventureLock.unlock();
        }

        return false;
    }

    /**
     * @function adventureUsersListJoin
     * @param {Array} list
     * @returns {string}
     */
    function adventureUsersListJoin(list) {
        let temp = [];

        for (let i in list) {
            temp.push($.viewer.getByLogin(list[i].username).name());
        }

        return temp.join(', ');
    }

    /**
     * @function calculateResult
     */
    function calculateResult() {
        _currentAdventureLock.lock();
        try {
            let lOdds = currentAdventure.story.odds;
            if (lOdds === undefined || lOdds === null) {
                lOdds = odds;
            }
            for (let i in currentAdventure.users) {
                if ($.randRange(1, 100) > lOdds) {
                    currentAdventure.caught.push(currentAdventure.users[i]);
                } else {
                    currentAdventure.survivors.push(currentAdventure.users[i]);
                }
            }
        } finally {
            _currentAdventureLock.unlock();
        }
    }

    /**
     * @function replaceTags
     * @param {string} line
     * @returns {string}
     */
    function replaceTags(line) {
        if (line.indexOf('(caught)') > -1) {
            if (currentAdventure.caught.length > 0) {
                return line.replace('(caught)', adventureUsersListJoin(currentAdventure.caught));
            }
            return '';
        }

        if (line.indexOf('(survivors)') > -1) {
            if (currentAdventure.survivors.length > 0) {
                return line.replace('(survivors)', adventureUsersListJoin(currentAdventure.survivors));
            }
            return '';
        }

        return line;
    }

    /**
     * @function startHeist
     * @param {string} username
     */
    function startHeist(username) {
        _currentAdventureLock.lock();
        try {
            currentAdventure.gameState = 1;
        } finally {
            _currentAdventureLock.unlock();
        }

        setTimeout(function() {
            runStory();
        }, joinTime * 1e3);

        $.say($.lang.get('adventuresystem.start.success', $.resolveRank(username), $.pointNameMultiple));
    }

    /**
     * @function joinHeist
     * @param {string} username
     * @param {Number} bet
     * @returns {boolean}
     */
    function joinHeist(username, bet) {
        username = $.jsString(username);
        if (stories.length < 1) {
            $.log.error('No adventures found; cannot start an adventure.');
            return;
        }

        if (currentAdventure.gameState > 1) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.notpossible'));
            return;
        }

        if (checkUserAlreadyJoined(username)) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.alreadyjoined'));
            return;
        }

        if (bet > $.getUserPoints(username)) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.needpoints', $.getPointsString(bet), $.getPointsString($.getUserPoints(username))));
            return;
        }

        if (bet < minBet) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.bettoolow', $.getPointsString(bet), $.getPointsString(minBet)));
            return;
        }

        if (bet > maxBet) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.bettoohigh', $.getPointsString(bet), $.getPointsString(maxBet)));
            return;
        }

        if (currentAdventure.gameState === 0) {
            if (!$.checkUserPermission(username, undefined, startPermission)) {
                return;
            }

            startHeist(username);
        } else if (enterMessage) {
            $.say($.whisperPrefix(username) + $.lang.get('adventuresystem.join.success', $.getPointsString(bet)));
        }

        _currentAdventureLock.lock();
        try {
            currentAdventure.users.push({
                username: username,
                bet: bet
            });
        } finally {
            _currentAdventureLock.unlock();
        }

        $.inidb.decr('points', username, bet);
    }

    /**
     * @function runStory
     */
    function runStory() {
        let temp = [],
            story;

        let game = $.getGame($.channelName);

        for (let i in stories) {
            if (stories[i].game === null || $.equalsIgnoreCase(game, stories[i].game)) {
                temp.push(stories[i]);
            }
        }

        if (lastStory !== undefined && lastStory.title !== undefined) {
            do {
                story = $.randElement(temp);
            } while (story.title === lastStory.title && temp.length > 1);
        } else {
            story = $.randElement(temp);
        }

        lastStory = story;

        _currentAdventureLock.lock();
        try {
            currentAdventure.story = story;
            currentAdventure.progress = 0;
            currentAdventure.gameState = 2;
        } finally {
            _currentAdventureLock.unlock();
        }

        $.say($.lang.get('adventuresystem.runstory', story.title, currentAdventure.users.length));
        calculateResult();

        timer = setInterval(function() {
            _currentAdventureLock.lock();
            try {
                if (currentAdventure.progress < currentAdventure.story.lines.length) {
                    let line = replaceTags(currentAdventure.story.lines[currentAdventure.progress]);
                    if (line !== '') {
                        $.say(line.replace(/\(game\)/g, $.twitchcache.getGameTitle() + ''));
                    }
                } else {
                    endHeist();
                }

                currentAdventure.progress++;
            } finally {
                _currentAdventureLock.unlock();
            }
        }, 7e3);
    }

    /**
     * @function endHeist
     */
    function endHeist() {
        let maxlength = 0,
            temp = [];

        _currentAdventureLock.lock();
        try {
            for (let i in currentAdventure.survivors) {
                let pay = (currentAdventure.survivors[i].bet * (gainPercent / 100));
                $.inidb.incr('adventurePayouts', currentAdventure.survivors[i].username, pay);
                $.inidb.incr('adventurePayoutsTEMP', currentAdventure.survivors[i].username, pay);
                $.inidb.incr('points', currentAdventure.survivors[i].username, currentAdventure.survivors[i].bet + pay);
            }

            for (let i in currentAdventure.survivors) {
                let username = currentAdventure.survivors[i].username;
                maxlength += username.length;
                temp.push($.viewer.getByLogin(username).name() + ' (+' + $.getPointsString($.getIniDbString('adventurePayoutsTEMP', currentAdventure.survivors[i].username)) + ')');
            }

            if (temp.length === 0) {
                $.say($.lang.get('adventuresystem.completed.no.win'));
            } else if (((maxlength + 14) + $.channelName.length) > 512) {
                $.say($.lang.get('adventuresystem.completed.win.total', currentAdventure.survivors.length, currentAdventure.caught.length)); //in case too many people enter.
            } else {
                $.say($.lang.get('adventuresystem.completed', temp.join(', ')));
            }
        } finally {
            _currentAdventureLock.unlock();
        }

        clearInterval(timer);
        clearCurrentAdventure();
        $.coolDown.set('adventure', true, coolDown, undefined);
        if (coolDownAnnounce) {
            setTimeout(function() {
                $.say($.lang.get('adventuresystem.reset', $.pointNameMultiple));
            }, coolDown * 1000);
        }
    }

    /**
     * @function clearCurrentAdventure
     */
    function clearCurrentAdventure() {
        _currentAdventureLock.lock();
        try {
            currentAdventure = {
                gameState: 0,
                users: [],
                survivors: [],
                caught: [],
                story: {},
                progress: 0
            };
            $.inidb.RemoveFile('adventurePayoutsTEMP');
        } finally {
            _currentAdventureLock.unlock();
        }
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            actionArg1 = args[1],
            actionArg2 = args[2];

        /**
         * @commandpath adventure - Adventure command for starting, checking or setting options
         * @commandpath adventure [amount] - Start/join an adventure
         */
        if ($.equalsIgnoreCase(command, 'adventure')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.adventure.usage', $.pointNameMultiple));
                return;
            }

            if (!isNaN(parseInt(action))) {
                joinHeist(sender, parseInt(action));
                return;
            }

            /**
             * @commandpath adventure top5 - Announce the top 5 adventurers in the chat (most points gained)
             */
            if ($.equalsIgnoreCase(action, 'top5')) {
                top5();
                return;
            }

            /**
             * @commandpath adventure set - Base command for controlling the adventure settings
             */
            if ($.equalsIgnoreCase(action, 'set')) {
                if (actionArg1 === undefined || actionArg2 === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                    return;
                }

                /**
                 * @commandpath adventure set jointime [seconds] - Set the join time
                 */
                if ($.equalsIgnoreCase(actionArg1, 'joinTime')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }

                    joinTime = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'joinTime', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set cooldown [seconds] - Set cooldown time
                 */
                if ($.equalsIgnoreCase(actionArg1, 'coolDown')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }

                    coolDown = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'coolDown', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set gainpercent [value] - Set the gain percent value
                 */
                if ($.equalsIgnoreCase(actionArg1, 'gainPercent')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }

                    gainPercent = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'gainPercent', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set minbet [value] - Set the minimum bet
                 */
                if ($.equalsIgnoreCase(actionArg1, 'minBet')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }

                    minBet = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'minBet', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set maxbet [value] - Set the maximum bet
                 */
                if ($.equalsIgnoreCase(actionArg1, 'maxBet')) {
                    if (isNaN(parseInt(actionArg2))) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }

                    maxBet = parseInt(actionArg2);
                    $.inidb.set('adventureSettings', 'maxBet', parseInt(actionArg2));
                }

                /**
                 * @commandpath adventure set warningmessages [true / false] - Sets the per-user warning messages
                 */
                if ($.equalsIgnoreCase(actionArg1, 'warningmessages')) {
                    if ($.equalsIgnoreCase(args[2], 'true')) {
                        warningMessage = true;
                        actionArg2 = $.lang.get('common.enabled');
                    } else if ($.equalsIgnoreCase(args[2], 'false')) {
                        warningMessage = false;
                        actionArg2 = $.lang.get('common.disabled');
                    }

                    $.inidb.set('adventureSettings', 'warningMessage', warningMessage);
                }

                /**
                 * @commandpath adventure set entrymessages [true / false] - Sets the per-user entry messages
                 */
                if ($.equalsIgnoreCase(actionArg1, 'entrymessages')) {
                    if ($.equalsIgnoreCase(args[2], 'true')) {
                        enterMessage = true;
                        actionArg2 = $.lang.get('common.enabled');
                    } else if ($.equalsIgnoreCase(args[2], 'false')) {
                        enterMessage = false;
                        actionArg2 = $.lang.get('common.disabled');
                    }

                    $.inidb.set('adventureSettings', 'enterMessage', enterMessage);
                }

                /**
                 * @commandpath adventure set cooldownannounce [true / false] - Sets the cooldown announcement
                 */
                if ($.equalsIgnoreCase(actionArg1, 'cooldownannounce')) {
                    if ($.equalsIgnoreCase(args[2], 'true')) {
                        coolDownAnnounce = true;
                        actionArg2 = $.lang.get('common.enabled');
                    } else if ($.equalsIgnoreCase(args[2], 'false')) {
                        coolDownAnnounce = false;
                        actionArg2 = $.lang.get('common.disabled');
                    }

                    $.inidb.set('adventureSettings', 'coolDownAnnounce', coolDownAnnounce);
                }

                /**
                 * @commandpath adventure set odds [value] - Set the odds of players surviving adventures
                 */
                if ($.equalsIgnoreCase(actionArg1, 'odds')) {
                    if (isNaN(actionArg2)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage'));
                        return;
                    }

                    let tmp = parseInt(actionArg2);
                    if (tmp < 0 || tmp > 100) {
                        $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.usage.odds'));
                        return;
                    }

                    odds = tmp;
                    $.setIniDbNumber('adventureSettings', 'odds', odds);
                    // Pretty up the output
                    actionArg2 = actionArg2 + '%';
                }

                $.say($.whisperPrefix(sender) + $.lang.get('adventuresystem.set.success', actionArg1, actionArg2));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./games/adventureSystem.js', 'adventure', $.PERMISSION.Viewer);
        $.registerChatSubcommand('adventure', 'set', $.PERMISSION.Admin);
        $.registerChatSubcommand('adventure', 'top5', $.getHighestIDSubVIP());

        loadStories();
    });

    $.reloadAdventure = reloadAdventure;
})();
