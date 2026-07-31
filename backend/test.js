const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/carwash_db').then(async () => {
  const users = await mongoose.connection.db.collection('users').find({ password: { $exists: false } }).toArray();
  console.log(users);
  process.exit(0);
});
