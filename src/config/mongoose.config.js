const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("Connected to DB.");
}).catch(error => console.log(error?.message ?? "Failed DB Connection."));