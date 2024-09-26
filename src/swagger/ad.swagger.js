/**
 * @swagger
 * tags:
 *  name: Ad
 *  description: Advertisement Modules and Routes
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *          CreateAd:
 *              type: object
 *              required:
 *                  -   title
 *                  -   description
 *                  -   category
 *                  -   province
 *                  -   city
 *              properties:
 *                  title:
 *                      type: string
 *                  description:
 *                      type: string
 *                  category:
 *                      type: string
 *                  price:
 *                      type: number
 *                  images:
 *                      type: array
 *                      items:
 *                          type: string
 *                          format: binary
 *                  province:
 *                      type: string
 *                  city:
 *                      type: string
 *                  district:
 *                      type: string
 *                  address:
 *                      type: string
 *                  options:
 *                      type: object
 *                      description: These options are specially defined for each category. See more at [/option/by-category/{categoryId}](#/Option/get_option_by_category__categoryId_)
 *                  showNumber:
 *                      type: boolean
 *                  isActiveChat:
 *                      type: boolean              
 */

/**
 * @swagger
 *
 * /ad/create:
 *  post:
 *      summary: create new ad.
 *      tags:
 *          -   Ad
 *      requestBody:
 *          content:
 *              multipart/form-data:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateAd'
 *      responses:
 *          201:
 *              description: successful
 */

/**
 * @swagger
 *
 * /ad:
 *  get:
 *      summary: get all ads.
 *      tags:
 *          -   Ad
 *      parameters:
 *          - in: query
 *            name: search
 *            schema:
 *              type: string
 *            description: Ads include this value will be returned.
 *          - in: query
 *            name: city
 *            schema:
 *              type: string
 *            description: Ads of this city will be returned.
 *          - in: query
 *            name: category
 *            schema:
 *              type: string
 *            description: Ads of this category will be returned.
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /ad/my:
 *  get:
 *      summary: get the authorized user's ads.
 *      tags:
 *          -   Ad
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /ad/{adId}:
 *  get:
 *      summary: get ad by id.
 *      tags:
 *          -   Ad
 *      parameters:
 *          - in: path
 *            name: adId
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /ad/{adId}:
 *  delete:
 *      summary: delete ad by id.
 *      tags:
 *          -   Ad
 *      parameters:
 *          - in: path
 *            name: adId
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /ad/bookmark:
 *  get:
 *      summary: get all authorized user's bookmarked ads.
 *      tags:
 *          -   Ad
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /ad/bookmark/{adId}:
 *  post:
 *      summary: bookmark an ad.
 *      tags:
 *          -   Ad
 *      parameters:
 *          - in: path
 *            name: adId
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *              description: successful
 */

/**
 * @swagger
 *
 * /ad/unbookmark/{adId}:
 *  post:
 *      summary: unbookmark an ad.
 *      tags:
 *          -   Ad
 *      parameters:
 *          - in: path
 *            name: adId
 *            required: true
 *            schema:
 *              type: string
 *      responses:
 *          201:
 *              description: successful
 */