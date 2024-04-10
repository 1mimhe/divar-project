require('dotenv').config();
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

// Routers
app.use(allRouters);
SwaggerConfig(app); // Swagger configuration
app.use(notFoundError);
app.use(allErrorHandler);

// Setup Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server run on port ${PORT}.`));