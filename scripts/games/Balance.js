(function() {

    function getBalanceFromServer(username) {
        try {
            var url = new java.net.URL("http://localhost:3000/getCasino?user_name=" + encodeURIComponent(username));
            var conn = url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");
            conn.connect();

            var inputStream = conn.getInputStream();
            var reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream));
            var line;
            var response = '';
            while ((line = reader.readLine()) != null) {
                response += line;
            }
            reader.close();

            var data = JSON.parse(response);
            if (typeof data.balance === 'number') {
                return data.balance;
            } else {
                return null;
            }

        } catch (e) {
            $.consoleLn("Ошибка при получении баланса: " + e);
            return null;
        }
    }

    // Обработчик команды "баланс"
    function command_balance(sender) {
        var balance = getBalanceFromServer(sender);
        if (balance === null) {
            $.say('@' + sender + ', не удалось получить твой баланс.');
        } else if (balance < 0) {
            $.say('@' + sender + ', твой баланс: ' + balance + ' бэлли, за тобой должок!');
        } else {
            $.say('@' + sender + ', твой баланс: ' + balance + ' бэлли.');
        }
    }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand();

        if ($.equalsIgnoreCase(command, 'баланс')) {
            command_balance(sender);
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/Balance.js', 'баланс');
    });

})();