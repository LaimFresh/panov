const db = require('../db');

// Получение всех товаров
function getAllProducts() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM products", [], (err, rows) => {
            if (err) {
                console.error('Error fetching products:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Получение товара по ID
function getProductById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Error fetching product:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Добавление нового товара
function addProduct(product) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO products (name, category, description, material, dimensions, price, image_url, in_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        db.run(
            insertQuery,
            [
                product.name,
                product.category,
                product.description,
                product.material,
                product.dimensions,
                product.price,
                product.image_url,
                product.in_stock
            ],
            function (err) {
                if (err) {
                    console.error('Error adding product:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Возвращает ID только что добавленной записи
                }
            }
        );
    });
}

// Обновление товара по ID
function updateProduct(id, product) {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE products 
            SET name = ?, category = ?, description = ?, material = ?, dimensions = ?, price = ?, image_url = ?, in_stock = ?
            WHERE id = ?;
        `;
        db.run(
            updateQuery,
            [
                product.name,
                product.category,
                product.description,
                product.material,
                product.dimensions,
                product.price,
                product.image_url,
                product.in_stock,
                id
            ],
            function (err) {
                if (err) {
                    console.error('Error updating product:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes > 0); // true, если обновлено
                }
            }
        );
    });
}

// Удаление товара по ID
function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
            if (err) {
                console.error('Error deleting product:', err.message);
                reject(err);
            } else {
                resolve(this.changes > 0); // true, если удалено
            }
        });
    });
}

// Экспорт функций
module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct
};