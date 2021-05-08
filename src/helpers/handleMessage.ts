import { Message, MessageEmbed } from "discord.js";
import { extname } from "path";

import { extensions } from "../misc";
import { createBin, processContent, request, sendBinEmbed } from ".";

const noop = (): undefined => undefined;

export async function handleMessage(message: Message, maxLines = 0): Promise<void> {
	const file = message.attachments.find((attachment) => {
		if (!attachment.name || attachment.width || attachment.size === 0) {
			return false;
		}
		const fileExtension = extname(attachment.name).slice(1).toLowerCase();
		return ["txt", ""].includes(fileExtension) || extensions.has(fileExtension);
	});

	const processed =
		maxLines <= 0 || message.content.split("\n").length > maxLines
			? await processContent(message.content, maxLines)
			: undefined;

	let content: string | undefined;

	if (file) {
		message.attachments.delete(file.id);

		try {
			content = await createBin({
				code: await request(file.url).text(),
				filename: file.name!,
				// TODO: use MessageAttachment#contentType when next discord.shit.js's version is release
			});
		} catch (error) {
			const embed = {
				title: error.toString(),
				// eslint-disable-next-line max-len
				description: `Cependant, bien que votre message n'ait pas été effacé, il a été jugé trop "lourd" pour être lu (code trop long, fichier texte présent).\n\nNous vous conseillons l'usage d'un service de bin pour les gros morceaux de code, tel ${process.env.BIN_URL} (s'il est hors-ligne, utilisez d'autres alternatives comme https://paste.artemix.org/).`,
			};
			message.channel.send({ embed }).catch(noop);
			return;
		}
	}

	if (!processed && !content) {
		return;
	}

	if (maxLines > 0 && !content) {
		const lines = message.content.split("\n").length;
		if (lines < maxLines) {
			return;
		}
	}

	sendBinEmbed(
		message,
		processed || message.content,
		content ? (embed): MessageEmbed => embed.addField("📁 Pièce jointe", content) : undefined,
		message.attachments.size > 0 ? message.attachments : undefined,
	);
}
