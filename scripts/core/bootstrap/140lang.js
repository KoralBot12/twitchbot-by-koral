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

/**
 * lang.js
 *
 * Provide a language API
 * Use the $.lang API
 */
(function() {
    let data = [];

    /**
     * @function load
     */
    function load(force) {
        let curLang = $.getSetIniDbString('settings', 'lang', 'english');
        loadLang('./lang/english', force);
        if (curLang !== 'english') {
            loadLang('./lang/' + curLang, force);
        }

        if ($.isDirectory('./scripts/lang/custom')) {
            loadLang('./lang/custom', force);
        }
    }

    function loadLang(path, force) {
        $.bot.loadScriptRecursive(path, true, (force ? force : false));
        loadJSON(path);
    }

    function loadJSON(path) {
        if (!path.startsWith('./scripts/')) {
            path = './scripts/' + path;
        }

        let files = $.findFiles(path, '');

        for (let x in files) {
            let fPath = path + '/' + files[x];
            try {
                if ($.isDirectory(fPath)) {
                    loadJSON(fPath);
                } else if (fPath.endsWith('.json')) {
                    let jso = JSON.parse($.readFileString(fPath).trim());
                    for (let y in jso) {
                        register(y, jso[y]);
                    }
                }
            } catch (e) {
                $.log.error('Error loading ' + fPath);
                $.log.error(e);
            }
        }
    }

    /**
     * @function register
     * @export $.lang
     * @param {string} key
     * @param {string} string
     */
    function register(key, string) {
        if (key && string) {
            data[key.toLowerCase()] = string;
        }
        if (key && string.length === 0) {
            data[key.toLowerCase()] = '<<EMPTY_PLACEHOLDER>>';
        }
    }

    /**
     * @function get
     * @export $.lang
     * @param {string} key
     * @returns {string}
     */
    function get(key) {
        let string = data[key.toLowerCase()],
            i;

        if (string === undefined) {
            $.log.warn('Lang string for key "' + key + '" was not found.');
            return '';
        }

        if (string === '<<EMPTY_PLACEHOLDER>>') {
            return '';
        }

        for (i = 1; i < arguments.length; i++) {
            while (string.indexOf("$" + i) >= 0) {
                string = string.replace("$" + i, arguments[i]);
            }
        }
        return string;
    }

    /**
     * @function paramCount
     * @export $.lang
     * @param {string} key
     * @returns {Number}
     */
    function paramCount(key) {
        let string = data[key.toLowerCase()],
            i,
            ctr = 0;

        if (!string) {
            return 0;
        }

        for (i = 1; i < 99; i++) {
            if (string.indexOf("$" + i) >= 0) {
                ctr++;
            } else {
                break;
            }
        }
        return ctr;
    }

    /**
     * @function exists
     * @export $.lang
     * @param {string} key
     * @returns {boolean}
     */
    function exists(key) {
        return key !== undefined && key !== null && data[key.toLowerCase()] !== undefined && data[key.toLowerCase()] !== null;
    }

    $.bind('webPanelSocketUpdate', function (event) {
        if ($.equalsIgnoreCase(event.getScript(), 'core/bootstrap/lang')) {
            if ($.equalsIgnoreCase(event.getId(), 'langUpdated')) {
                load(true);
            }
        }
    });

    /** Export functions to API */
    $.lang = {
        exists: exists,
        get: get,
        register: register,
        paramCount: paramCount,
        load: load
    };

    load();
})();