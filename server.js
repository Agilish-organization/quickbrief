const express = require('express');
const path = require('path');
const summarizeRouter = require('./routes/summarize');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', summarizeRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`QuickBrief listening on 0.0.0.0:${PORT}`);
});

module.exports = app;
