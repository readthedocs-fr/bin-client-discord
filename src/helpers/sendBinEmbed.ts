import { Message, MessageEmbed, MessageReaction, User } from "discord.js";

const noop = (): void => {};

export async function sendBinEmbed(
	message: Message,
	description: string,
	extender?: (embed: MessageEmbed) => MessageEmbed,
): Promise<void> {
	const embed = new MessageEmbed({ description })
		.setAuthor(message.member!.displayName, message.author.displayAvatarURL({ dynamic: true }))
		.setTimestamp(message.createdAt);
	if (extender) {
		extender(embed);
	}

	const botMessage = await message.channel.send(embed).catch(noop);
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

	await botMessage.delete();
}
