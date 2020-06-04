const express = require('express');
const bodyParser = require('body-parser');
const graphQlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

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

        type User {
            _id: ID!,
            email: String!,
            password: String,
        }

        input EventInput {
            title: String!,
            description: String!,
            price: Float!,
            date: String!,
        }

        input UserInput {
            email: String!,
            password: String!,
        }

        type RootQuery {
            events: [Event!]!,
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event,
            createUser(userInput: UserInput): User,
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
                creator: '5ed9097e12459b3720a56e0a',
            });
            let createdEvent;
            return event.save()
            .then((result) => {
                createdEvent = { ...result._doc, _id: event.id }; // event.id is a shortcut of event._doc._id.toString() provided by mongoose
                return User.findById('5ed9097e12459b3720a56e0a');
                
            }).catch(err => {
                console.log(err)
                throw err;
            }).then(user => {
                if (!user) throw new Error('User not found');

                user.createdEvents.push(event);
                return user.save();
            }).catch(err => {
                console.log(err)
                throw err;
            }).then(result => {
                return createdEvent;
            }).catch(err => {
                console.log(err)
                throw err;
            });
        },
        createUser: args => {
            return User.findOne({ email: args.userInput.email })
                .then(user => {
                    if (user) throw new Error('User already Exists');

                    return bcrypt.hash(args.userInput.password, 12)

                })
                .catch(err => {
                    throw err;
                }).then(hashedValue => {
                    const user = new User({
                        email: args.userInput.email,
                        password: hashedValue,
                    });
                    return user.save()
                        .then(user => {
                            return { ...user._doc, _id: user.id, password: null };
                        })
                        .catch(err => {
                            throw err;
                        });
                })
                .catch(err => {
                    throw err;
                });
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
