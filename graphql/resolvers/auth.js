const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../../models/user');

module.exports = {
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
    },
    login: async ({email, password}) => {
        const user = await User.findOne({email:email});

        

        if(!user) throw new Error('User does not exist');

        const isEqual = await bcrypt.compare(password, user.password);

        if(!isEqual) throw new Error('Password is incorrect!');

        let expirationDays = 14;


        const token = jwt.sign({userId: user.id, email: user.email}, process.env.JWT_KEY, {
            expiresIn: `${expirationDays}d`
        });

        return {
            userId: user.id,
            token: token,
            tokenExpiration: expirationHours,
        }
    } 
}