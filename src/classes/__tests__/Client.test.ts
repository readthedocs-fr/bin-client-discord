import { Options } from "discord.js";

import { Client } from "../index.js";

describe(Client.prototype.init, () => {
	it("should throw error if the env variables are invalid", () => {
		const client = new Client({
			partials: ["USER", "GUILD_MEMBER"],
			makeCache: Options.cacheWithLimits({
				MessageManager: 0,
				PresenceManager: 0,
			}), // don't cache messages
			intents: ["GUILD_MESSAGES", "GUILDS", "GUILD_MESSAGE_REACTIONS"],
		});

		expect(client.init()).rejects.toThrow("Current environment is invalid.");
	});
});
