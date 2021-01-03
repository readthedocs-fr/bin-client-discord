import { Collection, Message, MessageAttachment, MessageEmbed, MessageReaction, Snowflake, User } from "discord.js";

const noop = (): undefined => undefined;

const MAX_FILE_SIZE = 8_388_119; // https://www.reddit.com/r/discordapp/comments/aflp3p/the_truth_about_discord_file_upload_limits/

export async function sendBinEmbed(
	message: Message,
	description: string,
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
			if (totalSize + attachment.size > MAX_FILE_SIZE) {
				continue;
			}

			files.push(attachment);
			totalSize += attachment.size;
		}
	}

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
