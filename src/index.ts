import { Client } from "./classes";
import { logError } from "./helpers/logError";

const client = new Client({
	partials: ["USER", "GUILD_MEMBER"],
	messageCacheMaxSize: 0, // don't cache messages
	ws: {
		intents: ["GUILD_MESSAGES", "GUILDS", "GUILD_MESSAGE_REACTIONS"],
	},
});

client.init().catch((error) => {
	logError(error);
	process.exit(1);
});
