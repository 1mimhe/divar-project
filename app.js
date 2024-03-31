require('dotenv').config();
const express = require('express');
const path = require('path');
const {allRouters} = require("./src/routes/index");
const {notFoundError, errorHandler} = require("./src/middlewares/errorHandler.middleware");

const app = express();

// Setup application
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routers
app.use(allRouters);
app.use(notFoundError);
app.use(errorHandler);

// Setup Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server run on port ${PORT}.`));