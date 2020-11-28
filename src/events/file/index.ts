import { Collection, Message, MessageAttachment } from "discord.js";
import fetch from "node-fetch";

import { Client } from "../../classes/Client";
import { Event } from "../../classes/Event";
import { createBin } from "../../functions/createBin";
import { sendBinEmbed } from "../../functions/sendBinEmbed";

export default class FileEvent extends Event {
	constructor(client: Client) {
		super("file", client);
	}

	async listener(message: Message, attachments: Collection<string, MessageAttachment>): Promise<void> {
		const file = attachments.first(); // only take first attachment as, normally, users cannot send more than one attachment
		if (!file) {
			return;
		}

		const code = await fetch(file.url)
			.then((res) => res.text())
			.catch(() => {});
		if (!code) {
			return;
		}
		const language = file.name?.match(/\..+$/) ? file.name.split(".").pop() : "txt";

		const bin = await createBin(code, language);

		const content = `${message.content} ${bin}`.trimStart();

		await sendBinEmbed(message, content);
	}
}
