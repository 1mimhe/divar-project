/**
 * @swagger
 * tags:
 *  name: Category
 *  description: Category Modules and Routes
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *          CreateCategory:
 *              type: object
 *              required:
 *                  -   name
 *                  -   icon
 *              properties:
 *                  name:
 *                      type: string
 *                  slug:
 *                      type: string
 *                  icon:
 *                      type: string
 *                  parent:
 *                      type: string
 */

/**
 * @swagger
 *
 * /category:
 *  post:
 *      summary: create new category.
 *      tags:
 *          -   Category
 *      requestBody:
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateCategory'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateCategory'
 *      responses:
 *          201:
 *              description: created
 */

/**
 * @swagger
 *
 * /category:
 *  get:
 *      summary: get all categories.
 *      tags:
 *          -   Category
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /category/{categoryId}:
 *  delete:
 *      summary: delete a category with its option.
 *      tags:
 *          -   Category
 *      parameters:
 *          - in: path
 *            name: categoryId
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: successful
 */