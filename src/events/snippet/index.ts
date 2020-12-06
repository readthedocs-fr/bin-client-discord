import { Message } from "discord.js";

import { Client } from "../../classes/Client";
import { Event } from "../../classes/Event";
import { blocksToBins } from "../../functions/codeBlock";
import { sendBinEmbed } from "../../functions/sendBinEmbed";

export default class SnippetEvent extends Event {
	constructor(client: Client) {
		super("snippet", client);
	}

	async listener(message: Message, blocks: Map<string, { language: string; code: string }>): Promise<void> {
		const content = await blocksToBins(message.content, blocks);

		if (message.content === content) {
			return;
		}

		await sendBinEmbed(message, content);
	}
}
