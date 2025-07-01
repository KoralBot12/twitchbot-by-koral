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

// If we can sroll the event log or not.
var canScroll = true;

// Function that querys all of the data we need.
$(function () {
    $('.event-log').closest('form').resizable({
        handles: "s",
        alsoResize: ".event-log",
        minHeight: "150"
    });
    // Query our panel settings first.
    socket.getDBValues('panel_get_settings', {
        tables: ['panelData', 'panelData', 'modules'],
        keys: ['isDark', 'isReverseSortEvents', './systems/commercialSystem.js']
    }, true, function (e) {
        helpers.isDark = helpers.isTrue(e.isDark);
        helpers.isReverseSortEvents = helpers.isTrue(e.isReverseSortEvents);

        // Handle the dark mode skins.
        helpers.handleDarkMode(helpers.isDark, true);
        // Handle the dark mode toggle.
        $('#dark-mode-toggle').prop('checked', helpers.isDark);
        // Update event toggle.
        $('#toggle-reverse-events').prop('checked', helpers.isReverseSortEvents);

        // Disable instant commercials if the module is disabled
        if (!helpers.isTrue(e['./systems/commercialSystem.js'])) {
            $('#grp-instant-commercial').addClass('hidden');
        } else {
            $('#instant-commercial-length').select2({
                placeholder: 'Commercial length, in seconds.',
                width: '100%'
            }).tooltip('disable');
        }

        // Query recent events.
        socket.getDBValue('dashboard_get_events', 'panelData', 'data', function (e) {
            if (e.panelData !== null && e.panelData.length > 0) {
                let events = JSON.parse(e.panelData);

                // This should never be null unless the user removes the DB table.
                if (events !== null) {
                    for (let i = 0; i < events.length; i++) {
						if (isNaN(events[i].date)) {
							try {
								events[i]._date = Date.parse(events[i].date);
							} catch (e) {
								helpers.logError(e);
								events[i]._date = 0;
							}
						} else {
							events[i]._date = events[i].date;
						}
					}

                    // Sort events if needed.
                    if (helpers.isReverseSortEvents) {
                        events.sort(function (a, b) {
                            return b._date - a._date;
                        });
                    } else {
                        events.sort(function (a, b) {
                            return a._date - b._date;
                        });
                    }

                    let htmlEvents = $('<ul/>', {
                        'class': 'recent-events'
                    });
                    for (let i = 0; i < events.length; i++) {
                        let tb = $('<table/>');
                        let p = $('<tr/>');

                        // Append date.
                        p.append($('<td/>', {
                            'class': 'event-date',
                            'html': helpers.getPaddedDateString(new Date(events[i].date).toLocaleString())
                        }));

                        // Append type.
                        p.append($('<td/>', {
                            'class': 'label event-type',
                            'style': helpers.getEventColor(events[i].type),
                            'html': events[i].type
                        }));

                        // Append message.
                        p.append($('<td/>', {
                            'html': helpers.getEventMessage(events[i])
                        }));

                        tb.append(p);

                        if (typeof events[i].message === "string" && events[i].message.length > 0) {
                            let p = $('<tr/>');

                            // Append date.
                            p.append($('<td/>', {
                                'html': '&nbsp;'
                            }));

                            // Append type.
                            p.append($('<td/>', {
                                'html': '&nbsp;'
                            }));

                            // Append message.
                            p.append($('<td/>', {
                                'class': 'event-message',
                                'html': events[i].message
                            }));

                            tb.append(p);
                        }

                        // Append to list.
                        htmlEvents.append($('<li/>').append(tb));
                    }

                    // Append the information to the main div.
                    htmlEvents.appendTo($('.event-log'));
                }
            }

            // Query panel information.
            socket.getDBValue('dashboard_get_data', 'panelData', 'stream', function (e) {
                if (e.panelData === null) {
                    socket.wsEvent('panelDataRefresh', './core/panelHandler.js', '', [], function (e) {});
                    e = {'title': 'Initializing...', 'game': 'Initializing...', 'isLive': false, 'uptime': 'Init', 'chatters': 0, 'viewers': 0, 'followers': 0, 'subs': 0};
                } else {
                    // Parse our object.
                    e = JSON.parse(e.panelData);
                }
                // Temp data.
                const tempData = e;
                // Set stream title.
                $('#stream-title').val(e.title);
                // Set stream game.
                if ($('#stream-game').find('option[value="' + e.game.replaceAll('"', '\\"') + '"]').length) {
                    $('#stream-game').val(e.game).trigger('change');
                } else {
                    // Create a DOM Option and pre-select by default
                    let newOption = new Option(e.game, e.game, true, true);
                    // Append it to the select
                    $('#stream-game').append(newOption).trigger('change');
                }
                // Set uptime.
                if (e.isLive) {
                    $('#dashboard-uptime').html(e.uptime);
                    $('#bg-uptime').removeClass('bg-red').addClass('bg-green');
                } else {
                    $('#dashboard-uptime').html('Offline');
                    $('#bg-uptime').removeClass('bg-green').addClass('bg-red');
                }

                // Query panel commands.
                socket.getDBTableValues('dashboard_get_commands', 'command', function (e) {
                    // Sort commands.
                    e.sort(function (a, b) {
                        return a.key.localeCompare(b.key);
                    });

                    // Generate command list.
                    for (let i = 0; i < e.length; i++) {
                        $('#custom-command-run').append($('<option/>', {
                            'text': '!' + e[i].key
                        }));
                    }

                    // Enable the select2 dropdown.
                    $('#custom-command-run').select2({
                        placeholder: 'Select a Command to Run'
                    }).tooltip('disable');

                    socket.getDBValues('dashboard_get_panel_toggles', {
                        tables: ['panelData', 'panelData'],
                        keys: ['hasChat', 'hasPlayer']
                    }, true, function (e) {
                        e.hasChat = (helpers.isTrue(e.hasChat) || e.hasChat === null);
                        e.hasPlayer = (helpers.isTrue(e.hasPlayer) || e.hasPlayer === null);

                        // Handle adding the chat.
                        if (e.hasChat && helpers.canEmbedTwitch()) {
                            $('#twitch-chat-iframe').html($('<iframe/>', {
                                'frameborder': '0',
                                'scrolling': 'no',
                                'style': 'width: 100%; height: 450px; margin-bottom: -5px;',
                                'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout&' : '?') + 'parent=' + location.hostname
                            }));
                        } else if (e.hasChat && helpers.currentPanelUserData.userType === 'CONFIG') {
                            $('#twitch-chat-iframe').html(helpers.CANT_EMBED_TWITCH_TEXT);
                            $('#twitch-chat-iframe').addClass('box-body');
                        } else {
                            $('#twitch-chat-box').addClass('off');
                        }

                        // Handle adding the player.
                        if (e.hasPlayer && helpers.canEmbedTwitch()) {
                            // Add the player.
                            $('#twitch-player-iframe').html($('<iframe/>', {
                                'frameborder': '0',
                                'scrolling': 'no',
                                'style': 'width: 100%; height: 450px; margin-bottom: -5px;',
                                'src': 'https://player.twitch.tv/?channel=' + getChannelName() + '&muted=true&autoplay=false' + '&parent=' + location.hostname
                            }));
                        } else if (e.hasPlayer && helpers.currentPanelUserData.userType === 'CONFIG') {
                            $('#twitch-player-iframe').html(helpers.CANT_EMBED_TWITCH_TEXT);
                            $('#twitch-player-iframe').addClass('box-body');
                        } else {
                            $('#twitch-player-box').addClass('off');
                        }

                        // Handle box sizes.
                        $('#twitch-chat-box').prop('class', (!e.hasPlayer ? 'col-md-12' : 'col-md-6'));
                        $('#twitch-player-box').prop('class', (!e.hasChat ? 'col-md-12' : 'col-md-6'));

                        // Handle toggles.
                        $('#toggle-chat').prop('checked', e.hasChat);
                        $('#toggle-player').prop('checked', e.hasPlayer);

                        // This will be called once the css and everything is loaded.
                        $(document).ready(function () {
                            // Done loading, show main page.
                            $.showPage();
                            // Scroll to bottom of event log.
                            $('.event-log').scrollTop((helpers.isReverseSortEvents ? ($('.event-log').scrollTop() - $('.recent-events').height()) : $('.recent-events').height()));
                            // Set viewers.
                            helpers.handlePanelSetInfo($('#dashboard-viewers').data('number', helpers.parseNumber(tempData.viewers)), 'dashboard-viewers', helpers.fixNumber(tempData.viewers));
                            // Set followers.
                            helpers.handlePanelSetInfo($('#dashboard-followers').data('number', helpers.parseNumber(tempData.followers)), 'dashboard-followers', helpers.fixNumber(tempData.followers));
                            helpers.handlePanelSetInfo($('#dashboard-subs').data('number', helpers.parseNumber(tempData.subs)), 'dashboard-subs', helpers.fixNumber(tempData.subs));
                        });
                    });
                });
            });
        });
    });
});


// Function that handlers the loading of events.
$(function () {
    let games = {};
    let isDoneGames = false;
    function getGames(params) {
        isDoneGames = false;
        socket.doRemote('games', 'games', {
            'search': params.data.q
        }, function (e) {
            if (e.results && e.results.length > 0 && !e.results[0].errors) {
                games = e;
            } else {
                games = false;
            }
            isDoneGames = true;
        });
    }

    async function checkIfGamesDoneAsync() {
        return isDoneGames;
    }

    $('#stream-game').select2({
        ajax: {
            transport: async function(params, success, failure) {
                getGames(params);

                await helpers.promisePoll(() => checkIfGamesDoneAsync(), {pollIntervalMs: 100});

                if (games === false) {
                    failure('500');
                } else {
                    success(games);
                }
            }
        },
        tags: true,
        width: '100%'
    });

    // Input check for strings.
    $('input[data-str="text"]').on('input', function () {
        helpers.handleInputString($(this));
    });

    // Handle the hidding of the dashboard panels.
    $('#dashboard-subs, #dashboard-followers, #dashboard-viewers').on('click', function (e) {
        helpers.handlePanelToggleInfo($(this), e.target.id);
    });

    $(function () {
        $('#dashboard-title').text(getChannelName() + " | Dashboard");
    });

    $(window).resize(function () {
        $('.small-box').each(function () {
            const h3 = $(this).find('h3');

            if (h3.attr('id') !== 'dashboard-uptime') {
                helpers.handlePanelSetInfo(h3, h3.attr('id'), h3.data('parsed'));
            }
        });
    });

    // Handle updating the title, game.
    $('#dashboard-btn-update').on('click', function () {
        // Update title.
        socket.sendCommand('update_title', 'settitlesilent ' + $('#stream-title').val(), function () {
            // Update game.
            socket.sendCommand('update_game', 'setgamesilent ' + $('#stream-game').val(), function () {
                toastr.success('Successfully updated stream information!');
            });
        });
    });

    // Handle user action button.
    $('.user-action').on('click', function () {
        let action = $(this).find('a').html().toLowerCase(),
                username = $('#user-action-user').val(),
                command;

        if (username.length < 1) {
            return;
        }

        switch (action) {
            case 'permit':
                command = 'permit ' + username;
                break;
            case 'shoutout':
                command = 'shoutout ' + username;
                break;
            case 'raid':
                command = 'raid ' + username;
                break;
        }

        // Run the command.
        socket.sendCommand('user_action_cmd', command, function () {
            // Clear the input.
            $('#user-action-user').val('');
            // Let the user know.
            toastr.success('Successfully ran action on ' + username + '!');
        });
    });

    // Handle custom command run.
    $('#custom-command-run').on('select2:select', function (e) {
        socket.sendCommand('send_command', e.params.data.text.slice(1), function () {
            // Alert user.
            toastr.success('Successfully ran command ' + e.params.data.text);
            // Clear input.
            $('#custom-command-run').val('').trigger('change');
        });
    });

    // Handle running a commercial.
    $('#dashboard-btn-instant-commercial').on('click', function () {
        if ($('#instant-commercial-length').val() === "") {
            toastr.error('Please select a commercial length');
            return;
        }
        socket.sendCommand('instant_commercial', 'commercial ' + $('#instant-commercial-length').val() + ($('#instant-commercial-silent').is(':checked') ? ' silent' : ''), function () {
            toastr.success('Successfully ran a commercial!');
        });
    });

    // Handle sending as bot.
    $('#dashboard-btn-msg-bot').on('click', function () {
        if ($('#msg-bot').val() === "") {
            toastr.error('Please enter a message');
            return;
        }
        socket.sendCommand('msg-bot', 'echo ' + $('#msg-bot').val(), function () {
            toastr.success('Successfully sent a message as the bot!');
        });
    });

    // Mouse hover/leave event log.
    $('.event-log').on('mouseenter mouseleave', function (event) {
        canScroll = event.type === 'mouseleave';
    });

    // Handle player toggle
    $('#toggle-player').off().on('click', function () {
        let checked = $(this).is(':checked');

        // Update the toggle.
        socket.updateDBValue('panel_chat_toggle', 'panelData', 'hasPlayer', checked, function () {
            if (checked && helpers.canEmbedTwitch()) {
                $('#twitch-player-iframe').html($('<iframe/>', {
                    'frameborder': '0',
                    'scrolling': 'no',
                    'style': 'width: 100%; height: 450px; margin-bottom: -5px;',
                    'src': 'https://player.twitch.tv/?channel=' + getChannelName() + '&muted=true&autoplay=false' + '&parent=' + location.hostname
                }));
                // Handle the box size.
                if ($('#twitch-chat-iframe').html().length > 0) {
                    $('#twitch-player-box').prop('class', 'col-md-6').removeClass('off');
                    $('#twitch-chat-box').prop('class', 'col-md-6');
                } else {
                    $('#twitch-player-box').prop('class', 'col-md-12');
                }
            } else if (checked) {
                $('#twitch-player-iframe').html(helpers.CANT_EMBED_TWITCH_TEXT);
                $('#twitch-player-iframe').addClass('box-body');
                // Handle the box size.
                if ($('#twitch-chat-iframe').html().length > 0) {
                    $('#twitch-player-box').prop('class', 'col-md-6').removeClass('off');
                    $('#twitch-chat-box').prop('class', 'col-md-6');
                } else {
                    $('#twitch-player-box').prop('class', 'col-md-12');
                }
            } else {
                $('#twitch-player-iframe').html('');
                $('#twitch-player-box').addClass('off');
                $('#twitch-chat-box').prop('class', 'col-md-12');
            }
        });
    });

    // Handle chat toggle.
    $('#toggle-chat').off().on('click', function () {
        let checked = $(this).is(':checked');

        // Update the toggle.
        socket.updateDBValue('panel_chat_toggle', 'panelData', 'hasChat', checked, function () {
            if (checked && helpers.canEmbedTwitch()) {
                $('#twitch-chat-iframe').html($('<iframe/>', {
                    'frameborder': '0',
                    'scrolling': 'no',
                    'style': 'width: 100%; height: 450px; margin-bottom: -5px;',
                    'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout&' : '?') + 'parent=' + location.hostname
                }));

                // Handle the box size.
                if ($('#twitch-player-iframe').html().length > 0) {
                    $('#twitch-chat-box').prop('class', 'col-md-6').removeClass('off');
                    $('#twitch-player-box').prop('class', 'col-md-6');
                } else {
                    $('#twitch-chat-box').prop('class', 'col-md-12');
                }
            } else if (checked) {
                $('#twitch-chat-iframe').html(helpers.CANT_EMBED_TWITCH_TEXT);
                $('#twitch-chat-iframe').addClass('box-body');
                // Handle the box size.
                if ($('#twitch-player-iframe').html().length > 0) {
                    $('#twitch-chat-box').prop('class', 'col-md-6').removeClass('off');
                    $('#twitch-player-box').prop('class', 'col-md-6');
                } else {
                    $('#twitch-chat-box').prop('class', 'col-md-12');
                }
            } else {
                $('#twitch-chat-iframe').html('');
                $('#twitch-chat-box').addClass('off');
                $('#twitch-player-box').prop('class', 'col-md-12');
            }
        });
    });

    // Event sorting toggle.
    $('#toggle-reverse-events').off().on('click', function () {
        socket.updateDBValue('event_sort_update', 'panelData', 'isReverseSortEvents', $(this).is(':checked'), function () {
            window.location.reload();
        });
    });

    // Set an interval that updates basic panel info every 10 seconds.
    helpers.setInterval(function () {
        helpers.log('Refreshing dashboard data.', helpers.LOG_TYPE.INFO);
        // Query stream data.
        socket.getDBValue('dashboard_get_data_refresh', 'panelData', 'stream', function (e) {
            if (e.panelData === null) {
                socket.wsEvent('panelDataRefresh', './core/panelHandler.js', '', [], function (e) {});
                e = {'title': 'Initializing...', 'game': 'Initializing...', 'isLive': false, 'uptime': 'Init', 'chatters': 0, 'viewers': 0, 'followers': 0, 'subs': 0};
            } else {
                // Parse our object.
                e = JSON.parse(e.panelData);
            }
            // Set viewers.
            helpers.handlePanelSetInfo($('#dashboard-viewers').data('number', helpers.parseNumber(e.viewers)), 'dashboard-viewers', helpers.fixNumber(e.viewers));
            // Set followers.
            helpers.handlePanelSetInfo($('#dashboard-followers').data('number', helpers.parseNumber(e.followers)), 'dashboard-followers', helpers.fixNumber(e.followers));
            helpers.handlePanelSetInfo($('#dashboard-subs').data('number', helpers.parseNumber(e.subs)), 'dashboard-subs', helpers.fixNumber(e.subs));
            // Set uptime.
            if (e.isLive) {
                $('#dashboard-uptime').html(e.uptime);
                $('#bg-uptime').removeClass('bg-red').addClass('bg-green');
            } else {
                $('#dashboard-uptime').html('Offline');
                $('#bg-uptime').removeClass('bg-green').addClass('bg-red');
            }
        });

        // Query event log.
        socket.getDBValue('dashboard_get_events_refresh', 'panelData', 'data', function (e) {
            if (e.panelData !== null && e.panelData.length > 0) {
                let events = JSON.parse(e.panelData);

                // This should never be null unless the user removes the DB table.
                if (events !== null) {
                    for (let i = 0; i < events.length; i++) {
						if (isNaN(events[i].date)) {
							try {
								events[i]._date = Date.parse(events[i].date);
							} catch (e) {
								helpers.logError(e);
								events[i]._date = 0;
							}
						} else {
							events[i]._date = events[i].date;
						}
					}

                    // Sort events if needed.
                    if (helpers.isReverseSortEvents) {
                        events.sort(function (a, b) {
                            return b._date - a._date;
                        });
                    } else {
                        events.sort(function (a, b) {
                            return a._date - b._date;
                        });
                    }

                    let htmlEvents = $('<ul/>', {
                        'class': 'recent-events'
                    });
                    for (let i = 0; i < events.length; i++) {
                        let tb = $('<table/>');
                        let p = $('<tr/>');

                        // Append date.
                        p.append($('<td/>', {
                            'class': 'event-date',
                            'html': helpers.getPaddedDateString(new Date(events[i].date).toLocaleString())
                        }));

                        // Append type.
                        p.append($('<td/>', {
                            'class': 'label event-type',
                            'style': helpers.getEventColor(events[i].type),
                            'html': events[i].type
                        }));

                        // Append message.
                        p.append($('<td/>', {
                            'html': helpers.getEventMessage(events[i])
                        }));

                        tb.append(p);

                        if (typeof events[i].message === "string" && events[i].message.length > 0) {
                            let p = $('<tr/>');

                            // Append date.
                            p.append($('<td/>', {
                                'html': '&nbsp;'
                            }));

                            // Append type.
                            p.append($('<td/>', {
                                'html': '&nbsp;'
                            }));

                            // Append message.
                            p.append($('<td/>', {
                                'class': 'event-message',
                                'html': events[i].message
                            }));

                            tb.append(p);
                        }

                        // Append to list.
                        htmlEvents.append($('<li/>').append(tb));
                    }

                    // Append the information to the main div.
                    $('.event-log').html(htmlEvents);
                    // Scroll to bottom of event log if the user isn't checking it.
                    if (canScroll) {
                        $('.event-log').scrollTop((helpers.isReverseSortEvents ? ($('.event-log').scrollTop() - $('.recent-events').height()) : $('.recent-events').height()));
                    }
                }
            }
        });
    }, 1e4);
});
