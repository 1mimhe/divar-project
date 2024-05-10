/**
 * @swagger
 * tags:
 *  name: Category
 *  description: Option Modules and Routes
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *          CreateOption:
 *              type: object
 *              required:
 *                  -   title
 *                  -   key
 *                  -   type
 *                  -   category
 *              properties:
 *                  title:
 *                      type: string
 *                  key:
 *                      type: string
 *                  type:
 *                      type: string
 *                      enum:
 *                          -   number
 *                          -   string
 *                          -   boolean
 *                  category:
 *                      type: string
 *                  enum:
 *                      type:   array
 *                      items:
 *                          type: string
 *                  guide:
 *                      type: string
 */

/**
 * @swagger
 *
 * /option:
 *  post:
 *      summary: create new option for a category
 *      tags:
 *          -   Option
 *      requestBody:
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateOption'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateOption'
 *      responses:
 *          201:
 *              description: created
 */

/**
 * @swagger
 *
 * /option/{categoryId}:
 *  get:
 *      summary: get all options of a category
 *      tags:
 *          -   Option
 *      parameters:
 *          -   in: path
 *              name: categoryId
 *              type: string
 *      responses:
 *          200:
 *              description: successful
 */