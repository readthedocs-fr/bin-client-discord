import { GuildChannel, Message } from "discord.js";

import { Client } from "../../classes/Client";
import { Event } from "../../classes/Event";
import { blockMatcher } from "../../functions/codeBlock";

export default class CodeInMessageEvent extends Event {
	constructor(client: Client) {
		super("message", client);
	}

	async listener(message: Message): Promise<void> {
		const categories = process.env.CATEGORIES!.split(" ");
		if (
			!message.guild ||
			message.author.bot ||
			!(message.channel instanceof GuildChannel) ||
			!categories.includes(message.channel.parentID!)
		) {
			return;
		}

		const { attachments } = message;
		if (attachments.size !== 0) {
			this.client.emit("file", message, attachments);
			return;
		}

		const blocks = await blockMatcher(message.content);

		if (blocks.size !== 0) {
			this.client.emit("snippet", message, blocks);
		}
	}
}
