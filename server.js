const express = require('express');
const cors = require('cors');
const adminsRouter = require('./routes/admins');
const clientsRouter = require('./routes/clients');
const app = express();

const transactionsRouter = require('./routes/transactions');
const authRouter = require('./routes/auth');
const transactionHistoryRouter = require('./routes/transactionHistory');

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/auth', authRouter); 
app.use('/api/admins', adminsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/transaction-history', transactionHistoryRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

