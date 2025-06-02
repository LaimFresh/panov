const db = require('../db');

// Получение всех сотрудников
function getAllEmployees() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM employees", [], (err, rows) => {
            if (err) {
                console.error('Error fetching employees:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Получение сотрудника по ID
function getEmployeeById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM employees WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Error fetching employee:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Добавление нового сотрудника
function addEmployee(employee) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO employees (full_name, position, phone, email, hire_date, salary, experience_years, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        db.run(
            insertQuery,
            [
                employee.full_name,
                employee.position,
                employee.phone,
                employee.email,
                employee.hire_date,
                employee.salary,
                employee.experience_years,
                employee.image_url
            ],
            function (err) {
                if (err) {
                    console.error('Error adding employee:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Возвращает ID только что добавленного сотрудника
                }
            }
        );
    });
}

// Обновление сотрудника по ID
function updateEmployee(id, employee) {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE employees 
            SET full_name = ?, position = ?, phone = ?, email = ?, hire_date = ?, salary = ?, experience_years = ?, image_url = ?
            WHERE id = ?;
        `;
        db.run(
            updateQuery,
            [
                employee.full_name,
                employee.position,
                employee.phone,
                employee.email,
                employee.hire_date,
                employee.salary,
                employee.experience_years,
                employee.image_url,
                id
            ],
            function (err) {
                if (err) {
                    console.error('Error updating employee:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes > 0); // true, если обновлено
                }
            }
        );
    });
}

// Удаление сотрудника по ID
function deleteEmployee(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM employees WHERE id = ?", [id], function (err) {
            if (err) {
                console.error('Error deleting employee:', err.message);
                reject(err);
            } else {
                resolve(this.changes > 0); // true, если удалено
            }
        });
    });
}

// Экспорт функций
module.exports = {
    getAllEmployees,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee
};