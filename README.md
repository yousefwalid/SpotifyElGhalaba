# Spotify El Ghalaba Backend

This is the complete backend project for Spotify El Ghalaba, a Spotify clone project.\
It mimics the complete Spotify API behaviour.

# Technologies used

1. Node.js w/ express
2. MongoDB
3. Mongoose
4. Mocha
5. JSDoc
6. Amazon AWS services w/ Multer

# Prerequisities

### Packages

To be able to run the project successfully you need to have the following packages:

1. MongoDB server
2. `npm` globally installed
3. `nodemon` globally installed (for development)

You can install MongoDB Server from their official website.\
You can install npm from the `npmjs` website, and `nodemon` globally by running the following command with npm: `npm install nodemon -g`.

### Environment Variables

You need to create an environment variables file named `config.env` in the root directory, there is an example environment variables file in the root directory, namely `.env.example` . Please make sure to correctly fill the env variables to avoid runtime errors.

For testing you also need another environment variables file named `.test.env`, it has the same environment variables of the `.env.example`.

# How to run?

First of all please run your local MongoDB server and then seed the database if you would like to, as refered to in the [**Database Seeds**](#database-seeds) section.

Then run `npm install` in your terminal to install all the dependencies of the project.

You can then very easily run the project using `npm run start`, if you want to run in a production environment please refer to the [**Development or Production**](#Development-or-Production) section.

Please make sure to install all the prerequisities listed above in the [**Prerequisities**](#prerequisities) section.

# Database Seeds

To seed an empty database before running the project you should run `npm run seeds`, this will use the prewritten seeds stored in `./seeds/` to seed your local database.

There is no need to handle migrations, they are automatically handled as we use `MongoDB` which is a NoSQL database.

# Unit Testing

To run the unit tests simply run `npm run test`. The tests will run in your terminal specifying how long each test took and which ones failed.

Coverage is reported in the terminal as well as exported to an html page inside `./coverage/`.

Please make sure to have a `.test.env` file containing the environment variables for testing, and having the testing database connection string.

We use `mocha` for unit testing and `instanbul` for coverage reporting.

# Development or Production

Our project has two environments, development or production.
If you are a developer you can use `npm run start` to run the project in development mode, however you can also run it in the production using `npm run start:prod`.

The difference between the two is that in development you get full details of runtime errors so you can make debugging easier, while in production the errors are automatically handled to a `500 Internal Server Error` to avoid leaking data about the call stack to users in production.

# Functional Documentation

For functional documentation we use `JSDoc`, you can generate the functional documentation using `npm run doc`, the documentation will be generated in a static webpage stored in `./docs/`, you can then open the `index.html` file stored there to view the full functional documentation.

# API Documentation

We use `Postman` for generating the API documentation, so the documentation is hosted on a [remote webpage](https://documenter.getpostman.com/view/10979846/SzYdRvf2?version=latest) and not locally, however you can import our `Postman` collection which is stored in `./api_docs/` and generate the full documentation page by importing it into `Postman` and publishing the documentation of the collection or you can just use `Postman` for your development and use our readily made collection there.\
_Note: please refer to the official `Postman` page if you don't know how to publish the collection's API documentation_

It is prefered to use the remote webpage to stay updated with the changes in the API documentation, but if you are in a tight situation, the local postman exported collection is there for you.

# For testers

When you use the spotify-cli to build and run this code, it autofills the DB with 6 users

| UserName      | Email              | Password | Type   | Product |
| ------------- | ------------------ | -------- | ------ | ------- |
| adminfree     | admin@free.com     | password | admin  | free    |
| userfree      | user@free.com      | password | user   | free    |
| artistfree    | artist@free.com    | password | artist | free    |
| adminpremium  | admin@premium.com  | password | admin  | premium |
| userpremium   | user@premium.com   | password | user   | premium |
| artistpremium | artist@premium.com | password | artist | premium |
