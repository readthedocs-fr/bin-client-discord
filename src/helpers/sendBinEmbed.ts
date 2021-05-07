import { Collection, Message, MessageAttachment, MessageEmbed, MessageReaction, Snowflake, User } from "discord.js";

const noop = (): undefined => undefined;

const MAX_ATTACHMENTS_SIZE = 8_388_381;

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
			if (totalSize + attachment.size > MAX_ATTACHMENTS_SIZE) {
				continue;
			}

			files.push(attachment);
			totalSize += attachment.size;
		}
	}

	const botMessage = await message.channel.send({ embed, files }).catch(noop);

	if (waitMessage?.deletable) {
		await waitMessage.delete().catch(noop);
	}

	if (!botMessage) {
		return;
	}

	if (message.deletable) {
		await message.delete().catch(noop);
	}

	await botMessage.react("🗑️");

	const collector = await botMessage.awaitReactions(
		({ emoji }: MessageReaction, user: User) => user.id === message.author.id && emoji.name === "🗑️",
		{ max: 1, time: 20_000 },
	);
	if (collector.size === 0) {
		botMessage.reactions.removeAll().catch(noop);
		return;
	}

	if (botMessage.deletable) {
		botMessage.delete().catch(noop);
	}
}
