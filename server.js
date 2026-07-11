// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы
app.use(express.static('public'));
app.use(express.static(__dirname));

// API ключ
const API_KEY = process.env.LISTEN_NOTES_API_KEY;
const LISTEN_NOTES_API_URL = 'https://listen-api.listennotes.com/api/v2';

if (!API_KEY) {
    console.error('❌ LISTEN_NOTES_API_KEY не найден в .env файле');
    process.exit(1);
}

console.log('✅ API ключ загружен успешно!');

// Корневой маршрут
app.get('/', (req, res) => {
    const possiblePaths = [
        path.join(__dirname, 'public', 'index.html'),
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'public', 'index.htm'),
        path.join(__dirname, 'index.htm')
    ];
    
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`📄 Отдаю файл: ${filePath}`);
            return res.sendFile(filePath);
        }
    }
    
    res.status(404).send(`
        <h1>❌ index.html не найден</h1>
        <p>Искали в:</p>
        <ul>
            ${possiblePaths.map(p => `<li>${p}</li>`).join('')}
        </ul>
    `);
});

// Прокси-эндпоинт для поиска
app.get('/api/search', async (req, res) => {
    try {
        const queryParams = new URLSearchParams(req.query);
        const response = await fetch(`${LISTEN_NOTES_API_URL}/search?${queryParams}`, {
            headers: {
                'X-ListenAPI-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Ошибка при поиске подкастов' });
    }
});

// Прокси-эндпоинт для получения подкаста по ID
app.get('/api/podcasts/:id', async (req, res) => {
    try {
        const response = await fetch(`${LISTEN_NOTES_API_URL}/podcasts/${req.params.id}`, {
            headers: {
                'X-ListenAPI-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Podcast error:', error);
        res.status(500).json({ error: 'Ошибка при получении подкаста' });
    }
});

// Прокси-эндпоинт для получения эпизодов подкаста (С ДЕТАЛЬНЫМ ЛОГИРОВАНИЕМ)
app.get('/api/podcasts/:id/episodes', async (req, res) => {
    try {
        const podcastId = req.params.id;
        const queryParams = new URLSearchParams(req.query);
        const url = `${LISTEN_NOTES_API_URL}/podcasts/${podcastId}/episodes?${queryParams}`;
        
        console.log(`📡 Запрос эпизодов: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'X-ListenAPI-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 Статус ответа: ${response.status}`);

        // Получаем ответ как текст
        const responseText = await response.text();
        console.log(`📡 Ответ (первые 500 символов):`, responseText.substring(0, 500));

        if (!response.ok) {
            console.error(`❌ API ошибка (${response.status}):`, responseText);
            return res.status(response.status).json({ 
                error: `API Error: ${response.status}`,
                details: responseText.substring(0, 200)
            });
        }

        // Парсим JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Ошибка парсинга JSON:', e.message);
            return res.status(500).json({ 
                error: 'Не удалось разобрать ответ API',
                details: responseText.substring(0, 200)
            });
        }

        console.log(`✅ Успешно получены эпизоды для подкаста ${podcastId}`);
        console.log(`📊 Количество эпизодов: ${data.episodes?.length || 0}`);
        
        res.json(data);
    } catch (error) {
        console.error('❌ Episodes error:', error);
        res.status(500).json({ 
            error: 'Ошибка при получении эпизодов',
            message: error.message
        });
    }
});

// Прокси-эндпоинт для получения эпизода по ID
app.get('/api/episodes/:id', async (req, res) => {
    try {
        const response = await fetch(`${LISTEN_NOTES_API_URL}/episodes/${req.params.id}`, {
            headers: {
                'X-ListenAPI-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Episode error:', error);
        res.status(500).json({ error: 'Ошибка при получении эпизода' });
    }
});

// Прокси-эндпоинт для получения популярных подкастов
app.get('/api/curated', async (req, res) => {
    try {
        const queryParams = new URLSearchParams(req.query);
        const response = await fetch(`${LISTEN_NOTES_API_URL}/curated_podcasts?${queryParams}`, {
            headers: {
                'X-ListenAPI-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Curated error:', error);
        res.status(500).json({ error: 'Ошибка при получении популярных подкастов' });
    }
});

// Обработка 404
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Страница не найдена</h1>
        <p>Запрошенный URL: ${req.url}</p>
        <p><a href="/">Вернуться на главную</a></p>
    `);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`✅ API ключ загружен: ${API_KEY ? 'Да' : 'Нет'}`);
});