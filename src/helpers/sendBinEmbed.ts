import { Collection, Message, MessageAttachment, MessageEmbed, MessageReaction, Snowflake, User } from "discord.js";

import { request } from "./request";

const noop = (): undefined => undefined;

const ADMIN_TOKEN = `Token ${process.env.BINS_TOKEN!}`;
const MAX_ATTACHMENTS_SIZE = 8_388_381;

export async function sendBinEmbed(
	message: Message,
	description: string,
	binUrls?: string[],
	extender?: (embed: MessageEmbed) => MessageEmbed,
	attachments?: Collection<Snowflake, MessageAttachment>,
): Promise<void> {
	const embed = new MessageEmbed({ description })
		.setAuthor(message.member!.displayName, message.author.displayAvatarURL({ dynamic: true }))
		.setTimestamp(message.createdAt);

	if (extender) {
		extender(embed);
	}

	const waitMessage = await message.channel.send("Transformation du message en cours...").catch(noop);
	const files: MessageAttachment[] = [];

	if (attachments) {
		let totalSize = 0;
		for (const attachment of attachments.values()) {
			if (totalSize + attachment.size > MAX_ATTACHMENTS_SIZE) {
				continue;
			}

			files.push(attachment);
			totalSize += attachment.size;
		}
	}

	const botMessage = await message.channel.send({ embed, files }).catch(noop);

	if (waitMessage?.deletable) {
		waitMessage.delete().catch(noop);
	}

	if (!botMessage) {
		return;
	}

	if (message.deletable) {
		await message.delete().catch(noop);
	}

	await botMessage.react("🗑️");

	const collector = await botMessage.awaitReactions(
		(reaction: MessageReaction, user: User) => {
			if (reaction.emoji.name !== "🗑️") {
				return false;
			}
			return user === message.author || message.guild!.member(user)?.permissions.has("MANAGE_MESSAGES") || false;
		},
		{ max: 1, time: 30_000 },
	);

	if (collector.size === 0) {
		botMessage.reactions.removeAll().catch(noop);
		return;
	}

	if (botMessage.deletable) {
		botMessage.delete().catch(noop);
	}

	if (binUrls) {
		for (const binUrl of binUrls) {
			request.delete(binUrl, { headers: { Authorization: ADMIN_TOKEN } }).catch(noop);
		}
	}
}
