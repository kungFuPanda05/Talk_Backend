const DEFAULT_FRONTEND_ORIGINS = ["http://localhost:3000"];
const DEFAULT_ADMIN_ORIGINS = ["http://localhost:3001"];

const normalizeOrigin = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    try {
        const parsedOrigin = new URL(trimmedValue);
        if (!['http:', 'https:'].includes(parsedOrigin.protocol)) return null;
        return parsedOrigin.origin;
    } catch (error) {
        console.warn(`Ignoring invalid CORS origin: ${trimmedValue}`);
        return null;
    }
};

const originsFromEnvironment = (value, defaults) => {
    const configuredOrigins = value
        ? value.split(',')
        : defaults;

    return configuredOrigins
        .map(normalizeOrigin)
        .filter(Boolean);
};

export const allowedOrigins = Array.from(new Set([
    ...originsFromEnvironment(process.env.FRONTEND_URL, DEFAULT_FRONTEND_ORIGINS),
    ...originsFromEnvironment(process.env.ADMIN_FRONTEND_URL, DEFAULT_ADMIN_ORIGINS),
]));

export const isAllowedOrigin = (origin) => {
    // Requests without an Origin header include server-to-server calls and Railway's
    // healthcheck. CORS is a browser policy, so these requests remain valid.
    if (!origin) return true;
    return allowedOrigins.includes(origin);
};

export const expressCorsOptions = {
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }

        callback(new RequestError('Origin is not allowed by CORS', 403));
    },
};

export const socketCorsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
};
