const express = require('express');
const bodyParser = require('body-parser');
const graphQlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/event');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());
// ! sign makes the objects not nullable
app.use('/graphql', graphQlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!,
            title: String!,
            description: String!,
            price: Float!,
            date: String!,
        }

        input EventInput {
            title: String!,
            description: String!,
            price: Float!,
            date: String!,
        }

        type RootQuery {
            events: [Event!]!,
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event,
        }

        schema{
            query: RootQuery,
            mutation: RootMutation,
        }
    `),
    rootValue: {
        /** example
         query{
            events{
                _id,
                description
                date
            }
        }
         */
        events: () => Event.find({}).then(events => {
            return events.map(event => {
                return { ...event._doc, _id: event._doc._id.toString() };
            });
        }).catch(err => { throw err })
        ,
        /** example
         mutation{
            createEvent(eventInput: {
                title: "Testing",
                description: "Do you work?",
                price: 9.99,
                date: "2020-06-04T09:29:39.216Z"
            }) {
                _id,
                description,
                date
            }
        }
         */
        createEvent: (args) => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
            });
            return event.save().then((result) => {
                return { ...result._doc, _id: event.id }; // event.id is a shortcut of event._doc._id.toString() provided by mongoose
            }).catch(err => {
                console.log(err)
                throw err;
            });
            return event;
        }
    },
    graphiql: true,
}));

mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${
    process.env.MONGO_PASSWORD
    }@event-booking-graphql-wrsgw.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`
).then(() => {
    app.listen(PORT, () => console.log(`Server is up on port ${PORT}`));
}).catch((err) => console.log(err));
