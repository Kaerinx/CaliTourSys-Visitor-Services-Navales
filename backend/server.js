require('dotenv').config();

const app = require('./src/app');
const initializeDatabase = require('./src/config/initDb');

const PORT = process.env.PORT || 5000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CaliTourSys backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error.message);
    console.error('Check MySQL/XAMPP is running and backend .env database credentials are correct.');
    process.exit(1);
  });
