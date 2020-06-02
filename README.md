# Spotify El Ghalaba Backend

This is the complete backend project for Spotify El Ghalaba, a Spotify clone project.\
It mimics the complete Spotify API behaviour.

# Technologies used

1. Node.js w/ express
2. MongoDB
3. Mongoose
4. Mocha
5. Istanbul
6. JSDoc
7. Amazon AWS services

# Prerequisities

### Packages

To be able to run the project successfully you need to have the following packages:

1. MongoDB server
2. `npm` globally installed

You can install MongoDB Server from their official website.\
You can install npm from the `npmjs` website.
You should install `nodemon` globally

### Environment Variables

You need to create an environment variables file named `config.env` in the root directory, there is an example environment variables file in the root directory, namely `.env.example` . Please make sure to correctly fill the env variables to avoid runtime errors.

For testing you also need another environment variables file named `.test.env`, it has the same (or less) environment variables of the `.env.example`.

# How to run?

First of all please run your local MongoDB server and then seed the database if you would like to, as refered to in the [**Database Seeds**](#database-seeds) section.

Then run `npm install` in your terminal to install all the dependencies of the project.

You can then very easily run the project in development mode using `npm run start`, if you want to run in a production environment please refer to the [**Development or Production**](#Development-or-Production) section.

Please make sure to install all the prerequisities listed above in the [**Prerequisities**](#prerequisities) section.

# Database Seeds

To seed an empty database before running the project you should run `npm run seed`, this will use the prewritten seeds stored in `./seeds/` to seed your local database.<br/>

<b>Note (VIP!):</b><br/>
You have to add some '.mp3' tracks to folder ./seeds/tracks before you run seeds. You can download this <a href ="https://drive.google.com/drive/folders/1bcyXMqYylsEWA89Z74ctR3ZZh-GbK_nN?usp=sharing">track collection</a><br/>

You have to add some images to folder ./seeds/ads before you run seeds. You can download this <a href ="https://drive.google.com/file/d/1TTm-SiST5g9nVha__CA_PUVtRomvkJnf/view?usp=sharing">image collection</a><br/>

**DISCLAIMER** Take care as database seeds will wipe your database clean before seeding.

There is no need to handle migrations, they are automatically handled as we use `MongoDB` which is a NoSQL database.

# Unit Testing

To run the unit tests simply run `npm test`. The tests will run in your terminal specifying how long each test took and which ones failed.

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

When you use the seeds 'npm run seed' the following you can use the following users to test:

| Email             | Password | Type   | Product |
| ----------------- | -------- | ------ | ------- |
| user1@gmail.com   | password | user   | free    |
| user11@gmail.com  | password | user   | premium |
| artist1@gmail.com | password | artist | free    |
