const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("Connected to DB.");
}).catch(err => console.log(err?.message ?? "Failed DB Connection."));