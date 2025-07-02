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

router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    console.log('Received request for user ID:', userId); // 👈 add this

    try {
        let pool = await sql.connect(config);
        let result = await pool
            .request()
            .input('id', sql.Int, userId)
            .query("SELECT * FROM Users WHERE Id = @id");

        console.log('Query result:', result.recordset); // 👈 see what DB returns

        if (result.recordset.length === 0) {
            res.status(404).send("User not found");
        } else {
            res.json(result.recordset[0]);
        }
    } catch (err) {
        console.error('DB error:', err); // 👈 catch SQL issues
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
