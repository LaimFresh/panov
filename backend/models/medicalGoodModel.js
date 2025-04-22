const db = require('../db'); // Импортируем соединение с базой данных

// Функция для создания таблицы medical_goods, если её нет
function ensureMedicalGoodsTableExists() {
    return new Promise((resolve, reject) => {
        const createTableQuery = `
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
            );
        `;
        db.run(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating medical_goods table:', err.message);
                reject(err);
            } else {
                console.log('Medical_goods table created or already exists');
                resolve();
            }
        });
    });
}

// Получение всех медицинских товаров
function getAllMedicalGoods() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM medical_goods", [], (err, rows) => {
            if (err) {
                console.error('Error fetching medical goods:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Получение медицинского товара по ID
function getMedicalGoodById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM medical_goods WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Error fetching medical good:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Добавление нового медицинского товара
function addMedicalGood(good) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO medical_goods (name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        db.run(
            insertQuery,
            [
                good.name,
                good.category,
                good.availability,
                good.description,
                good.manufacturer,
                good.image_url,
                good.expiration_date,
                good.price,
                good.contraindications
            ],
            function (err) {
                if (err) {
                    console.error('Error adding medical good:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Возвращает ID только что добавленной записи
                }
            }
        );
    });
}

// Обновление медицинского товара по ID
function updateMedicalGood(id, good) {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE medical_goods 
            SET name = ?, category = ?, availability = ?, description = ?, manufacturer = ?, image_url = ?, expiration_date = ?, price = ?, contraindications = ?
            WHERE id = ?;
        `;
        db.run(
            updateQuery,
            [
                good.name,
                good.category,
                good.availability,
                good.description,
                good.manufacturer,
                good.image_url,
                good.expiration_date,
                good.price,
                good.contraindications,
                id
            ],
            function (err) {
                if (err) {
                    console.error('Error updating medical good:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes > 0); // Возвращает true, если запись была обновлена
                }
            }
        );
    });
}

// Удаление медицинского товара по ID
function deleteMedicalGood(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM medical_goods WHERE id = ?", [id], function (err) {
            if (err) {
                console.error('Error deleting medical good:', err.message);
                reject(err);
            } else {
                resolve(this.changes > 0); // Возвращает true, если запись была удалена
            }
        });
    });
}

// Экспорт функций
module.exports = {
    ensureMedicalGoodsTableExists,
    getAllMedicalGoods,
    getMedicalGoodById,
    addMedicalGood,
    updateMedicalGood,
    deleteMedicalGood
};