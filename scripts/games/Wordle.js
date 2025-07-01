(function() {
    const WORD_LENGTH = 5; // длина слова должна совпадать с длиной слов в словаре
    const MAX_ATTEMPTS = 6;
    const WORDS = ['мирок', 'водач', 'пламя', 'знакс', 'фокус']; // все слова из 5 букв

    // Хранилище текущих игр { username: { word, attempts, finished } }
    let games = {};

    // Функция для случайного слова
    function getRandomWord() {
        return WORDS[Math.floor(Math.random() * WORDS.length)];
    }

    // Функция проверки и подсветки результата
    // Возвращает строку с эмодзи подсветкой:
    // 🟩 - правильная буква на правильном месте
    // 🟨 - правильная буква не на своём месте
    // ⬛ - буква отсутствует
    function checkGuess(word, guess) {
        let result = [];
        let used = new Array(WORD_LENGTH).fill(false);

        // Отмечаем точные совпадения
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guess[i] === word[i]) {
                result[i] = '🟩';
                used[i] = true;
            } else {
                result[i] = null;
            }
        }

        // Отмечаем правильные буквы не на местах
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (result[i]) continue; // уже 🟩

            let found = false;
            for (let j = 0; j < WORD_LENGTH; j++) {
                if (!used[j] && guess[i] === word[j]) {
                    found = true;
                    used[j] = true;
                    break;
                }
            }
            result[i] = found ? '🟨' : '⬛';
        }

        return result.join('');
    }

    // Обработчик команды wordle
    $.bind('command', function(event) {
        let sender = event.getSender().toLowerCase();
        let command = event.getCommand();
        let args = event.getArgs();

        if ($.equalsIgnoreCase(command, 'wordle')) {
            if (args.length === 0) {
                // Начать новую игру
                if (games[sender] && !games[sender].finished) {
                    $.say(`@${sender}, у тебя уже есть активная игра! Попробуй угадать слово, используя !wordle <слово>`);
                    return;
                }
                let word = getRandomWord();
                games[sender] = {
                    word: word,
                    attempts: 0,
                    finished: false
                };
                $.say(`@${sender}, игра Wordle началась! Угадай слово из ${WORD_LENGTH} букв. Используй команду !wordle <слово> для попытки.`);
                return;
            }

            // Игрок пытается угадать слово
            if (!games[sender] || games[sender].finished) {
                $.say(`@${sender}, у тебя нет активной игры. Начни новую с !wordle`);
                return;
            }

            // Проверка аргумента
            if (!args[0] || typeof args[0] !== 'пламя') {
                $.say(`@${sender}, укажи корректное слово после команды, например: !wordle пример`);
                return;
            }

            let guess = args[0].toLowerCase();

            if (guess.length !== WORD_LENGTH) {
                $.say(`@${sender}, слово должно быть ровно из ${WORD_LENGTH} букв. Твоё слово "${guess}" длиной ${guess.length}`);
                return;
            }

            let game = games[sender];
            game.attempts++;

            let feedback = checkGuess(game.word, guess);

            if (guess === game.word) {
                game.finished = true;
                $.say(`@${sender} 🎉 Поздравляем! Вы угадали слово "${game.word}" за ${game.attempts} попыток!`);
                delete games[sender]; // очищаем игру
            } else if (game.attempts >= MAX_ATTEMPTS) {
                game.finished = true;
                $.say(`@${sender} ❌ Попытки исчерпаны. Загаданное слово было "${game.word}". Начни новую игру с !wordle`);
                delete games[sender];
            } else {
                $.say(`@${sender} Попытка ${game.attempts}/${MAX_ATTEMPTS}: ${guess.toUpperCase()} → ${feedback}`);
            }
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/Wordle.js', 'wordle');
    });
})();
