(function() {
    var prizes = [],
        allowWhenOffline = $.getSetIniDbBoolean('rollprizes', 'allowWhenOffline', true);

    $.getSetIniDbNumber('rollprizes', 'prizes_0', 4);
    $.getSetIniDbNumber('rollprizes', 'prizes_1', 16);
    $.getSetIniDbNumber('rollprizes', 'prizes_2', 36);
    $.getSetIniDbNumber('rollprizes', 'prizes_3', 64);
    $.getSetIniDbNumber('rollprizes', 'prizes_4', 100);
    $.getSetIniDbNumber('rollprizes', 'prizes_5', 144);

    function loadPrizes() {
        prizes[0] = $.getSetIniDbNumber('rollprizes', 'prizes_0', 4);
        prizes[1] = $.getSetIniDbNumber('rollprizes', 'prizes_1', 16);
        prizes[2] = $.getSetIniDbNumber('rollprizes', 'prizes_2', 36);
        prizes[3] = $.getSetIniDbNumber('rollprizes', 'prizes_3', 64);
        prizes[4] = $.getSetIniDbNumber('rollprizes', 'prizes_4', 100);
        prizes[5] = $.getSetIniDbNumber('rollprizes', 'prizes_5', 144);
        allowWhenOffline = $.getSetIniDbBoolean('rollprizes', 'allowWhenOffline', true);
    }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            dice1,
            dice2,
            resultMessage;

        if ($.equalsIgnoreCase(command, 'roll')) {

            if (args[0] !== undefined) {
                if ($.equalsIgnoreCase(args[0], 'rewards')) {
                    if (args.length !== 7 || args.slice(1).some(isNaN)) {
                        loadPrizes();
                        $.say($.whisperPrefix(sender) + 'Использование: !roll rewards [очки за двойку 1] [2] [3] [4] [5] [6]. Текущие награды: ' + prizes.join(' '));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + 'Награды успешно обновлены.');
                    $.inidb.set('rollprizes', 'prizes_0', args[1]);
                    $.inidb.set('rollprizes', 'prizes_1', args[2]);
                    $.inidb.set('rollprizes', 'prizes_2', args[3]);
                    $.inidb.set('rollprizes', 'prizes_3', args[4]);
                    $.inidb.set('rollprizes', 'prizes_4', args[5]);
                    $.inidb.set('rollprizes', 'prizes_5', args[6]);
                    return;
                }

                if ($.equalsIgnoreCase(args[0], 'rolloffline')) {
                    allowWhenOffline = !allowWhenOffline;
                    $.setIniDbBoolean('rollprizes', 'allowWhenOffline', allowWhenOffline);
                    $.say($.whisperPrefix(sender) + (allowWhenOffline ? 'Роллы теперь разрешены, когда канал офлайн.' : 'Роллы теперь запрещены, когда канал офлайн.'));
                    return;
                }
            }

            if (!allowWhenOffline && !$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + 'Роллы запрещены, когда канал офлайн.');
                return;
            }

            dice1 = $.randRange(1, 6);
            dice2 = $.randRange(1, 6);
            resultMessage = $.resolveRank(sender) + ' бросает кубики и получает: ' + dice1 + ' и ' + dice2 + '.';

            if (dice1 === dice2) {
                loadPrizes();
                var rewardText = '';
                switch (dice1) {
                    case 1:
                        rewardText = ' Выпали две единицы! Вы выиграли ' + $.getPointsString(prizes[dice1 - 1]) + '!';
                        break;
                    case 2:
                        rewardText = ' Выпали две двойки! Вы выиграли ' + $.getPointsString(prizes[dice1 - 1]) + '!';
                        break;
                    case 3:
                        rewardText = ' Выпали две тройки! Вы выиграли ' + $.getPointsString(prizes[dice1 - 1]) + '!';
                        break;
                    case 4:
                        rewardText = ' Выпали две четвёрки! Вы выиграли ' + $.getPointsString(prizes[dice1 - 1]) + '!';
                        break;
                    case 5:
                        rewardText = ' Выпали две пятёрки! Вы выиграли ' + $.getPointsString(prizes[dice1 - 1]) + '!';
                        break;
                    case 6:
                        rewardText = ' Выпали две шестёрки! Вы выиграли ' + $.getPointsString(prizes[dice1 - 1]) + '!';
                        break;
                }

                $.say(resultMessage + rewardText + ' ' + $.gameMessages.getWin(sender, 'roll'));
                $.inidb.incr('points', sender, prizes[dice1 - 1]);
            } else {
                $.say(resultMessage + ' ' + $.gameMessages.getLose(sender, 'roll'));
            }
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/roll.js', 'roll');
        $.registerChatSubcommand('roll', 'rewards', $.PERMISSION.Admin);
        $.registerChatSubcommand('roll', 'rolloffline', $.PERMISSION.Admin);
    });

    $.loadPrizes = loadPrizes;
})();
