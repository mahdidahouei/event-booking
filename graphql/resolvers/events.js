const Event = require('../../models/event');
const { transformEvent } = require('./merge')

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
                return transformEvent(event);
            });
        }
        catch (err) {
            throw err;
        }
    },
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
            createdEvent =  transformEvent(result);
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
}