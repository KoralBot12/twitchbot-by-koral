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

/**
 * timeSystem.js
 *
 * Keep track of users in the channel and log their time in the channel
 * Exports various time formatting functions
 * Use the $ API
 */
(function () {
    let levelWithTime = $.getSetIniDbBoolean('timeSettings', 'timeLevel', false),
            timeLevelWarning = $.getSetIniDbBoolean('timeSettings', 'timeLevelWarning', true),
            alertActiveOnly = $.getSetIniDbBoolean('timeSettings', 'alertActiveOnly', true),
            keepTimeWhenOffline = $.getSetIniDbBoolean('timeSettings', 'keepTimeWhenOffline', true),
            onlyModsCanCheckUsers = $.getSetIniDbBoolean('timeSettings', 'onlyModsCanCheckUsers', false),
            hoursForLevelUp = $.getSetIniDbNumber('timeSettings', 'timePromoteHours', 50);

    /**
     * @function updateTimeSettings
     */
    function updateTimeSettings() {
        levelWithTime = $.getIniDbBoolean('timeSettings', 'timeLevel');
        keepTimeWhenOffline = $.getIniDbBoolean('timeSettings', 'keepTimeWhenOffline');
        hoursForLevelUp = $.getIniDbNumber('timeSettings', 'timePromoteHours');
        onlyModsCanCheckUsers = $.getIniDbBoolean('timeSettings', 'onlyModsCanCheckUsers');
        timeLevelWarning = $.getIniDbBoolean('timeSettings', 'timeLevelWarning');
    }

    function getZoneId(zone) {
        try {
            return Packages.java.time.ZoneId.of(zone);
        } catch (ex) {
            $.log.error(ex.message);
            throw ex.message + ' -> Reference: https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/time/ZoneId.html';
        }
    }

    /**
     * @function getCurLocalTimeString
     * @export $
     * @param {String} timeformat
     * @returns {String}
     *
     * timeformat = Packages.java.time.format.DateTimeFormatter allowed formats:
     *   Letter   Date or Time Component   Presentation        Examples
     *   G        Era designator           Text                AD
     *   y        Year                     Year                1996; 96
     *   M        Month in year            Month               July; Jul; 07
     *   w        Week in year             Number              27
     *   W        Week in month            Number              2
     *   D        Day in year              Number              189
     *   d        Day in month             Number              9
     *   F        Day of week in month     Number              2
     *   E        Day in week              Text                Tuesday; Tue
     *   a        AM/PM marker             Text                PM
     *   H        Hour in day (0-23)       Number              0
     *   k        Hour in day (1-24)       Number              24
     *   K        Hour in am/pm (0-11)     Number              0
     *   h        Hour in am/pm (1-12)     Number              12
     *   m        Minute in hour           Number              30
     *   s        Second in minute         Number              55
     *   S        Millisecond              Number              978
     *   z        Time zone                General time zone   Pacific Standard Time; PST; GMT-08:00
     *   Z        Time zone                RFC 822 time zone   -0800
     *
     * Note that fixed strings must be encapsulated with quotes.  For example, the below inserts a comma
     * and paranthesis into the returned time string:
     *
     *     getCurLocalTimeString("MMMM dd', 'yyyy hh:mm:ss zzz '('Z')'");
     */
    function getCurLocalTimeString(format) {
        let zone = $.getIniDbString('settings', 'timezone', 'GMT');
        try {
            return Packages.java.time.ZonedDateTime.now(getZoneId(zone)).format(Packages.java.time.format.DateTimeFormatter.ofPattern(format));
        } catch (ex) {
            return ex.message;
        }
    }

    /**
     * @function getLocalTimeString
     * @export $
     * @param {String} timeformat
     * @param {Number} utc_seconds
     * @return {String}
     */
    function getLocalTimeString(format, utc_secs) {
        let zone = $.getIniDbString('settings', 'timezone', 'GMT');
        try {
            return Packages.java.time.ZonedDateTime.ofInstant(Packages.java.time.Instant.ofEpochMilli(utc_secs), getZoneId(zone)).format(Packages.java.time.format.DateTimeFormatter.ofPattern(format));
        } catch (ex) {
            return ex.message;
        }
    }

    /**
     * @function getCurrentLocalTimeString
     * @export $
     * @param {String} timeformat
     * @param {String} timeZone
     * @return {String}
     */
    function getCurrentLocalTimeString(format, timeZone) {
        try {
            return Packages.java.time.ZonedDateTime.now(getZoneId(timeZone)).format(Packages.java.time.format.DateTimeFormatter.ofPattern(format));
        } catch (ex) {
            return ex.message;
        }
    }

    /**
     * @function getLocalTime
     * @export $
     * @param {String} timeformat
     * @param {String} timeZone
     * @return {String}
     */
    function getLocalTime() {
        let zone = $.getIniDbString('settings', 'timezone', 'GMT');
        try {
            return Packages.java.time.ZonedDateTime.now(getZoneId(zone)).format(Packages.java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssZ"));
        } catch (ex) {
            return ex.message;
        }
    }

    /**
     * @function dateToString
     * @export $
     * @param {Date} date
     * @param {boolean} [timeOnly]
     * @returns {string}
     */
    function dateToString(date, timeOnly) {
        let year = date.getFullYear(),
                month = date.getMonth() + 1,
                day = date.getDate(),
                hours = date.getHours(),
                minutes = date.getMinutes();

        if (timeOnly) {
            return hours + ':' + minutes;
        } else {
            return day + '-' + month + '-' + year + ' @ ' + hours + ':' + minutes;
        }
    }

    /**
     * @function getTimeString
     * @export $
     * @param {Number} time
     * @param {boolean} [hoursOnly]
     * @returns {string}
     */
    function getTimeString(time, hoursOnly) {
        let floor = Math.floor,
                months = (time / 2628000),
                days = ((months % 1) * 30.42),
                hours = ((days % 1) * 24),
                minutes = ((hours % 1) * 60),
                seconds = ((minutes % 1) * 60);

        if (hoursOnly) {
            return floor(time / 3600) + $.lang.get('common.hours3');
        } else {
            let timeStringParts = [],
                    timeString = '';

            // Append months if greater than one.
            if (months >= 1) {
                timeStringParts.push(floor(months) + ' ' + (months < 2 ? $.lang.get('common.time.month') : $.lang.get('common.time.months')));
            }

            // Append days if greater than one.
            if (days >= 1) {
                timeStringParts.push(floor(days) + ' ' + (days < 2 ? $.lang.get('common.time.day') : $.lang.get('common.time.days')));
            }

            // Append hours if greater than one.
            if (hours >= 1) {
                timeStringParts.push(floor(hours) + ' ' + (hours < 2 ? $.lang.get('common.time.hour') : $.lang.get('common.time.hours')));
            }

            // Append minutes if greater than one.
            if (minutes >= 1) {
                timeStringParts.push(floor(minutes) + ' ' + (minutes < 2 ? $.lang.get('common.time.minute') : $.lang.get('common.time.minutes')));
            }

            // Append seconds if greater than one.
            if (seconds >= 1) {
                timeStringParts.push(floor(seconds) + ' ' + (seconds < 2 ? $.lang.get('common.time.second') : $.lang.get('common.time.seconds')));
            }

            // If the array is empty, return 0 seconds.
            if (timeStringParts.length === 0) {
                return ('0 ' + $.lang.get('common.time.seconds'));
            }

            // Join the array to make a string.
            timeString = timeStringParts.join(', ');

            // Replace last comma with ", and".
            if (timeString.indexOf(',') !== -1) {
                timeString = (timeString.slice(0, timeString.lastIndexOf(',')) + $.lang.get('common.time.and') + timeString.slice(timeString.lastIndexOf(',') + 2));
            }
            return timeString;
        }
    }

    /**
     * @function getCountString
     * @export $
     * @param {Number} time
     * @param {boolean} [countUp]
     * @returns {string}
     */
    function getCountString(time, countUp) {
        let floor = Math.floor,
                months = (time / 2628000),
                days = ((months % 1) * 30.42),
                hours = ((days % 1) * 24),
                minutes = ((hours % 1) * 60),
                seconds = ((minutes % 1) * 60);

        let timeStringParts = [],
                timeString = '';

        // Append months if greater than one.
        if (months >= 1) {
            timeStringParts.push(floor(months) + ' ' + (months < 2 ? $.lang.get('common.time.month') : $.lang.get('common.time.months')));
        }

        // Append days if greater than one.
        if (days >= 1) {
            timeStringParts.push(floor(days) + ' ' + (days < 2 ? $.lang.get('common.time.day') : $.lang.get('common.time.days')));
        }

        // Append hours if greater than one.
        if (hours >= 1) {
            timeStringParts.push(floor(hours) + ' ' + (hours < 2 ? $.lang.get('common.time.hour') : $.lang.get('common.time.hours')));
        }

        // Append minutes if greater than one.
        if (minutes >= 1) {
            timeStringParts.push(floor(minutes) + ' ' + (minutes < 2 ? $.lang.get('common.time.minute') : $.lang.get('common.time.minutes')));
        }

        // Append seconds if greater than one.
        if (seconds >= 1) {
            timeStringParts.push(floor(seconds) + ' ' + (seconds < 2 ? $.lang.get('common.time.second') : $.lang.get('common.time.seconds')));
        }

        // If the array is empty, return 0 seconds.
        if (timeStringParts.length === 0) {
            if (countUp) {
                return ($.lang.get('common.time.nostart'));
            } else {
                return ($.lang.get('common.time.expired'));
            }
        }

        // Join the array to make a string.
        timeString = timeStringParts.join(', ');

        // Replace last comma with ", and".
        if (timeString.indexOf(',') !== -1) {
            timeString = (timeString.slice(0, timeString.lastIndexOf(',')) + $.lang.get('common.time.and') + timeString.slice(timeString.lastIndexOf(',') + 2));
        }
        return timeString;
    }

    /**
     * @function getTimeStringMinutes
     * @export $
     * @param {Number} time
     * @param {boolean} [hoursOnly]
     * @returns {string}
     */
    function getTimeStringMinutes(time) {
        let floor = Math.floor,
                cHours = time / 3600,
                cMins = cHours % 1 * 60;

        if (cHours === 0 || cHours < 1) {
            return (floor(~~cMins) + $.lang.get('common.minutes2'));
        } else {
            return (floor(cHours) + $.lang.get('common.hours2') + floor(~~cMins) + $.lang.get('common.minutes2'));
        }
    }

    /**
     * @function getUserTime
     * @export $
     * @param {string} username
     * @returns {number}
     */
    function getUserTime(username) {
        return $.getIniDbNumber('time', username.toLowerCase(), 0);
    }

    /**
     * @function getUserTimeString
     * @export $
     * @param {string} username
     * @returns {string}
     */
    function getUserTimeString(username) {
        let floor = Math.floor,
                time = $.getUserTime(username.toLowerCase()),
                cHours = time / 3600,
                cMins = cHours % 1 * 60;

        if (floor(cHours) > 0) {
            return ($.lang.get('user.time.string.hours', floor(cHours), floor(~~cMins)));
        } else {
            return ($.lang.get('user.time.string.minutes', floor(~~cMins)));
        }
    }

    /**
     * @event command
     */
    $.bind('command', function (event) {
        let sender = event.getSender().toLowerCase(),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0],
                subject,
                timeArg,
                isMod = $.checkUserPermission(sender, event.getTags(), $.PERMISSION.Mod);

        /**
         * @commandpath time - Announce amount of time spent in channel
         */
        if ($.equalsIgnoreCase(command, 'time')) {
            // if onlyModsCanCheckUsers and the user is not a mod, then disallow progressing further
            if (!action || (!isMod && onlyModsCanCheckUsers)) {
                $.say($.whisperPrefix(sender) + $.lang.get("timesystem.get.self", $.resolveRank(sender), getUserTimeString(sender)));
            } else if (action && $.inidb.exists('time', action.toLowerCase())) {
                $.say($.whisperPrefix(sender) + $.lang.get("timesystem.get.other", $.viewer.getByLogin(action).name(), getUserTimeString(action)));
            } else {
                subject = args[1];
                timeArg = parseInt(args[2]);

                /**
                 * @commandpath time add [user] [seconds] - Add seconds to a user's logged time (for correction purposes)
                 */
                if ($.equalsIgnoreCase(action, 'add')) {

                    if (!subject || isNaN(timeArg)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.add.usage'));
                        return;
                    }

                    subject = $.user.sanitize(subject);

                    if (timeArg < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.add.error.negative'));
                        return;
                    }

                    if ($.user.isKnown(subject)) {
                        $.inidb.incr('time', subject, timeArg);
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.add.success', getTimeString(timeArg), $.viewer.getByLogin(subject).name(), getUserTimeString(subject)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', $.viewer.getByLogin(subject).name()));
                    }
                }

                /**
                 * @commandpath time take [user] [seconds] - Take seconds from a user's logged time
                 */
                if ($.equalsIgnoreCase(action, 'take')) {
                    if (!subject || isNaN(timeArg)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.take.usage'));
                        return;
                    }

                    subject = $.user.sanitize(subject);
                    if (!$.user.isKnown(subject)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', subject));
                    }

                    if (timeArg > $.getUserTime(subject)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.take.error.toomuch', subject));
                        return;
                    }

                    $.inidb.decr('time', subject, timeArg);
                    $.say($.whisperPrefix(sender) + $.lang.get('timesystem.take.success', $.getTimeString(timeArg), $.viewer.getByLogin(subject).name(), getUserTimeString(subject)));
                }

                if ($.equalsIgnoreCase(action, 'set')) {
                    if (!subject || isNaN(timeArg)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.settime.usage'));
                        return;
                    }

                    if (timeArg < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.settime.error.negative'));
                        return;
                    }


                    subject = $.user.sanitize(subject);
                    if ($.user.isKnown(subject)) {
                        $.inidb.set('time', subject, timeArg);
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.settime.success', $.viewer.getByLogin(subject).name(), $.getUserTimeString(subject)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('common.user.404', subject));
                    }
                }

                /**
                 * @commandpath time promotehours [hours] - Set the amount of hours a user has to be logged to automatically become a regular
                 */
                if ($.equalsIgnoreCase(action, 'promotehours')) {
                    if (isNaN(subject)) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.promotehours.usage'));
                        return;
                    }

                    if (subject < 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.promotehours.error.negative', $.getGroupNameById($.PERMISSION.Regular)));
                        return;
                    }

                    hoursForLevelUp = parseInt(subject);
                    $.inidb.set('timeSettings', 'timePromoteHours', hoursForLevelUp);
                    $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.promotehours.success', $.getGroupNameById($.PERMISSION.Regular), hoursForLevelUp));
                }

                /**
                 * @commandpath time autolevel - Auto levels a user to regular after hitting 50 hours.
                 */
                if ($.equalsIgnoreCase(action, 'autolevel')) {
                    levelWithTime = !levelWithTime;
                    $.setIniDbBoolean('timeSettings', 'timeLevel', levelWithTime);
                    $.say($.whisperPrefix(sender) + (levelWithTime ? $.lang.get('timesystem.autolevel.enabled', $.getGroupNameById($.PERMISSION.Regular), hoursForLevelUp) : $.lang.get('timesystem.autolevel.disabled', $.getGroupNameById($.PERMISSION.Regular), hoursForLevelUp)));
                }

                /**
                 * @commandpath time autolevelnotification - Toggles if a chat announcement is made when a user is promoted to a regular.
                 */
                if ($.equalsIgnoreCase(action, 'autolevelnotification')) {
                    timeLevelWarning = !timeLevelWarning;
                    $.setIniDbBoolean('timeSettings', 'timeLevelWarning', timeLevelWarning);
                    $.say($.whisperPrefix(sender) + (timeLevelWarning ? $.lang.get('timesystem.autolevel.chat.enabled') : $.lang.get('timesystem.autolevel.chat.disabled')));
                }

                /**
                 * @commandpath time notifyactiveonly - Toggles if the chat announcement is only made for active users.
                 */
                if ($.equalsIgnoreCase(action, 'notifyactiveonly')) {
                    alertActiveOnly = !alertActiveOnly;
                    $.setIniDbBoolean('timeSettings', 'alertActiveOnly', alertActiveOnly);
                    $.say($.whisperPrefix(sender) + (alertActiveOnly ? $.lang.get('timesystem.autolevel.chat.activeonly.enabled') : $.lang.get('timesystem.autolevel.chat.activeonly.disabled')));
                }

                /**
                 * @commandpath time offlinetime - Toggle logging a user's time when the channel is offline
                 */
                if ($.equalsIgnoreCase(action, 'offlinetime')) {
                    keepTimeWhenOffline = !keepTimeWhenOffline;
                    $.setIniDbBoolean('timeSettings', 'keepTimeWhenOffline', keepTimeWhenOffline);
                    $.say($.whisperPrefix(sender) + (keepTimeWhenOffline ? $.lang.get('timesystem.offlinetime.enabled') : $.lang.get('timesystem.offlinetime.disabled')));
                }

                /**
                 * @commandpath time modonlyusercheck - Toggle allowing only mods able to view others time
                 */
                if ($.equalsIgnoreCase(action, 'modonlyusercheck')) {
                    onlyModsCanCheckUsers = !onlyModsCanCheckUsers;
                    $.setIniDbBoolean('timeSettings', 'onlyModsCanCheckUsers', onlyModsCanCheckUsers);
                    $.say($.whisperPrefix(sender) + (onlyModsCanCheckUsers ? $.lang.get('timesystem.modonlyusercheck.enabled') : $.lang.get('timesystem.modonlyusercheck.disabled')));
                }
            }
        }

        /**
         * @commandpath streamertime - Announce the caster's local time
         */
        if ($.equalsIgnoreCase(command, 'streamertime')) {
            $.say($.whisperPrefix(sender) + $.lang.get('timesystem.streamertime', getCurLocalTimeString("MMMM dd', 'yyyy hh:mm:ss a zzz '('Z')'"), $.viewer.getByLogin($.ownerName).name()));
        }

        /**
         * @commandpath timezone [timezone name] - Show configured timezone or optionally set the timezone. See List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
         */
        if ($.equalsIgnoreCase(command, 'timezone')) {
            let tzData;

            if (!action) {
                let zone = $.getIniDbString('settings', 'timezone', 'GMT');
                $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.timezone.usage', zone));
                return;
            }

            tzData = Packages.java.util.TimeZone.getTimeZone(action);
            if (tzData.getID().equals("GMT") && !action.equals("GMT")) {
                $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.timezone.invalid', action));
                return;
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('timesystem.set.timezone.success', tzData.getID(), tzData.observesDaylightTime()));
                $.inidb.set('settings', 'timezone', tzData.getID());
            }
        }
    });

    // Set an interval for increasing all current users logged time
    setInterval(function () {
        if ($.isOnline($.channelName) || keepTimeWhenOffline) {
            let chatList = $.viewer.chatters();
            let users = [];
            for (let i = 0; i < chatList.size(); i++) {
                users.push($.jsString(chatList.get(i).login().toLowerCase()));
            }
            $.inidb.IncreaseBatchString('time', '', users, '60');
        }
    }, 6e4, 'scripts::systems::timeSystem.js#1');

    // Interval for auto level to regular
    setInterval(function () {
        if (levelWithTime) {
            let chatList = $.viewer.chatters();
            let active = $.viewer.activeChatters();
            for (let i = 0; i < chatList.size(); i++) {
                let username = $.jsString(chatList.get(i).login().toLowerCase());
                let time = $.optIniDbNumber('time', username);
                // Only level viewers to regulars and ignore TwitchBots
                if (!$.isTwitchBot(username)
                    && (!$.hasPermissionLevel(username) || $.isViewer(username)) //Assume users without permissions level are viewers, if they are too new the check will fail in the next condition
                    && time.isPresent()
                    && Math.floor(time.get() / 3600) >= hoursForLevelUp) {
                    if (!$.isMod(username)) { // Added a second check here to be 100% sure the user is not a mod.
                        $.setUserGroupById(username, $.PERMISSION.Regular);
                        if (timeLevelWarning && (!alertActiveOnly || active.contains(chatList.get(i)))) {
                            $.say($.lang.get(
                                'timesystem.autolevel.promoted',
                                $.viewer.getByLogin(username).name(),
                                $.getGroupNameById($.PERMISSION.Regular).toLowerCase(),
                                hoursForLevelUp
                            )); //No whisper mode needed here.
                        }
                    }
                }
            }
        }
    }, 9e5, 'scripts::systems::timeSystem.js#2');

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./core/timeSystem.js', 'streamertime');
        $.registerChatCommand('./core/timeSystem.js', 'timezone', $.PERMISSION.Admin);
        $.registerChatCommand('./core/timeSystem.js', 'time');

        $.registerChatSubcommand('time', 'add', $.PERMISSION.Admin);
        $.registerChatSubcommand('time', 'take', $.PERMISSION.Admin);
        $.registerChatSubcommand('time', 'set', $.PERMISSION.Admin);
        $.registerChatSubcommand('time', 'autolevel', $.PERMISSION.Admin);
        $.registerChatSubcommand('time', 'promotehours', $.PERMISSION.Admin);
        $.registerChatSubcommand('time', 'autolevelnotification', $.PERMISSION.Admin);
        $.registerChatSubcommand('time', 'notifyactiveonly', $.PERMISSION.Admin);
        $.registerChatSubcommand('time', 'modonlyusercheck', $.PERMISSION.Admin);
    });

    /** Export functions to API */
    $.dateToString = dateToString;
    $.getTimeString = getTimeString;
    $.getCountString = getCountString;
    $.getUserTime = getUserTime;
    $.getUserTimeString = getUserTimeString;
    $.getCurLocalTimeString = getCurLocalTimeString;
    $.getLocalTimeString = getLocalTimeString;
    $.getTimeStringMinutes = getTimeStringMinutes;
    $.updateTimeSettings = updateTimeSettings;
    $.getCurrentLocalTimeString = getCurrentLocalTimeString;
    $.getLocalTime = getLocalTime;
})();
