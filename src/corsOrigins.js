const DEFAULT_FRONTEND_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const DEFAULT_ADMIN_ORIGINS = ["http://localhost:3001", "http://127.0.0.1:3001"];
const DEFAULT_MOBILE_ORIGINS = ["http://localhost:8081", "http://127.0.0.1:8081"];

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
    ...originsFromEnvironment(process.env.FRONTEND_URL, []),
    ...originsFromEnvironment(process.env.ADMIN_FRONTEND_URL, []),
    ...originsFromEnvironment(process.env.MOBILE_FRONTEND_URL, []),
    ...(process.env.NODE_ENV === 'production' ? [] : [
        ...DEFAULT_FRONTEND_ORIGINS,
        ...DEFAULT_ADMIN_ORIGINS,
        ...DEFAULT_MOBILE_ORIGINS,
    ]),
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
