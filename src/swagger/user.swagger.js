/**
 * @swagger
 * tags:
 *  name: User
 *  description: User Modules and Routes
 */

/**
 * @swagger
 *
 * /user/:
 *  get:
 *      summary: get all users (for admin).
 *      tags:
 *          -   User
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /user/me:
 *  get:
 *      summary: get verified user.
 *      tags:
 *          -   User
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /user/{userId}:
 *  get:
 *      summary: get user by id.
 *      tags:
 *          -   User
 *      parameters:
 *          -   in: path
 *              name: userId
 *              type: string
 *              required: true
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /user/by-mobile/{mobile}:
 *  get:
 *      summary: get user by mobile.
 *      tags:
 *          -   User
 *      parameters:
 *          -   in: path
 *              name: mobile
 *              type: string
 *              required: true
 *      responses:
 *          200:
 *              description: successful
 */