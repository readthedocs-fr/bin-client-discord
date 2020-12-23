import { GuildChannel, Message } from "discord.js";
import fetch from "node-fetch";
import { extname } from "path";

import { Client, Event } from "../../classes";
import { createBin, processContent, sendBinEmbed } from "../../helpers";
import { extensions } from "../../misc/extensions";

const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);

export default class MessageEvent extends Event {
	constructor(client: Client) {
		super("message", client);
	}

	async listener(message: Message): Promise<void> {
		const categories = process.env.CATEGORIES!.split(",");
		if (
			!(message.channel instanceof GuildChannel) ||
			message.author.bot ||
			!categories.includes(message.channel.parentID!)
		) {
			return;
		}

		if (message.attachments.size > 0) {
			const file = message.attachments.first(); // only take first attachment as, normally, users cannot send more than one attachment

			if (!file?.name || file?.width) {
				return;
			}

			const fileExtension = extname(file.name).substring(1);
			const language = fileExtension || "txt";
			if (language !== "txt" && !extensions.has(language)) {
				return;
			}

			const code = await fetch(file.url)
				.then((res) => res.text())
				.catch(() => undefined);

			if (!code?.trim()) {
				return;
			}

			const bin = await createBin(code, language);

			const processed = await processContent(message.content);
			const content = bin instanceof Error ? bin.message : bin;

			if (processed) {
				sendBinEmbed(message, processed, (embed) => embed.addField("📁 Attachement", content));
			} else {
				sendBinEmbed(message, content);
			}
			return;
		}

		const lines = message.content.split("\n", MAX_LINES).length;
		if (lines < MAX_LINES) {
			return;
		}
		const processed = await processContent(message.content);
		if (processed) {
			sendBinEmbed(message, processed);
		}
	}
}
