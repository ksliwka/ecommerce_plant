# Plant Marketplace

## Table of Contents

- [Overwiew](#overview)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Requirements](#requirements)
- [Installation and Usage](#installation-and-usage)
- [Configuration](#configuration)

## Overview

This full-stack website project enables users to buy and sell plants, creating a vibrant marketplace for plant enthusiasts. The platform offers a range of features including user registration, authentication, and authorization, allowing users to securely access their accounts and interact with the marketplace.

## Key Features

- User Registration: Users can create accounts, providing necessary information for a seamless buying and selling experience.
- Authentication and Authorization: Secure login functionality ensures that only authorized users can access their accounts and perform actions.
- Plant Listing CRUD Functionality: Sellers can create, read, update, and delete plant listings, showcasing their offerings to potential buyers.
- Reviews and Ratings: Buyers can leave feedback and ratings for their purchased plants, facilitating trust and informed decision-making.
- Data Validation: Robust data validation ensures that inputs are accurate and reliable, enhancing the integrity of the marketplace.
- Error Handling: Comprehensive error handling mechanisms provide a smooth user experience, preventing disruption and confusion.
- Integration with MongoDB Database: Leveraging the power of MongoDB, the project seamlessly stores and retrieves data, ensuring efficient and scalable operations.

## Technologies Used

Node.js: A powerful JavaScript runtime environment used for server-side development.
Express.js: A flexible and minimalist web application framework for Node.js, enabling efficient routing and middleware handling.
MongoDB: A popular NoSQL database, providing scalability and flexibility for managing data.
HTML/CSS/JavaScript: Standard web technologies for creating an interactive and visually appealing user interface.

## Requirements

This project requires the following modules:

- connect-flash: ^0.1.1
- connect-mongo: ^3.2.0
- connect-mongodb-session: ^3.1.1
- dotenv: ^16.0.3
- ejs: ^3.1.8
- ejs-mate: ^4.0.0
- express: ^4.18.2
- express-session: ^1.17.3
- joi: ^17.7.0
- method-override: ^3.0.0
- mongoose: ^6.7.3
- multer: ^1.4.5-lts.1
- multer-storage-cloudinary: ^4.0.0
- passport: ^0.6.0
- passport-local: ^1.0.0
- passport-local-mongoose: ^7.1.2

## Installation and Usage

1. Clone the repository.
2. Install dependencies using npm install.
3. Set up environment variables (e.g., API keys, database credentials) using a .env file.
4. Start the server using npm start or nodemon for development purposes.
5. Access the website on localhost:3000 or the specified port.

## Configuration

1. Set up environment variables:
2. Create a .env file in the project root directory.
3. Add the required environment variables with their corresponding values.
4. Example .env file:

MONGODB_URI=your-mongodb-uri
