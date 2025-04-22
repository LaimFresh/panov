const db = require('../db'); // Импортируем соединение с базой данных

// Функция для создания таблицы medicines, если её нет
function ensureMedicinesTableExists() {
    return new Promise((resolve, reject) => {
        const createTableQuery = `
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
            );
        `;
        db.run(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating medicines table:', err.message);
                reject(err);
            } else {
                console.log('Medicines table created or already exists');
                resolve();
            }
        });
    });
}

// Получение всех лекарств
function getAllMedicines() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM medicines", [], (err, rows) => {
            if (err) {
                console.error('Error fetching medicines:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Получение лекарства по ID
function getMedicineById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM medicines WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Error fetching medicine:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Добавление нового лекарства
function addMedicine(medicine) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO medicines (name, category, availability, description, manufacturer, image_url, expiration_date, price, contraindications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        db.run(
            insertQuery,
            [
                medicine.name,
                medicine.category,
                medicine.availability,
                medicine.description,
                medicine.manufacturer,
                medicine.image_url,
                medicine.expiration_date,
                medicine.price,
                medicine.contraindications
            ],
            function (err) {
                if (err) {
                    console.error('Error adding medicine:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Возвращает ID только что добавленной записи
                }
            }
        );
    });
}

// Обновление лекарства по ID
function updateMedicine(id, medicine) {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE medicines 
            SET name = ?, category = ?, availability = ?, description = ?, manufacturer = ?, image_url = ?, expiration_date = ?, price = ?, contraindications = ?
            WHERE id = ?;
        `;
        db.run(
            updateQuery,
            [
                medicine.name,
                medicine.category,
                medicine.availability,
                medicine.description,
                medicine.manufacturer,
                medicine.image_url,
                medicine.expiration_date,
                medicine.price,
                medicine.contraindications,
                id
            ],
            function (err) {
                if (err) {
                    console.error('Error updating medicine:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes > 0); // Возвращает true, если запись была обновлена
                }
            }
        );
    });
}

// Удаление лекарства по ID
function deleteMedicine(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM medicines WHERE id = ?", [id], function (err) {
            if (err) {
                console.error('Error deleting medicine:', err.message);
                reject(err);
            } else {
                resolve(this.changes > 0); // Возвращает true, если запись была удалена
            }
        });
    });
}

// Экспорт функций
module.exports = {
    ensureMedicinesTableExists,
    getAllMedicines,
    getMedicineById,
    addMedicine,
    updateMedicine,
    deleteMedicine
};