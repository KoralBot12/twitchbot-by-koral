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

(function() {
    let blacklist = [],
        whitelist = [],
        permitList = {},
        spam = {},
        chat = {},
        lastMessage = 0,
        chatCleanup = 5 * 60 * 1000,

        linkToggle = $.getSetIniDbBoolean('discordSettings', 'linkToggle', false),
        linkPermit = $.getSetIniDbNumber('discordSettings', 'linkPermit', 60),

        capsToggle = $.getSetIniDbBoolean('discordSettings', 'capToggle', false),
        capsLimitPercent = $.getSetIniDbNumber('discordSettings', 'capsLimitPercent', 50),
        capsTriggerLength = $.getSetIniDbNumber('discordSettings', 'capsTriggerLength', 15),

        longMessageToggle = $.getSetIniDbBoolean('discordSettings', 'longMessageToggle', false),
        longMessageLimit = $.getSetIniDbNumber('discordSettings', 'longMessageLimit', 600),

        spamToggle = $.getSetIniDbBoolean('discordSettings', 'spamToggle', false),
        spamLimit = $.getSetIniDbNumber('discordSettings', 'spamLimit', 5),

        modLogs = $.getSetIniDbBoolean('discordSettings', 'modLogs', false),
        modLogChannel = $.getSetIniDbString('discordSettings', 'modLogChannel', ''),
        modLogChat = $.getSetIniDbBoolean('discordSettings', 'modLogChat', false);

    /**
     * @function reload
     */
    function reload() {
        linkToggle = $.getSetIniDbBoolean('discordSettings', 'linkToggle', false),
        linkPermit = $.getSetIniDbNumber('discordSettings', 'linkPermit', 60);
        capsToggle = $.getSetIniDbBoolean('discordSettings', 'capToggle', false);
        capsLimitPercent = $.getSetIniDbNumber('discordSettings', 'capsLimitPercent', 50);
        capsTriggerLength = $.getSetIniDbNumber('discordSettings', 'capsTriggerLength', 15);
        longMessageToggle = $.getSetIniDbBoolean('discordSettings', 'longMessageToggle', false);
        longMessageLimit = $.getSetIniDbNumber('discordSettings', 'longMessageLimit', 600);
        spamToggle = $.getSetIniDbBoolean('discordSettings', 'spamToggle', false);
        spamLimit = $.getSetIniDbNumber('discordSettings', 'spamLimit', 5);
        modLogs = $.getSetIniDbBoolean('discordSettings', 'modLogs', false);
        modLogChannel = $.getSetIniDbString('discordSettings', 'modLogChannel', '');
        modLogChat = $.getSetIniDbBoolean('discordSettings', 'modLogChat', false);

        if (!modLogChat) {
            chat = {};
        }
    }

    /**
     * @function loadBlackList
     */
    function loadBlackList() {
        var keys = $.inidb.GetKeyList('discordBlacklist', ''),
            i;

        blacklist = [];
        for (i = 0; i < keys.length; i++) {
            blacklist.push(keys[i].toLowerCase());
        }
    }

    /**
     * @function loadWhitelist
     */
    function loadWhitelist() {
        var keys = $.inidb.GetKeyList('discordWhitelist', ''),
            i;

        whitelist = [];
        for (i = 0; i < keys.length; i++) {
            whitelist.push(keys[i].toLowerCase());
        }
    }

    /**
     * @function hasPermit
     *
     * @param {String} username
     */
    function hasPermit(username) {
        if (permitList[username] !== undefined && (permitList[username] + linkPermit) >= $.systemTime()) {
            return true;
        }
        return false;
    }

    /**
     * @function
     *
     * @param {String} sender
     * @param {String} message
     */
    function isWhiteList(username, message) {
        for (var i in whitelist) {
            if (message.includes(whitelist[i]) || username === whitelist[i]) {
                return true;
            }
        }
        return false;
    }

    /**
     * @hasBlackList
     *
     * @param {String} message
     */
    function hasBlackList(message) {
        for (var i in blacklist) {
            if (message.includes(blacklist[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * @function username
     *
     * @param {String} username
     */
    function bulkDelete(username, channel) {
        $.discordAPI.bulkDeleteMessages(channel, spam[username].messages);
        delete spam[username];
    }

    /**
     * function timeoutUser
     *
     * @param {Object} message
     */
    function timeoutUser(message) {
        $.discordAPI.deleteMessage(message);
    }

    function userLink(username) {
        return 'https://www.twitch.tv/popout/' + $.channelName + '/viewercard/' + username.toLowerCase();
    }

    /*
     * @function embedDelete
     *
     * @param {String} username
     * @param {String} moderator
     * @param {String} message
     */
    function embedDelete(username, moderator, message) {
        var toSend = '',
            obj = {},
            i;

        obj['**Deleted_message_of:**'] = '[' + username + '](' + userLink(username) + ')';
        obj['**Moderator:**'] = moderator;
        obj['**Last_message:**'] = ($.strlen(message) > 50 ? message.substring(0, 50) + '...' : message);

        var keys = Object.keys(obj);
        for (i in keys) {
            if (obj[keys[i]] !== '') {
                toSend += keys[i].replace(/_/g, ' ') + ' ' + obj[keys[i]] + '\r\n\r\n';
            }
        }
        $.discordAPI.sendMessageEmbed(modLogChannel, 'blue', toSend);
    }

    /*
     * @function embedTimeout
     *
     * @param {String} username
     * @param {String} moderator
     * @param {String} reason
     * @param {String} time
     * @param {String} message
     */
    function embedTimeout(username, moderator, reason, time, message) {
        var toSend = '',
            obj = {},
            i;

        obj['**Timeout_placed_on:**'] = '[' + username + '](' + userLink(username) + ')';
        obj['**Moderator:**'] = moderator;
        obj['**Reason:**'] = reason;
        obj['**Expires:**'] = time;
        if (message !== undefined && message !== null) {
            obj['**Last_message:**'] = ($.strlen(message) > 50 ? message.substring(0, 50) + '...' : message);
        }

        var keys = Object.keys(obj);
        for (i in keys) {
            if (obj[keys[i]] !== '') {
                toSend += keys[i].replace(/_/g, ' ') + ' ' + obj[keys[i]] + '\r\n\r\n';
            }
        }
        $.discordAPI.sendMessageEmbed(modLogChannel, 'yellow', toSend);
    }

    /*
     * @function embedBanned
     *
     * @param {String} username
     * @param {String} moderator
     * @param {String} reason
     * @param {String} message
     */
    function embedBanned(username, moderator, reason, message) {
        var toSend = '',
            obj = {},
            i;

        obj['**Ban_placed_on:**'] = '[' + username + '](' + userLink(username) + ')';
        obj['**Moderator:**'] = moderator;
        obj['**Reason:**'] = reason;
        if (message !== undefined && message !== null) {
            obj['**Last_message:**'] = ($.strlen(message) > 50 ? message.substring(0, 50) + '...' : message);
        }

        var keys = Object.keys(obj);
        for (i in keys) {
            if (obj[keys[i]] !== '') {
                toSend += keys[i].replace(/_/g, ' ') + ' ' + obj[keys[i]] + '\r\n\r\n';
            }
        }
        $.discordAPI.sendMessageEmbed(modLogChannel, 'red', toSend);
    }

    $.bind('eventSubChannelModerate', function (event) {
        if ($.jsString(event.event().broadcasterUserId()) === $.jsString($.viewer.broadcaster().id())) {
            let d = event.event();
            let action = $.jsString(d.action());
            let moderator = d.moderatorUserName();

            if (modLogs === false || modLogChannel === '') {
                return;
            }

            if (action === 'delete') {
                embedDelete(d.deleteData().userLogin(), moderator, d.deleteData().messageBody());
            } else if (action === 'timeout') {
                embedTimeout(d.timeout().userLogin(), moderator, 
                    (d.timeout().reason() !== null && $.strlen(d.timeout().reason()) > 0 ? d.timeout().reason() : ''),
                    d.timeout().expiresAt().toString(),
                    (chat[d.timeout().userLogin()]!== undefined && chat[d.timeout().userLogin()] !== null ? 
                        chat[d.timeout().userLogin()].message : null));
            } else if (action === 'untimeout') {
                $.discordAPI.sendMessageEmbed(modLogChannel, 'green', '**Timeout removed from:** ' + '[' + d.untimeout().userLogin() + '](' + userLink(d.untimeout().userLogin()) + ')' + ' \r\n\r\n **Moderator:** ' + moderator);
            } else if (action === 'ban') {
                embedBanned(d.ban().userLogin(), moderator, (d.ban().reason() !== null && $.strlen(d.ban().reason()) > 0 ? d.ban().reason() : ''),
                (chat[d.ban().userLogin()]!== undefined && chat[d.ban().userLogin()] !== null ? 
                    chat[d.ban().userLogin()].message : null));
            } else if (action === 'unban') {
                $.discordAPI.sendMessageEmbed(modLogChannel, 'green', '**Ban removed from:** ' + '[' + d.unban().userLogin() + '](' + userLink(d.unban().userLogin()) + ')' + ' \r\n\r\n **Moderator:** ' + moderator);
            }
        }
    });

    $.bind('eventSubWelcome', function (event) {
        if (!event.isReconnect()) {
            let subscriptions = [
                Packages.com.gmt2001.twitch.eventsub.subscriptions.channel.ChannelModerate
            ];

            let success = true;
            for (let i in subscriptions) {
                let newSubscription = new subscriptions[i]($.viewer.broadcaster().id());
                try {
                    newSubscription.create().block();
                } catch (ex) {
                    success = false;
                    $.log.error(ex);
                }
            }
        }
    });

    /*
     * @event ircModeration
     */
    $.bind('ircModeration', function (event) {
        if (!modLogChat) {
            return;
        }

        let sender = event.getSender(),
            message = $.jsString(event.getMessage());
        message = ($.strlen(message) > 50 ? message.substring(0, 50) + '...' : message);

        chat[sender] = { timestamp: $.systemTime(), message: message };
    });

    /**
     * @event discordChannelMessage
     */
    $.bind('discordChannelMessage', function(event) {
        var sender = event.getSenderId(),
            channel = event.getDiscordChannel(),
            message = event.getMessage().toLowerCase(),
            messageLength = $.strlen(message);

        if (event.isAdmin() === false && !hasPermit(sender) && !isWhiteList(sender, message)) {
            if (linkToggle && $.discord.pattern.hasLink(message)) {
                timeoutUser(event.getDiscordMessage());
                return;
            }

            if (longMessageToggle && messageLength > longMessageLimit) {
                timeoutUser(event.getDiscordMessage());
                return;
            }

            if (capsToggle && messageLength > capsTriggerLength && (($.discord.pattern.getCapsCount(event.getMessage()) / messageLength) * 100) > capsLimitPercent) {
                timeoutUser(event.getDiscordMessage());
                return;
            }

            if (spamToggle) {
                if (spam[sender] !== undefined) {
                    if (spam[sender].time + 5000 > $.systemTime() && (spam[sender].total + 1) <= spamLimit) {
                        spam[sender].total++; spam[sender].messages.push(event.getDiscordMessage());
                    } else if (spam[sender].time + 5000 < $.systemTime() && (spam[sender].total + 1) <= spamLimit) {
                        spam[sender] = { total: 1, time: $.systemTime(), messages: [event.getDiscordMessage()] };
                    } else {
                        spam[sender].messages.push(event.getDiscordMessage());
                        bulkDelete(sender, channel);
                        return;
                    }
                } else {
                    spam[sender] = { total: 1, time: $.systemTime(), messages: [event.getDiscordMessage()] };
                }
            }

            if (hasBlackList(message)) {
                timeoutUser(event.getDiscordMessage());
                return;
            }
        }
        lastMessage = $.systemTime();
    });

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var channel = event.getDiscordChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1],
            actionArgs = args[2];

        if ($.equalsIgnoreCase(command, 'moderation')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.usage'));
                return;
            }

            if ($.equalsIgnoreCase(action, 'links')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.links.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation links toggle - Toggles the link filter.
                 */
                if ($.equalsIgnoreCase(subAction, 'toggle')) {
                    linkToggle = !linkToggle;
                    $.setIniDbBoolean('discordSettings', 'linkToggle', linkToggle);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.links.toggle', (linkToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation links permittime [seconds] - Sets the amount a time a permit lasts for.
                 */
                if ($.equalsIgnoreCase(subAction, 'permittime')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.links.permit.time.usage'));
                        return;
                    }

                    linkPermit = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'linkPermit', linkPermit);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.links.permit.time.set', linkPermit));
                }
            }

            if ($.equalsIgnoreCase(action, 'caps')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation caps toggle - Toggle the caps filter.
                 */
                if ($.equalsIgnoreCase(subAction, 'toggle')) {
                    capsToggle = !capsToggle;
                    $.setIniDbBoolean('discordSettings', 'capsToggle', capsToggle);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.toggle', (capsToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation caps triggerlength [characters] - Sets the amount of characters needed a message before checking for caps.
                 */
                if ($.equalsIgnoreCase(subAction, 'triggerlength')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.trigger.usage'));
                        return;
                    }

                    capsTriggerLength = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'capsTriggerLength', capsTriggerLength);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.trigger.set', capsTriggerLength));
                }

                /**
                 * @discordcommandpath moderation caps limitpercent [percent] - Sets the amount in percent of caps are allowed in a message.
                 */
                if ($.equalsIgnoreCase(subAction, 'limitpercent')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.limit.usage'));
                        return;
                    }

                    capsLimitPercent = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'capsLimitPercent', capsLimitPercent);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.caps.limit.set', capsLimitPercent));
                }
            }

            if ($.equalsIgnoreCase(action, 'longmessage')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.long.message.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation longmessage toggle - Toggles the long message filter
                 */
                if ($.equalsIgnoreCase(subAction, 'toggle')) {
                    longMessageToggle = !longMessageToggle;
                    $.setIniDbBoolean('discordSettings', 'longMessageToggle', longMessageToggle);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.long.message.toggle', (longMessageToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation longmessage limit [characters] - Sets the amount of characters allowed in a message.
                 */
                if ($.equalsIgnoreCase(subAction, 'limit')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.long.message.limit.usage'));
                        return;
                    }

                    longMessageLimit = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'longMessageLimit', longMessageLimit);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.long.message.limit.set', longMessageLimit));
                }
            }

            if ($.equalsIgnoreCase(action, 'spam')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.spam.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation spam toggle - Toggles the spam filter.
                 */
                if ($.equalsIgnoreCase(subAction, 'toggle')) {
                    spamToggle = !spamToggle;
                    $.setIniDbBoolean('discordSettings', 'spamToggle', spamToggle);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.spam.toggle', (spamToggle === true ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation limit [messages] - Sets the amount of messages users are allowed to send in 5 seconds.
                 */
                if ($.equalsIgnoreCase(subAction, 'limit')) {
                    if (isNaN(parseInt(actionArgs))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.spam.limit.usage'));
                        return;
                    }

                    spamLimit = parseInt(actionArgs);
                    $.setIniDbNumber('discordSettings', 'spamLimit', spamLimit);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.spam.limit.set', spamLimit));
                }
            }


            if ($.equalsIgnoreCase(action, 'blacklist')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation blacklist add [phrase] - Adds a word or phrase to the blacklist which will be deleted if said in any channel.
                 */
                if ($.equalsIgnoreCase(subAction, 'add')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.add.usage'));
                        return;
                    }

                    actionArgs = args.splice(2).join(' ').toLowerCase();
                    $.setIniDbString('discordBlacklist', actionArgs, 'true');
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.add.success'));
                    loadBlackList();
                }

                /**
                 * @discordcommandpath moderation blacklist remove [phrase] - Removes a word or phrase to the blacklist.
                 */
                if ($.equalsIgnoreCase(subAction, 'remove')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.remove.usage'));
                        return;
                    } else if (!$.inidb.exists('discordBlacklist', args.splice(2).join(' ').toLowerCase())) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.remove.404'));
                        return;
                    }

                    actionArgs = args.splice(2).join(' ').toLowerCase();
                    $.inidb.del('discordBlacklist', actionArgs);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.remove.success'));
                    loadBlackList();
                }

                /**
                 * @discordcommandpath moderation blacklist list - Gives you a list of everything in the blacklist.
                 */
                if ($.equalsIgnoreCase(subAction, 'list')) {
                    var keys = $.inidb.GetKeyList('discordBlacklist', ''),
                        temp = [],
                        i;

                    for (i = 0; i < keys.length; i++) {
                        temp.push('#' + i + ': ' + keys[i]);
                    }

                    if (temp.length === 0) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.list.404'));
                        return;
                    }

                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.blacklist.list', temp.join('\r\n')));
                }
            }

            if ($.equalsIgnoreCase(action, 'whitelist')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation whitelist add [phrase or username#discriminator] - Adds a phrase, word or username that will not get checked by the moderation system.
                 */
                if ($.equalsIgnoreCase(subAction, 'add')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.add.usage'));
                        return;
                    }

                    actionArgs = args.splice(2).join(' ').toLowerCase();
                    $.setIniDbString('discordWhitelist', actionArgs, 'true');
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.add.success'));
                    loadWhitelist();
                }

                /**
                 * @discordcommandpath moderation whitelist add [phrase or username#discriminator] - Removes that phrase, word or username from the whitelist.
                 */
                if ($.equalsIgnoreCase(subAction, 'remove')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.remove.usage'));
                        return;
                    } else if (!$.inidb.exists('discordWhitelist', args.splice(2).join(' ').toLowerCase())) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.remove.404'));
                        return;
                    }

                    actionArgs = args.splice(2).join(' ').toLowerCase();
                    $.inidb.del('discordWhitelist', actionArgs);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.remove.success'));
                    loadWhitelist();
                }

                /**
                 * @discordcommandpath moderation whitelist list - Gives you a list of everything in the whitelist.
                 */
                if ($.equalsIgnoreCase(subAction, 'list')) {
                    var keys = $.inidb.GetKeyList('discordWhitelist', ''),
                        temp = [],
                        i;

                    for (i = 0; i < keys.length; i++) {
                        temp.push('#' + i + ': ' + keys[i]);
                    }

                    if (temp.length === 0) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.list.404'));
                        return;
                    }

                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.whitelist.list', temp.join('\r\n')));
                }
            }

            /**
             * @discordcommandpath moderation cleanup [channel] [amount] - Will delete that amount of messages for that channel.
             */
            if ($.equalsIgnoreCase(action, 'cleanup')) {
                var resolvedChannel = null;
                if (subAction === undefined || (actionArgs === undefined || isNaN(parseInt(actionArgs)))) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.usage'));
                    return;
                } else if (parseInt(actionArgs) > 10000 || parseInt(actionArgs) < 2) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.err.amount'));
                    return;
                }

                if (subAction.match(/<#\d+>/)) {
                    resolvedChannel = $.discordAPI.getChannelByID(subAction.match(/<#(\d+)>/)[1]);
                }
                if (resolvedChannel === null) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.err.unknownchannel', subAction));
                    return;
                }

                $.discordAPI.bulkDelete(resolvedChannel, parseInt(actionArgs));

                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.cleanup.done', actionArgs));
            }

            if ($.equalsIgnoreCase(action, 'logs')) {
                if (subAction === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.toggle.usage'));
                    return;
                }

                /**
                 * @discordcommandpath moderation logs toggle - Will toggle if Twitch moderation logs are to be said in Discord. Requires bot restart.
                 */
                if ($.equalsIgnoreCase(subAction, 'toggle')) {
                    modLogs = !modLogs;
                    $.setIniDbBoolean('discordSettings', 'modLogs', modLogs);
                    $.setIniDbBoolean('chatModerator', 'moderationLogs', modLogs);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.toggle', (modLogs ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation logs chat - Will toggle if the last Twitch chat message (within 5 minutes) of a timed out or banned user is included in mod logs.
                 */
                if ($.equalsIgnoreCase(subAction, 'chat')) {
                    modLogChat = !modLogChat;
                    $.setIniDbBoolean('discordSettings', 'modLogChat', modLogChat);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.togglechat', (modLogChat ? $.lang.get('common.enabled') : $.lang.get('common.disabled'))));
                }

                /**
                 * @discordcommandpath moderation logs channel [channel name] - Will make Twitch moderator action be announced in that channel.
                 */
                if ($.equalsIgnoreCase(subAction, 'channel')) {
                    if (actionArgs === undefined) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.channel.usage'));
                        return;
                    }

                    modLogChannel = $.discord.sanitizeChannelName(args.splice(2).join(' '));
                    $.setIniDbString('discordSettings', 'modLogChannel', modLogChannel);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('moderation.logs.channel.set', args.splice(2).join(' ')));
                }
            }
        }
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if ($.equalsIgnoreCase(event.getScript(), './discord/core/moderation.js')) {
            reload();
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./discord/core/moderation.js')) {
            $.discord.registerCommand('./discord/core/moderation.js', 'moderation', 1);
            $.discord.registerSubCommand('moderation', 'links', 1);
            $.discord.registerSubCommand('moderation', 'caps', 1);
            $.discord.registerSubCommand('moderation', 'longmessage', 1);
            $.discord.registerSubCommand('moderation', 'spam', 1);
            $.discord.registerSubCommand('moderation', 'blacklist', 1);
            $.discord.registerSubCommand('moderation', 'whitelist', 1);
            $.discord.registerSubCommand('moderation', 'cleanup', 1);
            $.discord.registerSubCommand('moderation', 'logs', 1);

            loadWhitelist();
            loadBlackList();
            setInterval(function() {
                if (spam.length !== 0 && lastMessage - $.systemTime() <= 0) {
                    spam = {};
                    if (permitList.length !== 0) {
                        permitList = {};
                    }
                }
            }, 6e4, 'scripts::discord::core::moderation::spamPermitCleanup');

            setInterval(function() {
                let remove = [];
                for (let x in chat) {
                    if (chat[x].timestamp + chatCleanup <= $.systemTime()) {
                        remove.push(x);
                    }
                }

                for (let i in remove) {
                    chat[remove[i]] = null;
                    delete chat[remove[i]];
                }
            }, chatCleanup, 'scripts::discord::core::moderation::chatCleanup');
        }
    });
})();
