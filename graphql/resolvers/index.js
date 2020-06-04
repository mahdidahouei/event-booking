const bcrypt = require('bcryptjs');

const Event = require('../../models/event');
const User = require('../../models/user');

const events = async eventIds => {
    /// * $in is understood by mongoose
    /// * eventIds is an array of Ids
    /// * events in the database are also at the end a list of all events
    /// * So this query finds all the events that their id is present in eventIds array!!!
    try {
        const events = await Event.find({ _id: { $in: eventIds } });
        return events.map(event => {
            return {
                ...event._doc,
                _id: event.id,
                date: new Date(event._doc.date).toISOString(),
                creator: user.bind(this, event._doc.creator),
            };
        });
    }
    catch (err) {
        throw err;
    }
}

const user = async userId => {
    try {
        const user = await User.findById(userId);
        return { ...user._doc, _id: user.id, createdEvents: events.bind(this, user._doc.createdEvents), password: null };
    }
    catch (err) {
        throw err;
    }
}

module.exports = {
    /** example
     query{
        events{
            _id,
            description
            date
        }
    }
     */
    events: async () => {
        try {
            const events = await Event.find({});
            return events.map(event => {
                return {
                    ...event._doc,
                    _id: event._doc._id.toString(),
                    date: new Date(event._doc.date).toISOString(),
                    creator: user.bind(this, event._doc.creator),
                };
            });
        }
        catch (err) {
            throw err;
        }
    }
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
    createEvent: async (args) => {
        const event = new Event({
            title: args.eventInput.title,
            description: args.eventInput.description,
            price: +args.eventInput.price,
            date: new Date(args.eventInput.date),
            creator: '5ed946edbaf61812d09efd65',
        });
        let createdEvent;

        try {
            const result = await event.save()
            createdEvent = {
                ...result._doc,
                _id: event.id,
                date: new Date(event._doc.date).toISOString(),
                creator: user.bind(this, result._doc.creator),
            }; // event.id is a shortcut of event._doc._id.toString() provided by mongoose
            const creator = await User.findById('5ed946edbaf61812d09efd65');

            if (!creator) throw new Error('User not found');

            creator.createdEvents.push(event);
            await creator.save();
            return createdEvent;
        }
        catch (err) {
            console.log(err)
            throw err;
        };
    },
    createUser: async args => {
        try {
            const existingUser = await User.findOne({ email: args.userInput.email })
            if (existingUser) throw new Error('User already Exists');

            const hashedValue = await bcrypt.hash(args.userInput.password, 12)
            const user = new User({
                email: args.userInput.email,
                password: hashedValue,
            });
            const result = await user.save()
            return { ...result._doc, _id: result.id, password: null };
        }
        catch (err) {
            throw err;
        };
    }
}