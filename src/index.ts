import { Client } from "./classes/Client";

const client = new Client({
	partials: ["USER", "GUILD_MEMBER"],
	ws: {
		intents: ["GUILD_MESSAGES", "GUILDS", "GUILD_MESSAGE_REACTIONS"],
	},
});

client.init().catch((error) => {
	throw error; // intended thrown error
});

export { client };
