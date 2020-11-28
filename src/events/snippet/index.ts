import { Message } from "discord.js";

import { Client } from "../../classes/Client";
import { Event } from "../../classes/Event";
import { createBin } from "../../functions/createBin";
import { getCode } from "../../functions/getCode";
import { getConfig } from "../../functions/getConfig";
import { sendBinEmbed } from "../../functions/sendBinEmbed";

export default class SnippetEvent extends Event {
	constructor(client: Client) {
		super("snippet", client);
	}

	async listener(message: Message, matches: RegExpMatchArray): Promise<void> {
		const MAX_LINES_ALLOWED = (await getConfig()).maxNumberOfLines;

		let rest = message.content;

		for (const block of matches) {
			const { language, code } = getCode(block);

			if (!code || code.split("\n").length < MAX_LINES_ALLOWED) {
				// - 1 as code is trimmed (one \n is lost)
				continue; // not enough newlines
			}

			const bin = await createBin(code, language || "txt");

			rest = rest.replace(block, bin instanceof Error ? bin.message : bin);
		}

		if (message.content === rest) {
			return;
		}

		await sendBinEmbed(message, rest);
	}
}
