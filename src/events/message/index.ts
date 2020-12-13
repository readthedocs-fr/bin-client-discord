import { GuildChannel, Message } from "discord.js";
import fetch from "node-fetch";
import { extname } from "path";

import { Client, Event } from "../../classes";
import { blockMatcher, blocksToBins, createBin, sendBinEmbed } from "../../helpers";
import { extensions } from "../../misc/extensions";

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

			const fileExtension = extname(file.name).replace(".", "");
			const language = fileExtension === "" ? "txt" : fileExtension;
			if (language !== "txt" && !extensions.has(language)) {
				return;
			}

			const code = await fetch(file.url)
				.then((res) => res.text())
				.catch(() => {});

			if (!code) {
				return;
			}

			const bin = await createBin(code, language);

			const blocks = blockMatcher(message.content);

			if (blocks.length === 0) {
				return;
			}

			const content = `${await blocksToBins(blocks)} ${bin instanceof Error ? bin.message : bin}`.trimStart();

			await sendBinEmbed(message, content);
			return;
		}

		const blocks = blockMatcher(message.content);

		if (blocks.length > 0) {
			const content = await blocksToBins(blocks);

			if (message.content === content) {
				return;
			}

			sendBinEmbed(message, content);
		}
	}
}
