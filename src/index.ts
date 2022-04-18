import { Client } from "./classes/index.js";
import { logError } from "./helpers/index.js";

const client = new Client({
	partials: ["USER", "GUILD_MEMBER", "REACTION"],
	intents: ["GUILD_MESSAGES", "GUILDS", "GUILD_MESSAGE_REACTIONS"],
});

client.init().catch((error) => {
	logError(error);
	process.exit(1);
});
