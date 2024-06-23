require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');
const allRouters = require("./src/routes/index.route");
const {notFoundError, allErrorHandler} = require("./src/middlewares/errorHandler.middleware");
const SwaggerConfig = require("./src/config/swagger.config");

const app = express();
// DB connection
require("./src/config/mongoose.config");

// Setup application
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser(process.env.COOKIE_PRIVATE_KEY));
app.use(express.static('public'));
app.set('views', path.join(__dirname, './src/views'));
app.set('view engine', 'ejs');

// Routers
app.use(allRouters);
SwaggerConfig(app); // Swagger configuration
app.use(notFoundError);
app.use(allErrorHandler);

// Setup Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server run on port ${PORT}.`));