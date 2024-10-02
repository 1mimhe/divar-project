
# Divar Project

<div align="center">
    <img src="./public/assets/images/logos/DivarLogo.png" alt="Divar Project" style="width: 300px;"/>
</div>

Divar is a popular online classifieds platform in Iran. It allows users to buy, sell, and trade a wide range of items.

This project is a personal clone of [Divar.ir](https://divar.ir/) functionalities, built to showcase my skills and development capabilities for resume purposes. It's not intended for production use.

The core focus of this project was the development of backend part. To implement the frontend part, I use template engine and some code components.


## Features
- User authentication using One-Time Passwords (OTP)
- Posting and managing categorized ads
- Advanced search for ads, including city and keyword filters
- Browsing ads by specific category
- Bookmark ads and Add notes for each ad
- Creating custom categories
- Defining specific attributes (Call it Options) for each category
- API documentation (at `/swagger` route)
- , ...


## Technologies Used
- Node.js
- Express.js
- MongoDB
- Swagger UI
- JWT
- EJS
- , ...


## Project Setup
1. Clone the repository
   ```sh
   git clone https://github.com/1mimhe/divar-project
   ```
2. Go to divar-project directory.
3. Install NPM packages
   ```sh
   npm install
   ```
4. Import root categories (optional)
   ```sh
   mongoimport --uri mongodb://127.0.0.1:27017/divar-store --collection categories --file divar-store.categories.json --jsonArray
   ```
5. Run app
   ```sh
   npm start
   ```