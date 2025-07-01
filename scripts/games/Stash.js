(function() {
    var rarityMap = {
        "Тайное": 0,
        "Засекреченное": 0.5,
        "Запрещённое": 1,
        "Армейское качество": 2,
        "Нож": 3,
        "яйца": 4,
        "Неизвестно": -1
    };

    function getInventoryFromServer(username) {
        try {
             
            var url = new java.net.URL("http://localhost:3000/getInventory?username=" + encodeURIComponent(username));
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
            var inventory = JSON.parse(response);
             
            if (!Array.isArray(inventory)) {
                $.log("Ошибка: ответ не массив");
                return null;
            }
            // Возвращаем массив строк rarity
            return inventory.map(function(item) {
                var rarityValue = "Неизвестно";
                if (item.rarity != null) {
                    if (typeof item.rarity === 'string') {
                        rarityValue = item.rarity;
                    } else if (typeof item.rarity === 'object') {
                        if (item.rarity.type && typeof item.rarity.type === 'string') {
                            rarityValue = item.rarity.type;
                        } else {
                            try {
                                rarityValue = JSON.stringify(item.rarity);
                            } catch (e) {
                                rarityValue = "Неизвестно";
                            }
                           
                        }
                    } else {
                        rarityValue = String(item.rarity);
                    }
                }
                return rarityValue; // <--- возвращаем просто строку!
            });
           
        } catch (e) {
            $.say("Ошибка при получении инвентаря: " + e);
            return null;
        }
    }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand();

        if ($.equalsIgnoreCase(command, 'инвентарь')) {
            var inventory = getInventoryFromServer(sender);
            if (!inventory || inventory.length === 0) {
                $.say('@' + sender + ', твой инвентарь пуст.')
                $.say(inventory);
                return;
            }

            // Считаем количество по каждой rarity
            var rarityCounts = {};
            inventory.forEach(function(rarityKey) {
                if (typeof rarityKey !== 'string') rarityKey = 'Неизвестно';
                if (!rarityCounts[rarityKey]) {
                    rarityCounts[rarityKey] = 0;
                }
                rarityCounts[rarityKey]++;
            });

            // Формируем строку для чата
            var inventoryStr = Object.keys(rarityCounts).map(function(rarity) {
                return rarity + ' - ' + rarityCounts[rarity];
            }).join(' | ');

            if (inventoryStr.length > 400) {
                inventoryStr = inventoryStr.substring(0, 400) + '...';
            }

            $.say('@' + sender + ', твой инвентарь: ' + inventoryStr);
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/Stash.js', 'инвентарь');
    });
})();
