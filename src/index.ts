import { Client } from "./classes";
import { logError } from "./helpers/logError";

const client = new Client({
	messageEditHistoryMaxSize: 0,
	partials: ["USER", "GUILD_MEMBER"],
	ws: {
		intents: ["GUILD_MESSAGES", "GUILDS", "GUILD_MESSAGE_REACTIONS"],
	},
});

client.init().catch((error) => {
	logError(error);
	process.exit(1);
});
