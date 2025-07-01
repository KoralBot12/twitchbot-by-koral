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

(function () {
    /*
     * @transformer adminonlyedit
     * @formula (adminonlyedit) returns blank
     * @labels twitch commandevent meta
     * @notes metatag that prevents anyone but the broadcaster or admins from editing the command
     * @example Caster: !addcom !playtime Current playtime: (playtime). (adminonlyedit)
     */
    function adminonlyedit() {
        return {result: ''};
    }

    /*
     * @transformer gameonly
     * @formula (gameonly name:str) cancels the command if the current game does not exactly match the one provided; multiple games can be provided, separated by |
     * @formula (gameonly !! name:str) cancels the command if the current game exactly matches the one provided; multiple games can be provided, separated by |
     * @labels twitch noevent meta
     * @cancels sometimes
     */
    function gameonly(args) {
        if (args.args) {
            let targs = args.args;
            let negate = false;
            if (targs.match(/^(!!\s)/) !== null) {
                targs = targs.substring(3);
                negate = true;
            }
            let game = $.getGame($.channelName);
            let match = targs.match(/([^|]+)/g);
            for (let x in match) {
                if ($.equalsIgnoreCase(game, match[x])) {
                    if (negate) {
                        return {cancel: true};
                    } else {
                        return {result: ''};
                    }
                }
            }
            if (!negate) {
                return {cancel: true};
            } else {
                return {result: ''};
            }
        }
    }

    /*
     * @transformer offlineonly
     * @formula (offlineonly) if the channel is not offline, cancels the command
     * @labels twitch commandevent meta
     * @example Caster: !addcom !downtime The stream as been offline for (downtime). (offlineonly)
     * @cancels sometimes
     */
    function offlineonly(args) {
        if ($.isOnline($.channelName)) {
            $.returnCommandCost(args.event.getSender(), args.event.getCommand(), $.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Mod));
            return {cancel: true};
        }
        return {result: ''};
    }

    /*
     * @transformer onlineonly
     * @formula (onlineonly) if the channel is not online, cancels the command
     * @labels twitch commandevent meta
     * @example Caster: !addcom !uptime (pointtouser) (channelname) has been live for (uptime). (onlineonly)
     * @cancels sometimes
     */
    function onlineonly(args) {
        if (!$.isOnline($.channelName)) {
            $.returnCommandCost(args.event.getSender(), args.event.getCommand(), $.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Mod));
            return {cancel: true};
        }
        return {result: ''};
    }

    /*
     * @transformer requireargs
     * @formula (requireargs count:int) cancels the command if the user does not provide at least the specified number of args
     * @labels twitch commandevent meta
     * @example Caster: !addcom !hugs (sender) hugs (touser)(requireargs 1)
     * @cancels sometimes
     */
    function requireargs(args) {
        if (args.args) {
            let n = parseInt(args.args);
            let arg = args.event.getArgs()[n - 1];
            if (arg === undefined) {
                $.returnCommandCost(args.event.getSender(), args.event.getCommand(), $.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Mod));
                return {cancel: true};
            }
        }
        return {result: ''};
    }

    /*
     * @transformer useronly
     * @formula (useronly name:str) only allows the given user to use the command; multiple users separated by spaces is allowed; if another user attempts to use the command, an error is sent to chat (if permComMsg is enabled) and the command is canceled
     * @labels twitch commandevent meta
     * @notes use @moderators as one of the user names to allow all moderators and admins
     * @notes use @admins as one of the user names to allow all admins
     * @cancels sometimes
     */
    function useronly(args) {
        if (args.args) {
            let match = args.args.match(/(@?\w+)/g);
            for (let x in match) {
                if (match[x].match(/^@moderators$/) !== null) {
                    if ($.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Mod)) {
                        return {result: ''};
                    }
                } else if (match[x].match(/^@admins$/) !== null) {
                    if ($.checkUserPermission(args.event.getSender(), args.event.getTags(), $.PERMISSION.Admin)) {
                        return {result: ''};
                    }
                } else if ($.equalsIgnoreCase(args.event.getSender(), match[x])) {
                    return {result: ''};
                }
            }
            if ($.getIniDbBoolean('settings', 'permComMsgEnabled', true)) {
                $.say($.whisperPrefix(args.event.getSender()) + $.lang.get('cmd.useronly', args.substring(1)));
            }
            return {cancel: true};
        }
    }

    let transformers = [
        new $.transformers.transformer('adminonlyedit', ['twitch', 'commandevent', 'meta'], adminonlyedit),
        new $.transformers.transformer('gameonly', ['twitch', 'noevent', 'meta'], gameonly),
        new $.transformers.transformer('offlineonly', ['twitch', 'commandevent', 'meta'], offlineonly),
        new $.transformers.transformer('onlineonly', ['twitch', 'commandevent', 'meta'], onlineonly),
        new $.transformers.transformer('useronly', ['twitch', 'commandevent', 'meta'], useronly)
    ];

    $.transformers.addTransformers(transformers);
})();
