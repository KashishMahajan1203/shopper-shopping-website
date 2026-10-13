const Joi = require('joi');

// Respond with the first validation problem as a readable message,
// e.g. "\"password\" length must be at least 4 characters long".
const sendValidationError = (res, error) =>
    res.status(400)
        .json({ message: error.details[0].message.replace(/"/g, ''), success: false, error });

const signupValidation = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(3).max(100).required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().min(4).max(100).required()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
        return sendValidationError(res, error);
    }
    req.body = value;
    next();
}
const loginValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().trim().email().required(),
        password: Joi.string().min(4).max(100).required()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
        return sendValidationError(res, error);
    }
    req.body = value;
    next();
}
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
        return sendValidationError(res, error);
    }
    req.body = value;
    next();
}

const forgotPasswordValidation = validate(Joi.object({
    email: Joi.string().trim().email().required()
}));

const resetPasswordValidation = validate(Joi.object({
    token: Joi.string().hex().length(64).required(),
    password: Joi.string().min(4).max(100).required()
}));

module.exports = {
    signupValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
}
