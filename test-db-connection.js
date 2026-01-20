const { testConnection } = require('./lib/db');


testConnection()
  .then(result => {
    console.log('Database connection successful:', result);
  })
  .catch(error => {
    console.error('Database connection failed:', error);
  });
