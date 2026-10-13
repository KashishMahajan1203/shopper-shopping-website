const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require("../Models/User");
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../Utils/mailer');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createToken = (user) => jwt.sign(
    { email: user.email, _id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (user) {
            return res.status(409)
                .json({ message: 'An account with this email already exists. Please log in.', success: false });
        }
        const userModel = new UserModel({ name, email, password });
        userModel.password = await bcrypt.hash(password, 10);
        await userModel.save();
        sendWelcomeEmail(userModel);
        // Log the new user in straight away, so they don't have to log in again.
        res.status(201)
            .json({
                message: "Signup successfully",
                success: true,
                jwtToken: createToken(userModel),
                email: userModel.email,
                name: userModel.name
            })
    } catch (err) {
        console.error(err);
        res.status(500)
            .json({
                message: "Internal server error",
                success: false
            })
    }
}


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        const errorMsg = 'Auth failed email or password is wrong';
        if (!user) {
            return res.status(403)
                .json({ message: errorMsg, success: false });
        }
        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403)
                .json({ message: errorMsg, success: false });
        }
        const jwtToken = createToken(user);

        res.status(200)
            .json({
                message: "Login Success",
                success: true,
                jwtToken,
                email,
                name: user.name
            })
    } catch (err) {
        console.error(err);
        res.status(500)
            .json({
                message: "Internal server error",
                success: false
            })
    }
}

// Always answers the same way, so it can't be used to find out which emails are registered.
const forgotPassword = async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email });
        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = hashToken(token);
            user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
            await user.save();
            const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
            await sendPasswordResetEmail(user, `${clientUrl}/reset-password/${token}`);
        }
        res.status(200).json({
            success: true,
            message: 'If an account exists for this email, a reset link has been sent.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error", success: false });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await UserModel.findOne({
            resetPasswordToken: hashToken(token),
            resetPasswordExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400)
                .json({ message: 'This reset link is invalid or has expired', success: false });
        }
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        // Log the user in with the new password.
        res.status(200).json({
            success: true,
            message: 'Password updated',
            jwtToken: createToken(user),
            email: user.email,
            name: user.name
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error", success: false });
    }
}

module.exports = {
    signup,
    login,
    forgotPassword,
    resetPassword
}