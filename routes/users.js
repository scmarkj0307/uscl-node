const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

// Get all users
router.get('/', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM Users");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add user
router.post('/', async (req, res) => {
    const { name, email } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .query("INSERT INTO Users (name, email) VALUES (@name, @email)");
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Update user
router.put('/:id', async (req, res) => {
    const { name, email } = req.body;
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .query("UPDATE Users SET name = @name, email = @email WHERE id = @id");
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM Users WHERE id = @id");
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
