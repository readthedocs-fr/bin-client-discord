import { Message, MessageAttachment, MessageEmbed, MessageReaction, User } from "discord.js";

const noop = (): undefined => undefined;

const MAX_FILE_SIZE = 8e6;

export async function sendBinEmbed(
	message: Message,
	description: string,
	extender?: (embed: MessageEmbed) => MessageEmbed,
	attachment?: MessageAttachment,
): Promise<void> {
	const embed = new MessageEmbed({ description })
		.setAuthor(message.member!.displayName, message.author.displayAvatarURL({ dynamic: true }))
		.setTimestamp(message.createdAt);

	if (extender) {
		extender(embed);
	}

	const waitMessage = await message.channel.send("Transformation du message en cours...").catch(noop);
	const files = attachment && attachment.size <= MAX_FILE_SIZE ? [attachment.attachment] : [];
	const botMessage = await message.channel.send({ embed, files }).catch(noop);

	await waitMessage?.delete().catch(noop);

	if (!botMessage) {
		return;
	}

	await message.delete().catch(noop);

	await botMessage.react("🗑️");

	const filter = (reaction: MessageReaction, user: User): boolean =>
		user.id === message.author.id && reaction.emoji.name === "🗑️";
	const collector = await botMessage.awaitReactions(filter, { max: 1, time: 20 * 1000 });
	const reaction = collector.first();

	if (!reaction) {
		await botMessage.reactions.removeAll().catch(noop);
		return;
	}
	if (reaction.partial) {
		await reaction.fetch();
	}
	if (reaction.message.partial) {
		await reaction.message.fetch();
	}

	await botMessage.delete().catch(noop);
}
