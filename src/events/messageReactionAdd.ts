import { GuildChannel } from "discord.js";

import { Event } from "../classes";
import { handleMessage } from "../helpers/handleMessage";
import { hasPermissions } from "../helpers/member";

const CATEGORIES = new Set(process.env.CATEGORIES!.split(","));
const TRANSFORM_MIN_REACTIONS = parseInt(process.env.TRANSFORM_MIN_REACTIONS!, 10);

export default new Event("messageReactionAdd", async function (reaction, user) {
	const { message } = reaction;

	if (
		!(message.channel instanceof GuildChannel) ||
		message.author.bot ||
		!CATEGORIES.has(message.channel.parentID!) ||
		reaction.emoji.name !== "💾"
	) {
		return;
	}

	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch {
			return;
		}
	}

	if (
		message.author.id === user.id ||
		reaction.count! >= TRANSFORM_MIN_REACTIONS ||
		(await hasPermissions(message.guild!.members, user, "MANAGE_MESSAGES"))
	) {
		handleMessage(message);
	}
});
