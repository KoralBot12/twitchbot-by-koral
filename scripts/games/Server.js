const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // чтобы парсить JSON из тела запросов

// Настройки базы — подставь свои
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'twich',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Эндпоинт для сохранения скина
app.post('/saveSkin', async (req, res) => {
    const { username, skin_name, rarity, wear } = req.body;

    if (!username || !skin_name || !rarity || !wear) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const sql = 'INSERT INTO user_skins (username, skin_name, rarity, wear) VALUES (?, ?, ?, ?)';
        await pool.execute(sql, [username, skin_name, rarity, wear]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Новый эндпоинт для получения инвентаря пользователя
app.get('/getInventory', async (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ error: 'Missing username parameter' });
    }

    try {
        const sql = 'SELECT rarity FROM user_skins WHERE username = ?';
        const [rows] = await pool.execute(sql, [username]);

        if (rows.length === 0) {
            return res.json([]); // пустой массив, если нет скинов
        }

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Маппинг фруктов на редкость (используется для getFruits)
const rarityMap = {
    'Гачи но Ми': 'Редчайший',
    'Резиновый фрукт (Ника)': 'Легендарный',
    'Фрукт Тьмы': 'Легендарный',
    'Фрукт Магмы': 'Эпический',
    'Фрукт Феникса': 'Эпический',
    'Фрукт Землетрясений': 'Эпический',
    'Фрукт Мамонта': 'Эпический',
    'Фрукт Будды': 'Эпический',
    'Световой фрукт': 'Редкий',
    'Грозовой фрукт': 'Редкий',
    'Огненный фрукт': 'Редкий',
    'Фрукт Операций': 'Редкий',
    'Ледяной фрукт': 'Редкий',
    'Плавательный фрукт': 'Необычный',
    'Фрукт Теней': 'Необычный',
    'Фрукт Разделения': 'Необычный',
    'Фрукт Бизона': 'Необычный',
    'Фрукт Человека': 'Необычный',
    'Фрукт Копирования': 'Необычный',
    'Гладкий фрукт': 'Обычный',
    'Взрывной фрукт': 'Обычный',
    'Фрукт Болота': 'Обычный',
    'Фрукт Цветов': 'Обычный',
    'Фрукт Лезвий': 'Обычный',
    'Фрукт Ягод': 'Обычный',
    'Фрукт Тяжести': 'Обычный',
    'Фрукт Лёгкости': 'Обычный',
    'Фрукт Металла': 'Обычный',
    'Фрукт Замедления': 'Обычный',
    'Фрукт Взгляда': 'Обычный',
    'Фрукт Замков': 'Обычный',
    'Фрукт Жевания': 'Обычный',
    'Фрукт Искусства': 'Обычный',
    'Фрукт Гормонов': 'Обычный',
    'Фрукт Книг': 'Обычный',
    'Фрукт Газа': 'Обычный',
    'Фрукт Удаления': 'Обычный',
    'Фрукт Сладостей': 'Обычный',
    'Фрукт Мочи': 'Обычный',
    'Фрукт Леопарда': 'Обычный',
    'Фрукт Собаки': 'Обычный'
};

// Сохранить фрукт (аналогично saveSkin, всегда новая запись)
app.post('/saveFruit', async (req, res) => {
    const { user_name, item_name, item_count, rarity } = req.body;
    if (!user_name || !item_name || !item_count || !rarity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        // Вставляем новую запись (id автоинкремент, если настроено)
        const sql = 'INSERT INTO fruits (user_name, item_name, item_count, rarity) VALUES (?, ?, ?, ?)';
        await pool.execute(sql, [user_name, item_name, item_count, rarity]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Получить количество фруктов по редкости
app.get('/getFruits', async (req, res) => {
    const user_name = req.query.user_name;
    if (!user_name) {
        return res.status(400).json({ error: 'Missing user_name parameter' });
    }
    try {
        const [rows] = await pool.execute(
            'SELECT item_name, item_count FROM fruits WHERE user_name = ?',
            [user_name]
        );
        // Группируем по редкости через rarityMap
        const rarityCounts = {};
        for (const row of rows) {
            const rarity = rarityMap[row.item_name] || 'Неизвестно';
            rarityCounts[rarity] = (rarityCounts[rarity] || 0) + row.item_count;
        }
        res.json(rarityCounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});


// Сохранить или обновить баланс пользователя в casino (аналогично saveFruit)
app.post('/saveCasino', async (req, res) => {
    const { user_name, balance } = req.body;
    if (!user_name || typeof balance !== 'number') {
        return res.status(400).json({ error: 'Missing user_name or balance' });
    }
    try {
        await saveCasinoBalance(user_name, balance);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Функция для сохранения/обновления баланса пользователя
async function saveCasinoBalance(user_name, balance) {
    const conn = await pool.getConnection();
    try {
        const [updateResult] = await conn.execute(
            'UPDATE casino SET balance = balance + ? WHERE user_name = ?',
            [balance, user_name]
        );
        if (updateResult.affectedRows === 0) {
            await conn.execute(
                'INSERT INTO casino (user_name, balance) VALUES (?, ?)',
                [user_name, balance]
            );
        }
    } finally {
        conn.release();
    }
}

// Получить баланс пользователя по user_name (аналогично getFruits)
app.get('/getCasino', async (req, res) => {
    const user_name = req.query.user_name;
    if (!user_name) {
        return res.status(400).json({ error: 'Missing user_name parameter' });
    }
    try {
        const balance = await getCasinoBalance(user_name);
        res.json({ user_name, balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Функция для получения баланса пользователя
async function getCasinoBalance(user_name) {
    const [rows] = await pool.execute(
        'SELECT balance FROM casino WHERE user_name = ?',
        [user_name]
    );
    if (rows.length > 0) {
        return rows[0].balance;
    }
    return 0;
}

// Запускаем сервер на порту 3000
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

