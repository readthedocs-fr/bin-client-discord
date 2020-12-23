import { Client } from "./classes";

const client = new Client({
	partials: ["USER", "GUILD_MEMBER"],
	ws: {
		intents: ["GUILD_MESSAGES", "GUILDS", "GUILD_MESSAGE_REACTIONS"],
	},
});

client.init().catch((error) => {
	console.error(`[${new Date().toLocaleString()}]`, error);
	process.exit(1);
});
