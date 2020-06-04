const express = require('express');
const bodyParser = require('body-parser');
const graphQlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());

// ! sign makes the objects not nullable
app.use('/graphql', graphQlHttp({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true,
}));

mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${
    process.env.MONGO_PASSWORD
    }@event-booking-graphql-wrsgw.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`
).then(() => {
    app.listen(PORT, () => console.log(`Server is up on port ${PORT}`));
}).catch((err) => console.log(err));
