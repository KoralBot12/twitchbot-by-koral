(function() {
    var prizes = [];
    var allowWhenOffline = $.getSetIniDbBoolean('slotprizes', 'allowWhenOffline', true);
    var symbols = ['🍒', '🍋', '🍇', '🔔', '💎', '⭐'];

    // Устанавливаем дефолтные призы
    $.getSetIniDbNumber('slotprizes', 'prizes_0', 10);
    $.getSetIniDbNumber('slotprizes', 'prizes_1', 20);
    $.getSetIniDbNumber('slotprizes', 'prizes_2', 50);
    $.getSetIniDbNumber('slotprizes', 'prizes_3', 100);
    $.getSetIniDbNumber('slotprizes', 'prizes_4', 200);
    $.getSetIniDbNumber('slotprizes', 'prizes_5', 500);

    function loadPrizes() {
        for (var i = 0; i < 6; i++) {
            prizes[i] = $.getSetIniDbNumber('slotprizes', 'prizes_' + i, prizes[i] || 0);
        }
        allowWhenOffline = $.getSetIniDbBoolean('slotprizes', 'allowWhenOffline', true);
    }

    function getRandomSymbolIndex() {
        return $.randRange(0, symbols.length - 1);
    }

    // Функция для отправки изменения баланса на сервер
    function saveCasinoBalance(user_name, balance) {
        try {
            var url = new java.net.URL("http://localhost:3000/saveCasino");
            var conn = url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setDoOutput(true);

            var json = JSON.stringify({ user_name: user_name, balance: balance });
            var writer = new java.io.OutputStreamWriter(conn.getOutputStream(), "UTF-8");
            writer.write(json);
            writer.close();

            var responseCode = conn.getResponseCode();
            // Можно добавить обработку ответа, если нужно
        } catch (e) {
            $.consoleLn("[slotMachine] Ошибка при сохранении баланса casino: " + e);
        }
    }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs();

        if ($.equalsIgnoreCase(command, 'дэп')) {

            if (!allowWhenOffline && !$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + 'Игра в слот недоступна, пока канал оффлайн.');
                return;
            }

            loadPrizes();

            var s1 = getRandomSymbolIndex();
            var s2 = getRandomSymbolIndex();
            var s3 = getRandomSymbolIndex();
            
            var output = '@'+ sender + '[🎰] ' + symbols[s1] + ' | ' + symbols[s2] + ' | ' + symbols[s3] + ' → ';
            var reward = 0;
            var resultMsg = '';
            var bet = 10; // Ставка за игру

            var isJackpot = (s1 === s2 && s2 === s3);
            var isPartial = (s1 === s2 || s2 === s3 || s1 === s3);

            if (isJackpot) {
                // Три одинаковых символа — джекпот!
                reward = prizes[s1];
                resultMsg = '🎉 Джекпот! Вы выиграли ' + reward + ' очков!';
                // Не списываем ставку
            } else if (isPartial) {
                // Два одинаковых символа — частичная награда
                var matched = (s1 === s2) ? s1 : (s2 === s3 ? s2 : s1);
                reward = Math.floor(prizes[matched] * 0.4);
                resultMsg = '😉 Почти! Вы получаете ' + reward + ' очков.';
                // Не списываем ставку
            } else {
                // Списываем ставку только если не совпало ни два, ни три символа
                saveCasinoBalance(sender, -bet);
                resultMsg = '😢 Увы, не повезло. Попробуйте ещё!';
            }

            if (reward > 0) {
                // Начисление выигрыша
                saveCasinoBalance(sender, reward);
            }

            $.say(output + resultMsg);
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/slotMachine.js', 'дэп');
    });

})();
