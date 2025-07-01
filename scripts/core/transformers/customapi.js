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

(function () {
    let accept_json = Packages.io.netty.handler.codec.http.HttpHeaderValues.APPLICATION_JSON.toString();

    /*
     * @function getCustomAPIValue
     *
     * @param {string} url
     * @returns {string}
     */
    function getCustomAPIValue(url, accept) {
        let res;

        if (accept !== undefined && accept !== null) {
            res = $.customAPI.get(url, accept);
        } else {
            res = $.customAPI.get(url);
        }

        if (res.content !== null) {
            $.consoleDebug(res.toString());
            return res.content;
        } else {
            $.log.error(res.toString());
            throw res.toString();
        }
    }

    /*
     * @function postCustomAPIValue
     *
     * @param {string} url
     * @returns {string}
     */
    function postCustomAPIValue(url, data) {
        if (data === undefined || data === null) {
            data = '';
        }

        let res = $.customAPI.post(url, data);

        if (res.content !== null) {
            $.consoleDebug(res.toString());
            return res.content;
        } else if (res.httpCode >= 200 && res.httpCode < 300) {
            $.consoleDebug(res.toString());
            return '';
        } else {
            $.log.error(res.toString());
            throw res.toString();
        }
    }

    /*
     * @transformer customapi
     * @formula (customapi url:str) http GET url and output returned text
     * @labels twitch discord noevent commandevent customapi
     * @notes the command tag (token) can be placed in the url for a secret token saved via !tokencom or the panel
     * @notes if any args, $1-$9, are used in the url, the input event must be a CommandEvent, and the args are required to be provided by the user issuing the command or the tag will abort and return an error message instead
     * @notes this will output the full response from the remote url, so be careful not to cause spam or lock up the bot with a webpage
     * @example Caster: !addcom !joke (customapi http://not.real.com/joke.php?name=$1)
     * User: !joke bear
     * Bot: These jokes are un-bear-able
     */
    function customapi(args) {
        if (args.args) {
            let flag = false;
            if (args.event !== undefined && args.event.getArgs !== undefined) {
                args.args = args.args.replace(/\$([1-9])/g, function (m) {
                    let i = parseInt(m[1]);
                    if (!args.event.getArgs()[i - 1]) {
                        flag = true;
                        return m[0];
                    }
                    return args.event.getArgs()[i - 1];
                });
            }
            if (flag) {
                return {result: $.lang.get('customcommands.customapi.404')};
            }
            let response;
            try {
                response = getCustomAPIValue(args.args);
            } catch (ex) {
                return {result: $.lang.get('customcommands.customapijson.err')};
            }
            return {
                result: response,
                cache: false
            };
        }
    }

    /*
     * @transformer customapijson
     * @formula (customapijson url:str specs:str) httpGet url and extract json info according to specs
     * @labels twitch discord noevent commandevent customapi
     * @notes the command tag (token) can be placed in the url for a secret token saved via !tokencom or the panel
     * @notes if any args, $1-$9, are used in the url, the input event must be a CommandEvent, and they are required to be provided by the user issuing the command or the tag will abort and return an error message instead
     * @notes the response must be a JSONObject. arrays are only supported with a known index, walking arrays is not supported
     * @notes multiple specs can be provided, separated by spaces; curly braces can be used to enclose literal strings
     * @example Caster: !addcom !weather (customapijson http://api.apixu.com/v1/current.json?key=NOT_PROVIDED&q=$1 {Weather for} location.name {:} current.condition.text {Temps:} current.temp_f {F} current.temp_c {C})
     * User: !weather 80314
     * Bot: Weather for Boulder, CO : Sunny Temps: 75 F 24 C
     */
    let reCustomAPITextTag = new RegExp(/{([\w\W]+)}/);
    let JSONObject = Packages.org.json.JSONObject;
    function customapijson(args) {
        let match,
                customJSONStringTag,
                jsonCheckList,
                jsonItems,
                jsonObject,
                response,
                responsePart;
        if ((match = args.args.match(/^(\S+) (.+)$/))) {
            let flag = false;
            if (args.event !== undefined && args.event.getArgs !== undefined) {
                match[1] = match[1].replace(/\$([1-9])/g, function (m) {
                    let i = parseInt(m[1]);
                    if (!args.event.getArgs()[i - 1]) {
                        flag = true;
                        return m[0];
                    }
                    return args.event.getArgs()[i - 1];
                });
            }
            if (flag) {
                return {result: $.lang.get('customcommands.customapi.404')};
            }

            let result = '';
            try {
                response = getCustomAPIValue(match[1], accept_json);
            } catch (ex) {
                return {result: $.lang.get('customcommands.customapijson.err')};
            }

            jsonItems = match[2].split(' ');
            for (let j = 0; j < jsonItems.length; j++) {
                if (jsonItems[j].startsWith('{') && jsonItems[j].endsWith('}')) {
                    result += " " + jsonItems[j].match(reCustomAPITextTag)[1];
                } else if (jsonItems[j].startsWith('{') && !jsonItems[j].endsWith('}')) {
                    customJSONStringTag = '';
                    while (!jsonItems[j].endsWith('}')) {
                        customJSONStringTag += jsonItems[j++] + " ";
                    }
                    customJSONStringTag += jsonItems[j];
                    result += " " + customJSONStringTag.match(reCustomAPITextTag)[1];
                } else {
                    jsonCheckList = jsonItems[j].split('.');
                    if (jsonCheckList.length === 1) {
                        try {
                            responsePart = new JSONObject(response).get(jsonCheckList[0]);
                        } catch (ex) {
                            $.log.error('Failed to get data from API: ' + ex);
                            $.log.error(response.toString());
                            return {result: $.lang.get('customcommands.customapijson.err')};
                        }
                        result += responsePart;
                    } else {
                        for (i = 0; i < jsonCheckList.length - 1; i++) {
                            if (i === 0) {
                                try {
                                    jsonObject = new JSONObject(response).get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex);
                                    $.log.error('response:' + response.toString());
                                    return {result: $.lang.get('customcommands.customapijson.err')};
                                }
                            } else if (!isNaN(jsonCheckList[i + 1])) {
                                try {
                                    jsonObject = jsonObject.get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex);
                                    $.log.error('jsonCheckList[' + i + ']: ' + response.toString());
                                    return {result: $.lang.get('customcommands.customapijson.err')};
                                }
                            } else {
                                try {
                                    jsonObject = jsonObject.get(jsonCheckList[i]);
                                } catch (ex) {
                                    $.log.error('Failed to get data from API: ' + ex);
                                    $.log.error('jsonCheckList[' + i + ']: ' + jsonCheckList[i]);
                                    return {result: $.lang.get('customcommands.customapijson.err')};
                                }
                            }
                        }
                        try {
                            responsePart = jsonObject.get(jsonCheckList[i]);
                        } catch (ex) {
                            $.log.error('Failed to get data from API: ' + ex);
                            $.log.error('jsonCheckList[' + i + ']: ' + jsonCheckList[i]);
                            return {result: $.lang.get('customcommands.customapijson.err')};
                        }
                        result += responsePart;
                    }
                }
            }

            return {
                result: result,
                cache: false
            };
        }
    }

    /*
     * @transformer customapipost
     * @formula (customapipost url:str) http POST url and output returned text
     * @formula (customapipost url:str data:str) http POST url with body and output returned text
     * @labels twitch discord noevent commandevent customapi
     * @notes the command tag (token) can be placed in the url for a secret token saved via !tokencom or the panel
     * @notes if any args, $1-$9, are used in the url, the input event must be a CommandEvent, and the args are required to be provided by the user issuing the command or the tag will abort and return an error message instead
     * @notes this will output the full response from the remote url, so be careful not to cause spam or lock up the bot with a webpage
     * @example Caster: !addcom !addjoke (customapipost http://not.real.com/joke.php?name=$1 jokeBody=$2)
     * User: !addjoke bear These jokes are un-bear-able
     * Bot: Added joke with key 'bear'
     */
    function customapipost(args) {
        if (args.args) {
            let flag = false;
            if (args.event !== undefined && args.event.getArgs !== undefined) {
                args.args = args.args.replace(/\$([1-9])/g, function (m) {
                    let i = parseInt(m[1]);
                    if (!args.event.getArgs()[i - 1]) {
                        flag = true;
                        return m[0];
                    }
                    return args.event.getArgs()[i - 1];
                });
            }

            if (flag) {
                return {result: $.lang.get('customcommands.customapi.404')};
            }

            let response;
            try {
                let newArgs = $.parseArgs(args.args, ' ', 2);
                response = postCustomAPIValue(newArgs[0], newArgs[1]);
            } catch (ex) {
                $.consoleDebug(ex);
                return {result: $.lang.get('customcommands.customapijson.err')};
            }

            return {
                result: response,
                cache: false
            };
        }
    }

    let transformers = [
        new $.transformers.transformer('customapi', ['twitch', 'discord', 'noevent', 'commandevent', 'customapi'], customapi),
        new $.transformers.transformer('customapijson', ['twitch', 'discord', 'noevent', 'commandevent', 'customapi'], customapijson),
        new $.transformers.transformer('customapipost', ['twitch', 'discord', 'noevent', 'commandevent', 'customapi'], customapipost)
    ];

    $.transformers.addTransformers(transformers);
})();
