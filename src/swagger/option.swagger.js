/**
 * @swagger
 * tags:
 *  name: Option
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
 *                  -   required
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
 *                  required:
 *                      type: boolean
 *                  enum:
 *                      type:   array
 *                      items:
 *                          type: string
 *                  guide:
 *                      type: string
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *          UpdateOption:
 *              type: object
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
 *                  required:
 *                      type: boolean
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
 * /option/by-category/{categoryId}:
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

/**
 * @swagger
 *
 * /option/by-category-slug/{slug}:
 *  get:
 *      summary: get all options of a category by slug
 *      tags:
 *          -   Option
 *      parameters:
 *          -   in: path
 *              name: slug
 *              type: string
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /option/{id}:
 *  get:
 *      summary: get option by id
 *      tags:
 *          -   Option
 *      parameters:
 *          -   in: path
 *              name: id
 *              type: string
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /option:
 *  get:
 *      summary: get all options
 *      tags:
 *          -   Option
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /option/{id}:
 *  put:
 *      summary: update an option
 *      tags:
 *          -   Option
 *      parameters:
 *          -   in: path
 *              name: id
 *              type: string
 *      requestBody:
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/UpdateOption'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/UpdateOption'
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /option/{id}:
 *  delete:
 *      summary: delete an option by id
 *      tags:
 *          -   Option
 *      parameters:
 *          -   in: path
 *              name: id
 *              type: string
 *      responses:
 *          200:
 *              description: successful
 */