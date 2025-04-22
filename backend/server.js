const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const path = require('path'); // Добавляем path
faker.locale = 'ru'; // Установка локали на русский язык

// Загрузка переменных окружения
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение статических файлов Vue.js
const publicPath = path.join(__dirname, 'public'); // Путь к папке public
app.use(express.static(publicPath));

// Подключение к MySQL
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'bvmeqovnx74dgjg8fx95-mysql.services.clever-cloud.com', // Host из Railway
    user: process.env.MYSQL_USER || 'ue4jayvcpjd23i90',     // User из Railway
    password: process.env.MYSQL_PASSWORD || 'HKkh8FyE8yNboQydEZBP', // Password из Railway
    database: process.env.MYSQL_DATABASE || 'bvmeqovnx74dgjg8fx95', // Database из Railway
    port: process.env.MYSQL_PORT || 3306,       // Port из Railway
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Проверка подключения при старте
pool.getConnection()
    .then(conn => {
        console.log('✅ Успешное подключение к MySQL!');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Ошибка подключения к MySQL:', err.message);
    });

// Инициализация базы данных
async function initializeDatabase() {
    try {
        // Создание таблицы medical_goods
        await pool.query(`
            CREATE TABLE IF NOT EXISTS medical_goods (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                availability BOOLEAN NOT NULL DEFAULT TRUE,
                description TEXT,
                manufacturer VARCHAR(255) NOT NULL,
                image_url VARCHAR(255),
                expiration_date DATETIME NOT NULL,
                price DECIMAL(18, 2) NOT NULL,
                contraindications TEXT
            )
        `);
        // Создание таблицы medicines
        await pool.query(`
            CREATE TABLE IF NOT EXISTS medicines (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                availability BOOLEAN NOT NULL DEFAULT TRUE,
                description TEXT,
                manufacturer VARCHAR(255) NOT NULL,
                image_url VARCHAR(255),
                expiration_date DATETIME NOT NULL,
                price DECIMAL(18, 2) NOT NULL,
                contraindications TEXT
            )
        `);
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
}

// Функция для заполнения таблицы medical_goods
async function seedMedicalGoods() {
    try {
        const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM medical_goods');
        if (countRows[0].count > 0) {
            console.log('Таблица medical_goods уже содержит данные. Пропускаем заполнение.');
            return;
        }

        const goods = [];
        for (let i = 1; i <= 100; i++) {
            goods.push([
                faker.commerce.productName(), // Название товара
                faker.helpers.arrayElement(['Медицинские принадлежности', 'Изделия медицинского назначения', 'Косметика']), // Категория
                faker.datatype.boolean(), // Наличие
                faker.lorem.paragraph(), // Описание
                faker.company.name(), // Производитель
                `s${i}.jpg`, // Изображение (1.jpg - 100.jpg)
                faker.date.future(), // Дата истечения срока годности
                parseFloat(faker.commerce.price(100, 10000)), // Цена
                faker.lorem.sentence(), // Противопоказания
            ]);
        }

        // Вставка данных
        const query = `
            INSERT INTO medical_goods 
            (name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications)
            VALUES ?
        `;
        await pool.query(query, [goods]);
        console.log('Таблица medical_goods успешно заполнена.');
    } catch (error) {
        console.error('Ошибка при заполнении таблицы medical_goods:', error.message);
        throw error;
    }
}

// Функция для заполнения таблицы medicines
async function seedMedicines() {
    try {
        const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM medicines');
        if (countRows[0].count > 0) {
            console.log('Таблица medicines уже содержит данные. Пропускаем заполнение.');
            return;
        }

        const medicines = [];
        for (let i = 1; i <= 100; i++) {
            medicines.push([
                faker.commerce.productName(), // Название лекарства
                faker.helpers.arrayElement(['Антибиотики', 'Противовирусные', 'Обезболивающие', 'Витамины']), // Категория
                faker.datatype.boolean(), // Наличие
                faker.lorem.paragraph(), // Описание
                faker.company.name(), // Производитель
                `f${i}.jpg`, // Изображение (1.jpg - 100.jpg)
                faker.date.future(), // Дата истечения срока годности
                parseFloat(faker.commerce.price(100, 10000)), // Цена
                faker.lorem.sentence(), // Противопоказания
            ]);
        }

        // Вставка данных
        const query = `
            INSERT INTO medicines 
            (name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications)
            VALUES ?
        `;
        await pool.query(query, [medicines]);
        console.log('Таблица medicines успешно заполнена.');
    } catch (error) {
        console.error('Ошибка при заполнении таблицы medicines:', error.message);
        throw error;
    }
}

// Функция для запуска сидера
async function runSeeder() {
    try {
        await seedMedicalGoods();
        await seedMedicines();
        console.log('Сидер завершил работу.');
    } catch (error) {
        console.error('Ошибка при выполнении сидера:', error.message);
    }
}
// Маршруты API для medical_goods
app.get('/api/medical-goods', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Подсчитываем общее количество товаров
        const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM medical_goods');
        const total = countRows[0].total;

        // Получаем товары с учетом пагинации
        const [rows] = await pool.query('SELECT * FROM medical_goods LIMIT ? OFFSET ?', [limit, offset]);

        res.json({
            data: rows,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching medical goods:', error.message);
        res.status(500).json({ error: 'Failed to fetch medical goods', details: error.message });
    }
});

app.get('/api/medical-goods/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM medical_goods WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Medical good not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch medical good', details: error.message });
    }
});

app.post('/api/medical-goods', async (req, res) => {
    const { name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications } = req.body;

    // Проверка обязательных полей
    if (!name || !category || typeof availability === 'undefined' || !manufacturer || !expiration_date || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Преобразование данных
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'Invalid price format' });
    }

    const parsedAvailability = availability === 'true' || availability === true;
    const parsedExpirationDate = new Date(expiration_date);
    if (isNaN(parsedExpirationDate.getTime())) {
        return res.status(400).json({ error: 'Invalid expiration date format' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO medical_goods (name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, category, parsedAvailability, description, manufacturer, image_url, parsedExpirationDate, parsedPrice, contraindications]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Database error:', error.message);
        if (error.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({ error: 'One or more required fields are missing in the database' });
        }
        res.status(500).json({ error: 'Failed to add medical good', details: error.message });
    }
});
app.put('/api/medical-goods/:id', async (req, res) => {
    const { id } = req.params;
    const updatedGood = req.body;

    // Проверка обязательных полей
    if (!updatedGood.name || !updatedGood.category || !updatedGood.manufacturer || !updatedGood.expiration_date || !updatedGood.price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE medical_goods SET name = ?, category = ?, availability = ?, description = ?, manufacturer = ?, image_url = ?, expiration_date = ?, price = ?, contraindications = ? WHERE id = ?',
            [
                updatedGood.name,
                updatedGood.category,
                updatedGood.availability,
                updatedGood.description,
                updatedGood.manufacturer,
                updatedGood.image_url,
                updatedGood.expiration_date,
                updatedGood.price,
                updatedGood.contraindications,
                id,
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Medical good not found' });
        }
        res.json({ message: 'Medical good updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update medical good', details: error.message });
    }
});

app.delete('/api/medical-goods/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM medical_goods WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Medical good not found' });
        }
        res.json({ message: 'Medical good deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete medical good', details: error.message });
    }
});

// Маршруты API для medicines
app.get('/api/medicines', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Подсчитываем общее количество лекарств
        const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM medicines');
        const total = countRows[0].total;

        // Получаем лекарства с учетом пагинации
        const [rows] = await pool.query('SELECT * FROM medicines LIMIT ? OFFSET ?', [limit, offset]);

        res.json({
            data: rows,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching medicines:', error.message);
        res.status(500).json({ error: 'Failed to fetch medicines', details: error.message });
    }
});

app.get('/api/medicines/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Medicine not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch medicine', details: error.message });
    }
});

app.post('/api/medicines', async (req, res) => {
    const { name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications } = req.body;

    // Проверка обязательных полей
    if (!name || !category || !manufacturer || !expiration_date || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO medicines (name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add medicine', details: error.message });
    }
});

app.put('/api/medicines/:id', async (req, res) => {
    const { id } = req.params;
    const updatedMedicine = req.body;

    // Проверка обязательных полей
    if (!updatedMedicine.name || !updatedMedicine.category || !updatedMedicine.manufacturer || !updatedMedicine.expiration_date || !updatedMedicine.price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE medicines SET name = ?, category = ?, availability = ?, description = ?, manufacturer = ?, image_url = ?, expiration_date = ?, price = ?, contraindications = ? WHERE id = ?',
            [
                updatedMedicine.name,
                updatedMedicine.category,
                updatedMedicine.availability,
                updatedMedicine.description,
                updatedMedicine.manufacturer,
                updatedMedicine.image_url,
                updatedMedicine.expiration_date,
                updatedMedicine.price,
                updatedMedicine.contraindications,
                id,
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Medicine not found' });
        }
        res.json({ message: 'Medicine updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update medicine', details: error.message });
    }
});

app.delete('/api/medicines/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM medicines WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Medicine not found' });
        }
        res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete medicine', details: error.message });
    }
});
// Обработка всех остальных маршрутов для Vue Router
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});
// Запуск сервера
(async () => {
    try {
        await initializeDatabase(); // Инициализируем базу данных
        await runSeeder();         // Запускаем сидер
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
            console.log(`Frontend is served on 8080`);

        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
    }
})();