import { GuildChannel, Message } from "discord.js";

import { Client } from "../../classes/Client";
import { Event } from "../../classes/Event";
import { getConfig } from "../../functions/getConfig";

export default class CodeInMessageEvent extends Event {
	constructor(client: Client) {
		super("message", client);
	}

	async listener(message: Message): Promise<void> {
		const config = await getConfig();
		if (
			!message.guild ||
			message.author.bot ||
			!(message.channel instanceof GuildChannel) ||
			!config.categoryIds.includes(message.channel.parentID as string)
		) {
			return;
		}

		const matches = message.content.match(/`{3}.*\n*(.+\n*)*?`{3}/g);
		if (matches) {
			this.client.emit("snippet", message, matches);
			return;
		}

		const { attachments } = message;
		if (attachments.size === 0) {
			return;
		}

		this.client.emit("file", message, attachments);
	}
}
