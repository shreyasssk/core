const { JWT_TOKEN } = process.env;
const jwt = require("jsonwebtoken");
const redis = require("../../db/redis");
const safeStringify = require("fast-safe-stringify");

// Used for sending a simple get request to the server and setting the key in redis
exports.heartbeat = (req, res) => {
	const { jwt: token } = req.cookies;

	jwt.verify(token, JWT_TOKEN, (err, data) => {
		if (err) {
			// TODO
		} else {
			// Setting connection status to true
			redis.set(data.id, safeStringify({ connected: true }));
			// Setting a TTL on the key to delete it after 5 minutes
			redis.expire(data.id, 10);
			// Getting the key value from the database
			redis.get(data.id, (err, reply) => {
				if (err) {
					// TODO
				} else {
					if (!reply) return res.json({ connected: false });
					else return res.json(JSON.parse(reply));
				}
			});
		}
	});
};

// Used for getting user status (online, offline, dnd, idle, ...)
exports.status = (req, res) => {
	const { accountId } = req.query;
	const { jwt: token } = req.cookies;

	// Verifying that our user is valid
	jwt.verify(token, JWT_TOKEN, (err, _) => {
		if (err) {
			// TODO
		} else {
			// If account id was provided
			if (accountId) {
				redis.exists(accountId, (err, reply) => {
					if (err) {
						// TODO
					} else {
						if (reply) return res.json({ connected: true });
						else return res.json({ connected: false });
					}
				});
			} else {
				// TODO
			}
		}
	});
};
