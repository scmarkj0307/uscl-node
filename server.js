const express = require('express');
const cors = require('cors');
const adminsRouter = require('./routes/admins');
const app = express();

const usersRouter = require('./routes/users');
const transactionsRouter = require('./routes/transactions');
const authRouter = require('./routes/auth'); // ✅ Add this line

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/auth', authRouter); 
app.use('/api/admins', adminsRouter); // ✅ Add this line

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
