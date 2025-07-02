const express = require('express');
const cors = require('cors');
const app = express();

const usersRouter = require('./routes/users');
const transactionsRouter = require('./routes/transactions'); // ✅ Add this line

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter); // ✅ Add this line

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
