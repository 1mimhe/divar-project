const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

function SwaggerConfig(app) {
    const swaggerDocument = swaggerJsDoc({
        swaggerDefinition: {
            info: {
                title: "divar-backend",
                description: "A store project",
                version: "1.0.0"
            }
        },
        apis: []
    });

    const swagger = swaggerUI.setup(swaggerDocument, {});
    app.use("/swagger", swaggerUI.serve, swagger);
}

module.exports = SwaggerConfig;