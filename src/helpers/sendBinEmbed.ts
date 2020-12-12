import { Message, MessageEmbed, MessageReaction, User } from "discord.js";

export async function sendBinEmbed(message: Message, content: string): Promise<void> {
	const embed = new MessageEmbed()
		.setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
		.setDescription(content)
		.setTimestamp(message.createdAt);

	const botMessage = await message.channel.send(embed).catch(() => {});
	if (!botMessage) {
		return;
	}

	await message.delete().catch(() => {});

	await botMessage.react("🗑️");

	const filter = (reaction: MessageReaction, user: User): boolean =>
		reaction.message.id === botMessage.id && user.id === message.author.id && reaction.emoji.name === "🗑️";
	const collector = await botMessage.awaitReactions(filter, { max: 1, time: 20000 });
	const reaction = collector.first();

	if (!reaction) {
		await botMessage.reactions.removeAll().catch(() => {});
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
