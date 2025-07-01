(function() {
    var fruits = [
        // 🟣 Легендарные (1.0%)
        { name: 'Резиновый фрукт (Ника)', rarity: 'Легендарный', chance: 0.5, description: 'Позволяет растягивать тело как резину.' },
        { name: 'Фрукт Тьмы', rarity: 'Легендарный', chance: 0.5, description: 'Управление гравитацией и тьмой.' },

        // 🔴 Эпические (5.0%)
        { name: 'Фрукт Магмы', rarity: 'Эпический', chance: 1, description: 'Создаёт и управляет лавой.' },
        { name: 'Фрукт Феникса', rarity: 'Эпический', chance: 1, description: 'Воскрешение и регенерация в огненном облике.' },
        { name: 'Фрукт Землетрясений', rarity: 'Эпический', chance: 1, description: 'Вызывает разрушительные землетрясения.' },
        { name: 'Фрукт Мамонта', rarity: 'Эпический', chance: 1, description: 'Превращение в могучего мамонта.' },
        { name: 'Фрукт Будды', rarity: 'Эпический', chance: 1, description: 'Увеличение размера тела и сила Будды.' },

        // 🔵 Редкие (15.0%)
        { name: 'Световой фрукт', rarity: 'Редкий', chance: 3, description: 'Передвижение и атаки со скоростью света.' },
        { name: 'Грозовой фрукт', rarity: 'Редкий', chance: 3, description: 'Управление молниями и электричеством.' },
        { name: 'Огненный фрукт', rarity: 'Редкий', chance: 3, description: 'Создание и контроль огня.' },
        { name: 'Фрукт Операций', rarity: 'Редкий', chance: 3, description: 'Хирургические способности и телекинез.' },
        { name: 'Ледяной фрукт', rarity: 'Редкий', chance: 3, description: 'Создание и управление льдом.' },

        // 🟠 Необычные (24.0%)
        { name: 'Плавательный фрукт', rarity: 'Необычный', chance: 4, description: 'Позволяет плавать под водой без проблем.' },
        { name: 'Фрукт Теней', rarity: 'Необычный', chance: 4, description: 'Манипуляция тенями и их перемещение.' },
        { name: 'Фрукт Разделения', rarity: 'Необычный', chance: 4, description: 'Разделение тела на части.' },
        { name: 'Фрукт Бизона', rarity: 'Необычный', chance: 4, description: 'Превращение в мощного бизона.' },
        { name: 'Фрукт Человека', rarity: 'Необычный', chance: 4, description: 'Ум и способности человека.' },
        { name: 'Фрукт Копирования', rarity: 'Необычный', chance: 4, description: 'Копирование внешности и способностей.' },

        // 🟢 Обычные (55.0%)
        { name: 'Гладкий фрукт', rarity: 'Обычный', chance: 5, description: 'Делает тело гладким и скользким.' },
        { name: 'Взрывной фрукт', rarity: 'Обычный', chance: 5, description: 'Создаёт взрывы из тела.' },
        { name: 'Фрукт Болота', rarity: 'Обычный', chance: 5, description: 'Контроль над болотистой местностью.' },
        { name: 'Фрукт Цветов', rarity: 'Обычный', chance: 5, description: 'Рост и управление растениями.' },
        { name: 'Фрукт Лезвий', rarity: 'Обычный', chance: 5, description: 'Создание острых лезвий из тела.' },
        { name: 'Фрукт Ягод', rarity: 'Обычный', chance: 5, description: 'Привлечение и контроль ягод.' },
        { name: 'Фрукт Тяжести', rarity: 'Обычный', chance: 5, description: 'Увеличение веса и силы удара.' },
        { name: 'Фрукт Лёгкости', rarity: 'Обычный', chance: 5, description: 'Лёгкость и скорость движений.' },
        { name: 'Фрукт Металла', rarity: 'Обычный', chance: 5, description: 'Превращение тела в металл.' },
        { name: 'Фрукт Замедления', rarity: 'Обычный', chance: 5, description: 'Замедление времени вокруг.' },
        { name: 'Фрукт Взгляда', rarity: 'Обычный', chance: 5, description: 'Парализующий взгляд.' },

        // ⚪ Забавные/странные (добавлены как обычные)
        { name: 'Фрукт Замков', rarity: 'Обычный', chance: 1, description: 'Управление замками и ключами.' },
        { name: 'Фрукт Жевания', rarity: 'Обычный', chance: 1, description: 'Усиление силы челюстей.' },
        { name: 'Фрукт Искусства', rarity: 'Обычный', chance: 1, description: 'Создание художественных иллюзий.' },
        { name: 'Фрукт Гормонов', rarity: 'Обычный', chance: 1, description: 'Манипуляция гормональным балансом.' },
        { name: 'Фрукт Книг', rarity: 'Обычный', chance: 1, description: 'Чтение и контроль книг.' },
        { name: 'Фрукт Газа', rarity: 'Обычный', chance: 1, description: 'Управление газами и дымом.' },
        { name: 'Фрукт Удаления', rarity: 'Обычный', chance: 1, description: 'Удаление объектов и предметов.' },
        { name: 'Фрукт Сладостей', rarity: 'Обычный', chance: 1, description: 'Создание сладостей и конфет.' },
        { name: 'Фрукт Мочи', rarity: 'Обычный', chance: 1, description: 'Превращение тела в клейкую массу.' },
        { name: 'Фрукт Леопарда', rarity: 'Обычный', chance: 1, description: 'Превращение в леопарда.' },
        { name: 'Фрукт Собаки', rarity: 'Обычный', chance: 1, description: 'Превращение в собаку.' },

        // ✨ Редчайший (0.1%)
        { name: 'Гачи но Ми', rarity: 'Редчайший', chance: 0.1, description: 'Даёт владельцу невероятную привлекательность и покрывает его тело кожанными ремнями.' }
    ];

    function getRandomFruit() {
        var totalChance = fruits.reduce(function(sum, f) { return sum + f.chance; }, 0);
        var random = Math.random() * totalChance;

        for (var i = 0; i < fruits.length; i++) {
            if (random < fruits[i].chance) {
                return fruits[i];
            }
            random -= fruits[i].chance;
        }

        return fruits[fruits.length - 1];
    }

    // Функция для отправки фрукта на сервер
    function saveFruitToServer(user_name, fruit) {
        try {
            var url = new java.net.URL("http://localhost:3000/saveFruit");
            var conn = url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");

            var json = JSON.stringify({
                user_name: user_name,
                item_name: fruit.name,
                item_count: 1,
                rarity: fruit.rarity
            });

            var outputStream = new java.io.OutputStreamWriter(conn.getOutputStream(), "UTF-8");
            outputStream.write(json);
            outputStream.flush();
            outputStream.close();

            var responseCode = conn.getResponseCode();
            if (responseCode !== 200) {
                var inputStream = conn.getErrorStream() || conn.getInputStream();
                var reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, "UTF-8"));
                var line;
                var response = '';
                while ((line = reader.readLine()) != null) {
                    response += line;
                }
                reader.close();
                $.consoleLn("Ошибка отправки фрукта: HTTP " + responseCode + " " + response);
            }
        } catch (e) {
            $.consoleLn("Ошибка отправки на сервер: " + e);
        }
    }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand();

        if ($.equalsIgnoreCase(command, 'фрукт')) {
            var fruit = getRandomFruit();
            $.say('@' + sender + ', ты получил: ' +
                fruit.name + ' (' + fruit.rarity + ') 🍇 — ' +
                fruit.description);

            saveFruitToServer(sender, fruit);
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/FruitDrop.js', 'фрукт');
    });
})();
