const express = require('express');
const cors = require('cors');
const adminsRouter = require('./routes/admins');
const clientsRouter = require('./routes/clients');
const app = express();

const transactionsRouter = require('./routes/transactions');
const authRouter = require('./routes/auth'); // ✅ Add this line

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/auth', authRouter); 
app.use('/api/admins', adminsRouter);
app.use('/api/clients', clientsRouter); // ✅ Add this line

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
