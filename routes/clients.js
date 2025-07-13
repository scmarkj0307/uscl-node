const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

// GET /clients?page=1&limit=10
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await sql.connect(config);

    // Fetch paginated clients with status label
    const dataResult = await pool.request().query(`
      SELECT 
        clientId,
        clientName,
        email,
        CASE 
          WHEN isActive = 1 THEN 'Active' 
          ELSE 'Inactive' 
        END AS status,
        created_at
      FROM tblClients
      ORDER BY clientId ASC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `);

    // Get total number of clients
    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM tblClients
    `);

    const total = countResult.recordset[0].total;

    res.status(200).json({
      clients: dataResult.recordset,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// POST /clients
router.post('/', async (req, res) => {
  const { clientName, email, isActive } = req.body;

  if (!clientName || !email || typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'clientName, email, and isActive (boolean) are required' });
  }

  try {
    const pool = await sql.connect(config);

    // Insert the new client
    await pool.request()
      .input('clientName', sql.NVarChar(100), clientName)
      .input('email', sql.NVarChar(100), email)
      .input('isActive', sql.Bit, isActive)
      .query(`
        INSERT INTO tblClients (clientName, email, isActive)
        VALUES (@clientName, @email, @isActive)
      `);

    res.status(201).json({ message: 'Client added successfully' });
  } catch (error) {
    console.error('Error adding client:', error);
    if (error.originalError?.info?.number === 2627) {
      return res.status(409).json({ error: 'Client with the same name or email already exists' });
    }
    res.status(500).json({ error: 'Failed to add client' });
  }
});


// PUT /clients/:id
router.put('/:id', async (req, res) => {
  const clientId = parseInt(req.params.id);
  const { clientName, email, isActive } = req.body;

  if (!clientId || !clientName || !email || typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'clientId, clientName, email, and isActive (boolean) are required' });
  }

  try {
    const pool = await sql.connect(config);

    // Check if client exists
    const existingClient = await pool.request()
      .input('clientId', sql.Int, clientId)
      .query('SELECT * FROM tblClients WHERE clientId = @clientId');

    if (existingClient.recordset.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update client
    await pool.request()
      .input('clientId', sql.Int, clientId)
      .input('clientName', sql.NVarChar(100), clientName)
      .input('email', sql.NVarChar(100), email)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE tblClients
        SET clientName = @clientName,
            email = @email,
            isActive = @isActive
        WHERE clientId = @clientId
      `);

    res.status(200).json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.originalError?.info?.number === 2627) {
      return res.status(409).json({ error: 'Client with the same name or email already exists' });
    }
    res.status(500).json({ error: 'Failed to update client' });
  }
});


// DELETE /clients/:id
router.delete('/:id', async (req, res) => {
  const clientId = parseInt(req.params.id);

  if (!clientId) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  try {
    const pool = await sql.connect(config);

    // Check if client exists
    const existing = await pool.request()
      .input('clientId', sql.Int, clientId)
      .query('SELECT clientId FROM tblClients WHERE clientId = @clientId');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Delete client
    await pool.request()
      .input('clientId', sql.Int, clientId)
      .query('DELETE FROM tblClients WHERE clientId = @clientId');

    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});




module.exports = router;
