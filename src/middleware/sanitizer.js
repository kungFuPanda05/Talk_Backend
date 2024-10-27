const emailValidator = require('email-validator'); // Use email-validator library or similar

// Function to sanitize a name (allow only valid characters)
const sanitizeName = (name) => {
    return name.replace(/[^a-zA-Z\s'-]/g, '').trim(); // Allow letters, spaces, hyphens, and apostrophes
};

// Recursive sanitization function
const sanitizeObj = function (obj, ignore, req) {
    if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
        // If obj is an object, sanitize its properties recursively
        for (const key of Object.keys(obj)) {
            if (!ignore.includes(key)) {
                obj[key] = sanitizeObj(obj[key], ignore, req);
            }
        }
    } else if (Array.isArray(obj)) {
        // If obj is an array, sanitize each element
        for (let i = 0; i < obj.length; i++) {
            obj[i] = sanitizeObj(obj[i], ignore, req);
        }
    } else if (typeof obj === 'string' && obj !== '') {
        // If obj is a string, sanitize it
        obj = req.sanitize(obj).trim();
        obj = obj.replace(/[=<>]/g, ''); // Remove unwanted special characters
        obj = obj.replace(/&amp;/g, '&'); // Replace &amp; with &
    }
    return obj;
};

// Improved sanitization middleware
export const sanitize = function (ignore = []) {
    return (req, res, next) => {
        // Sanitize name and validate email
        if (req.body) {
            // Validate and sanitize email
            if (req.body.email) {
                if (!emailValidator.validate(req.body.email)) {
                    return res.status(400).send({ error: 'Invalid email format' });
                }
            }
            // Sanitize name
            if (req.body.name) {
                req.body.name = sanitizeName(req.body.name);
            }
            // Sanitize other fields in req.body
            req.body = sanitizeObj(req.body, ignore, req);
        }

        if (req.params) {
            // Validate and sanitize email
            if (req.params.email) {
                if (!emailValidator.validate(req.params.email)) {
                    return res.status(400).send({ error: 'Invalid email format' });
                }
            }
            // Sanitize name
            if (req.params.name) {
                req.params.name = sanitizeName(req.params.name);
            }
            // Sanitize other fields in req.params
            req.params = sanitizeObj(req.params, ignore, req);
        }

        if (req.query) {
            // Validate and sanitize email
            if (req.query.email) {
                if (!emailValidator.validate(req.query.email)) {
                    return res.status(400).send({ error: 'Invalid email format' });
                }
            }
            // Sanitize name
            if (req.query.name) {
                req.query.name = sanitizeName(req.query.name);
            }
            // Sanitize other fields in req.query
            req.query = sanitizeObj(req.query, ignore, req);
        }

        next();
    };
};
