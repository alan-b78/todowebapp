const mysql = require('mysql');
const bcryptUtils = require('./bcryptUtils');

function getConnection() {
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'your-password',
        database: 'users',
    });
}

function createTables(connection) {
    const usersAndRolesQuery = `CREATE TABLE IF NOT EXISTS usersAndRoles (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        todo_password VARCHAR(50) NOT NULL UNIQUE,
        role_name VARCHAR(64) NOT NULL
    )`;

    const todoQuery = `CREATE TABLE IF NOT EXISTS todo (
        todo_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        todo MEDIUMTEXT NULL,
        complete TINYINT NOT NULL DEFAULT '0',
        date_complete DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
        lists VARCHAR(85) NULL
    )`;

    const adminUserQuery = `INSERT INTO usersAndRoles (username, todo_password, role_name) 
                            VALUES ('?', '?', '?') 
                            ON DUPLICATE KEY UPDATE todo_password = VALUES(todo_password)`;

    const contactsQuery = `CREATE TABLE IF NOT EXISTS contacts (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            email VARCHAR(255) NOT NULL,
                            message TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    connection.query(usersAndRolesQuery, (error) => {
        if (error) throw error;
        console.log('usersAndRoles table created successfully');

        // Check if the admin user already exists before creating
        connection.query('SELECT * FROM usersAndRoles WHERE username = ?', ['admin'], (selectError, results) => {
            if (selectError) throw selectError;
            if (results.length === 0) {
                const hashedPassword = bcryptUtils.hashPassword('admin');
                // Admin user doesn't exist, create it
                connection.query(adminUserQuery, ['admin', hashedPassword, 'admin'], (adminError) => {
                    if (adminError) throw adminError;
                    console.log('Initial admin user created successfully');
                });
            } else {
                console.log('Admin user already exists');
            }
        });
    });

    connection.query(todoQuery, (error) => {
        if (error) throw error;
        console.log('todo table created successfully');
    });

    connection.query(contactsQuery, (error) => {
        if (error) throw error;
        console.log('contacts table created successfully');
    });
};

module.exports = {
    getConnection,
    createTables
};
