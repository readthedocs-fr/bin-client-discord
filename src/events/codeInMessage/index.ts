import { Message, MessageEmbed, MessageReaction, User } from "discord.js";

import { Client } from "../../classes/Client";
import { Event } from "../../classes/Event";
import { createBin } from "../../functions/createBin";
import { getCode } from "../../functions/getCode";
import { getConfig } from "../../functions/getConfig";

export default class CodeInMessageEvent extends Event {
	constructor(client: Client) {
		super("message", client);
	}

	async listener(message: Message): Promise<void> {
		const MAX_LINES_ALLOWED = (await getConfig()).maxNumberOfLines;

		if (!message.guild || message.author.bot) {
			return;
		}

		const matches = message.content.match(/`{3}.*\n*(.+\n*)*?`{3}/g);

		if (!matches) {
			return; // no code block detected
		}

		let rest = message.content;

		for (const block of matches) {
			const { language, code } = getCode(block);

			if (!code || code.split("\n").length - 1 < MAX_LINES_ALLOWED - 1) {
				// - 1 as code is trimmed (one \n is lost)
				continue; // not enough newlines
			}

			const bin = await createBin(code, language || "txt");

			rest = rest.replace(block, bin || "[error, please warn the bot owner]");
		}

		if (message.content === rest) {
			return;
		}

		await message.delete().catch(() => {});

		const embed = new MessageEmbed()
			.setAuthor(message.member?.displayName as string, message.author.displayAvatarURL({ dynamic: true }))
			.setDescription(rest)
			.setTimestamp(message.createdAt);

		const botMessage = await message.channel.send(embed).catch(() => {});
		if (!botMessage) {
			return;
		}

		await botMessage.react("🗑️");

		const filter = (reaction: MessageReaction, user: User): boolean =>
			reaction.message.id === botMessage.id && user.id === message.author.id && reaction.emoji.name === "🗑️";
		const collector = await botMessage.awaitReactions(filter, { max: 1 });
		const reaction = collector.first();

		if (!reaction) {
			return;
		}
		if (reaction.partial) {
			await reaction.fetch();
		}
		if (reaction.message.partial) {
			await reaction.message.fetch();
		}

		await botMessage.delete();
	}
}
