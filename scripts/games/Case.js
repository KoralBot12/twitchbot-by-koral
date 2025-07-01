(function() {
    var wearCategories = [
        'Прямо с завода',
        'Слегка поношенное',
        'После полевых испытаний',
        'Поношенное',
        'Закалённое в боях'
    ];

    var skins = [
        { name: 'AWP | Printstream', rarity: 'Тайное', chance: 0.5 },
        { name: 'FAMAS | Bad Trip', rarity: 'Тайное', chance: 0.5 },
        { name: 'Glock-18 | Shinobu', rarity: 'Засекреченное', chance: 1.66 },
        { name: 'AK-47 | Searing Rage', rarity: 'Засекреченное', chance: 1.67 },
        { name: 'UMP-45 | K.O. Factory', rarity: 'Засекреченное', chance: 1.67 },
        { name: 'Desert Eagle | Serpent Strike', rarity: 'Запрещённое', chance: 4 },
        { name: 'Galil AR | Control', rarity: 'Запрещённое', chance: 4 },
        { name: 'Nova | Rising Sun', rarity: 'Запрещённое', chance: 4 },
        { name: 'P90 | Wave Breaker', rarity: 'Запрещённое', chance: 4 },
        { name: 'Zeus x27 | Tosai', rarity: 'Запрещённое', chance: 4 },
        { name: 'M4A4 | Choppa', rarity: 'Армейское качество', chance: 10.53 },
        { name: 'MAG-7 | Resupply', rarity: 'Армейское качество', chance: 10.53 },
        { name: 'MP9 | Nexus', rarity: 'Армейское качество', chance: 10.53 },
        { name: 'P2000 | Sure Grip', rarity: 'Армейское качество', chance: 10.53 },
        { name: 'SSG 08 | Memorial', rarity: 'Армейское качество', chance: 10.53 },
        { name: 'USP-S | PC-GRN', rarity: 'Армейское качество', chance: 10.53 },
        { name: 'XM1014 | Mockingbird', rarity: 'Армейское качество', chance: 10.52 },
        { name: 'Nomad Knife', rarity: 'Нож', chance: 0.0625 },
        { name: 'Skeleton Knife', rarity: 'Нож', chance: 0.0625 },
        { name: 'Paracord Knife', rarity: 'Нож', chance: 0.0625 },
        { name: 'Survival Knife', rarity: 'Нож', chance: 0.0625 },
        { name: 'Яйцо Габена', rarity: 'яйца', chance: 0.001 }
    ];

    function getRandomWear() {
        var index = Math.floor(Math.random() * wearCategories.length);
        return wearCategories[index];
    }

    function getRandomSkin() {
        var totalChance = skins.reduce(function(sum, s) { return sum + s.chance; }, 0);
        var random = Math.random() * totalChance;

        for (var i = 0; i < skins.length; i++) {
            if (random < skins[i].chance) {
                var skin = Object.assign({}, skins[i]);
                skin.wear = getRandomWear();
                return skin;
            }
            random -= skins[i].chance;
        }

        var fallback = Object.assign({}, skins[skins.length - 1]);
        fallback.wear = getRandomWear();
        return fallback;
    }

    function saveSkinToServer(username, skin) {
        try {
            var url = new java.net.URL("http://localhost:3000/saveSkin");
            var conn = url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");

            var json = JSON.stringify({
                username: username,
                skin_name: skin.name,
                rarity: skin.rarity,
                wear: skin.wear
            });

            var outputStream = new java.io.OutputStreamWriter(conn.getOutputStream());
            outputStream.write(json);
            outputStream.flush();
            outputStream.close();

            var responseCode = conn.getResponseCode();
            if (responseCode !== 200) {
                var inputStream = conn.getErrorStream() || conn.getInputStream();
                var reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream));
                var line;
                var response = '';
                while ((line = reader.readLine()) != null) {
                    response += line;
                }
                reader.close();
                $.log("Ошибка сохранения скина: HTTP " + responseCode + " " + response);
            }
        } catch (e) {
            $.log("Ошибка при отправке запроса: " + e);
        }
    }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand();

        if ($.equalsIgnoreCase(command, 'кейс')) {
            var skin = getRandomSkin();

            saveSkinToServer(sender, skin);

            $.say('@' + sender + ', ты открыл Кейс Лихорадка и получил: ' +
                skin.name + ' (' + skin.rarity + '), Износ: ' +
                skin.wear + ' 🎉');
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/Case.js', 'кейс');
    });
})();
