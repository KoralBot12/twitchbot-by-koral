(function() {
    var apiKey = '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';

    function askGPT(question, sender) {
        var url = 'https://api.openai.com/v1/chat/completions';
        var payload = {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Отвечай коротко, по-русски и дружелюбно.' },
                { role: 'user', content: question }
            ],
            temperature: 0.7,
            max_tokens: 100
        };

        $.postJSON({
            url: url,
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(payload),
            success: function(response) {
                var reply = 'Что-то пошло не так 🤖';

                if (response && response.choices && response.choices.length > 0 &&
                    response.choices[0].message && typeof response.choices[0].message.content === 'string') {
                    
                    reply = response.choices[0].message.content.trim();
                    if (!reply) reply = 'Ответ пустой 😕';
                }

                var safeSender = (typeof sender === 'string') ? sender : JSON.stringify(sender);
                var safeReply = (typeof reply === 'string') ? reply : JSON.stringify(reply);

                $.say('@' + safeSender + ', ' + safeReply);
            },
            error: function() {
                var safeSender = (typeof sender === 'string') ? sender : JSON.stringify(sender);
                $.say('@' + safeSender + ', ошибка при подключении к GPT 😞');
            }
        });
    }

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs();

        if ($.equalsIgnoreCase(command, 'ask')) {
            if (!args || args.length === 0) {
                $.say('@' + sender + ', напиши вопрос после команды! Пример: !ask кто такой Гейб Ньюэлл');
                return;
            }

            var question = args.join(' ');
            askGPT(question, sender);
        }
    });

    $.bind('initReady', function() {
        $.registerChatCommand('./games/AskAi.js', 'ask');
    });
})();
