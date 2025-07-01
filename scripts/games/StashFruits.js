(function() {
    // Карта редкостей для сортировки и вывода
    var rarityOrder = [
        "Редчайший",
        "Легендарный",
        "Эпический",
        "Редкий",
        "Необычный",
        "Обычный",
        "Неизвестно"
    ];

    // Получение данных о фруктах пользователя с сервера
    function getFruitsFromServer(user_name) {
        try {
            var url = new java.net.URL("http://localhost:3000/getFruits?user_name=" + encodeURIComponent(user_name));
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
            var fruits = JSON.parse(response);
            return fruits; // объект вида { "Эпический": 1, "Редкий": 2, ... }
        } catch (e) {
            $.say("Ошибка при получении фруктов: " + e);
            return null;
        }
    }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand();

        if ($.equalsIgnoreCase(command, 'ванпис')) {
            var fruits = getFruitsFromServer(sender);
            if (!fruits || Object.keys(fruits).length === 0) {
                $.say('@' + sender + ', у тебя нет фруктов.');
                return;
            }

            // Формируем строку для чата с сортировкой по редкости
            var fruitStr = rarityOrder
                .filter(function(rarity) { return fruits[rarity]; })
                .map(function(rarity) { return rarity + ' - ' + fruits[rarity]; })
                .join(', ');

            if (fruitStr.length > 400) {
                fruitStr = fruitStr.substring(0, 400) + '...';
            }

            $.say('@' + sender + ', твои фрукты: ' + fruitStr);
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/StashFruits.js', 'ванпис');
    });
})();