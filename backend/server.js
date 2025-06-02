const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const path = require('path'); // Добавляем path
const bcrypt = require('bcryptjs');
const session = require('express-session');
faker.locale = 'ru'; // Установка локали на русский язык

// Загрузка переменных окружения
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    credentials: true // разрешаем куки
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
    secret: 'Q1qqqqqq', // Секретный ключ для подписи сессий
    resave: false,            // Не сохранять сессию при каждом запросе
    saveUninitialized: true,  // Сохранять неинициализированные сессии
    cookie: { secure: false } // Установите `true`, если используете HTTPS
}));

// Подключение статических файлов Vue.js
const publicPath = path.join(__dirname, 'public'); // Путь к папке public
app.use(express.static(publicPath));
// Подключение к MySQL
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost', // Host из Railway
    user: process.env.MYSQL_USER || 'root',     // User из Railway
    password: process.env.MYSQL_PASSWORD || '', // Password из Railway
    database: process.env.MYSQL_DATABASE || 'vuep', // Database из Railway
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
            CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    material VARCHAR(255) NOT NULL,
    dimensions VARCHAR(100) NOT NULL,
    price DECIMAL(18, 2) NOT NULL,
    image_url VARCHAR(255),
    in_stock BOOLEAN NOT NULL DEFAULT TRUE
)
        `);
        // Создание таблицы medicines
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    hire_date DATE NOT NULL,
    salary DECIMAL(18, 2) NOT NULL,
    experience_years INT NOT NULL,
    image_url VARCHAR(255)
)
        `);
              // Создание таблицы users с полем role
              await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'user') NOT NULL DEFAULT 'user'
                )
            `);
    
            // Проверка существования администратора
            const adminEmail = 'admin';
            const adminPassword = 'Q1!qqqqqq';
    
            const [existingAdmin] = await pool.query('SELECT * FROM users WHERE username = ?', [adminEmail]);
            if (existingAdmin.length === 0) {
                // Хешируем пароль
                const hashedPassword = await bcrypt.hash(adminPassword, 8);
    
                // Создаем администратора с ролью admin
                await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [adminEmail, hashedPassword, 'admin']);
                console.log('Администратор создан: admin');
            } else {
                console.log('Администратор уже существует: admin');
            }
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
}

async function seedProducts() {
    try {
        const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM products');
        if (countRows[0].count > 0) {
            console.log('Таблица products уже содержит данные. Пропускаем заполнение.');
            return;
        }

        const products = [];
        const categories = ['Столы', 'Стулья', 'Диваны', 'Кровати', 'Шкафы', 'Тумбы'];
        const materials = ['ДСП', 'Массив дерева', 'МДФ', 'Пластик', 'Металл'];

        for (let i = 1; i <= 100; i++) {
            products.push([
                faker.commerce.productName(), // Название товара
                faker.helpers.arrayElement(categories), // Категория
                faker.lorem.sentence(), // Описание
                faker.helpers.arrayElement(materials), // Материал
                `${faker.number.int({ min: 100, max: 999 })}x${faker.number.int({ min: 50, max: 500 })}x${faker.number.int({ min: 40, max: 200 })}`, // Габариты
                parseFloat(faker.commerce.price(5000, 100000)), // Цена
                `p${i}.jpg`, // Изображение
                faker.datatype.boolean(), // В наличии
            ]);
        }

        const query = `
            INSERT INTO products 
            (name, category, description, material, dimensions, price, image_url, in_stock)
            VALUES ?
        `;
        await pool.query(query, [products]);
        console.log('Таблица products успешно заполнена.');
    } catch (error) {
        console.error('Ошибка при заполнении таблицы products:', error.message);
        throw error;
    }
}

// Функция для заполнения таблицы medicines
async function seedEmployees() {
    try {
        const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM employees');
        if (countRows[0].count > 0) {
            console.log('Таблица employees уже содержит данные. Пропускаем заполнение.');
            return;
        }

        const employees = [];
        const positions = [
            'Столяр',
            'Сборщик мебели',
            'Дизайнер',
            'Резчик по дереву',
            'Упаковщик',
            'Логист'
        ];

       for (let i = 1; i <= 100; i++) {
    const hireDate = faker.date.past(); // Дата найма
    const birthDate = faker.date.between({ from: '1980-01-01', to: '2004-01-01' }); // Дата рождения
    const experienceYears = Math.floor((new Date() - hireDate) / (1000 * 60 * 60 * 24 * 365)); // Стаж в годах

    employees.push([
        faker.person.fullName(), // Полное имя
        faker.helpers.arrayElement(positions), // Должность
      '+7 (' + 
faker.string.numeric(3) + ') ' + 
faker.string.numeric(3) + '-' + 
faker.string.numeric(2) + '-' + 
faker.string.numeric(2),
        faker.internet.email(), // Email
        hireDate, // Дата найма
        parseFloat(faker.finance.amount(30000, 100000)), // Зарплата
        experienceYears, // Стаж работы
        `e${i}.jpg`, // Фото
    ]);
}

        const query = `
            INSERT INTO employees 
            (full_name, position, phone, email, hire_date, salary, experience_years, image_url)
            VALUES ?
        `;
        await pool.query(query, [employees]);
        console.log('Таблица employees успешно заполнена.');
    } catch (error) {
        console.error('Ошибка при заполнении таблицы employees:', error.message);
        throw error;
    }
}

// Функция для запуска сидера
async function runSeeder() {
    try {
        await seedProducts();
        await seedEmployees();
        console.log('Сидер завершил работу.');
    } catch (error) {
        console.error('Ошибка при выполнении сидера:', error.message);
    }
}
// Маршрут для регистрации
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Проверяем, существует ли пользователь с таким именем
        const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 8);

        // Сохраняем пользователя в базе данных
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        res.status(201).json({ message: 'Регистрация успешна' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Маршрут для входа
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Находим пользователя по имени
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        if (!user) {
            return res.status(400).json({ message: 'Неверное имя пользователя или пароль' });
        }

        // Проверяем пароль
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверное имя пользователя или пароль' });
        }

        // Устанавливаем сессию
        req.session.userId = user.id;
        req.session.username = user.username; // Сохраняем имя пользователя
        req.session.role = user.role; // Сохраняем роль пользователя

        res.json({
            message: 'Вход выполнен успешно',
            username: user.username,
            role: user.role
        });
    } catch (error) {
        console.error('Ошибка при входе:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Маршрут для выхода
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка при выходе' });
        }
        res.json({ message: 'Вы успешно вышли' });
    });
});

// Защищенный маршрут
app.get('/protected', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Необходимо войти в систему' });
    }

    res.json({
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.role
    });
});
// Middleware для проверки роли администратора
function isAdmin(req, res, next) {
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
}
// Получить список товаров с пагинацией
app.get('/api/products', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM products');
        const total = countRows[0].total;

        const [rows] = await pool.query('SELECT * FROM products LIMIT ? OFFSET ?', [limit, offset]);

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
        console.error('Error fetching products:', error.message);
        res.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
});

// Получить товар по ID
app.get('/api/products/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product', details: error.message });
    }
});

// Добавить новый товар
app.post('/api/products', isAdmin, async (req, res) => {
    const { name, category, description, material, dimensions, price, image_url, in_stock } = req.body;

    if (!name || !category || !material || !dimensions || price == null) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'Invalid price format' });
    }

    const availability = in_stock === 'true' || in_stock === true;

    try {
        const [result] = await pool.query(
            'INSERT INTO products (name, category, description, material, dimensions, price, image_url, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, category, description, material, dimensions, parsedPrice, image_url, availability]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).json({ error: 'Failed to add product', details: error.message });
    }
});

// Обновить товар
app.put('/api/products/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const updatedProduct = req.body;

    if (!updatedProduct.name || !updatedProduct.category || !updatedProduct.material || !updatedProduct.dimensions || !updatedProduct.price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE products SET name = ?, category = ?, description = ?, material = ?, dimensions = ?, price = ?, image_url = ?, in_stock = ? WHERE id = ?',
            [
                updatedProduct.name,
                updatedProduct.category,
                updatedProduct.description,
                updatedProduct.material,
                updatedProduct.dimensions,
                updatedProduct.price,
                updatedProduct.image_url,
                updatedProduct.in_stock,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product', details: error.message });
    }
});

// Удалить товар
app.delete('/api/products/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product', details: error.message });
    }
});
// Получить список сотрудников с пагинацией
app.get('/api/employees', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM employees');
        const total = countRows[0].total;

        const [rows] = await pool.query('SELECT * FROM employees LIMIT ? OFFSET ?', [limit, offset]);

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
        console.error('Error fetching employees:', error.message);
        res.status(500).json({ error: 'Failed to fetch employees', details: error.message });
    }
});

// Получить сотрудника по ID
app.get('/api/employees/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employee', details: error.message });
    }
});

// Добавить нового сотрудника
app.post('/api/employees', isAdmin, async (req, res) => {
    const { full_name, position, phone, email, hire_date, salary, experience_years, image_url } = req.body;

    if (!full_name || !position || !phone || !hire_date || !salary || !experience_years) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedSalary = parseFloat(salary);
    if (isNaN(parsedSalary)) {
        return res.status(400).json({ error: 'Invalid salary format' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO employees (full_name, position, phone, email, hire_date, salary, experience_years, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, position, phone, email, hire_date, parsedSalary, parseInt(experience_years), image_url]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).json({ error: 'Failed to add employee', details: error.message });
    }
});

// Обновить данные сотрудника
app.put('/api/employees/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const updatedEmployee = req.body;

    if (!updatedEmployee.full_name || !updatedEmployee.position || !updatedEmployee.phone || !updatedEmployee.hire_date || !updatedEmployee.salary || !updatedEmployee.experience_years) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE employees SET full_name = ?, position = ?, phone = ?, email = ?, hire_date = ?, salary = ?, experience_years = ?, image_url = ? WHERE id = ?',
            [
                updatedEmployee.full_name,
                updatedEmployee.position,
                updatedEmployee.phone,
                updatedEmployee.email,
                updatedEmployee.hire_date,
                updatedEmployee.salary,
                updatedEmployee.experience_years,
                updatedEmployee.image_url,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update employee', details: error.message });
    }
});

// Удалить сотрудника
app.delete('/api/employees/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM employees WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete employee', details: error.message });
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