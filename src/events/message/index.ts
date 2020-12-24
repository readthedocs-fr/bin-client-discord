import { GuildChannel, Message, MessageEmbed } from "discord.js";
import fetch from "node-fetch";
import { extname } from "path";

import { Client, Event } from "../../classes";
import { createBin, errorFormatter, processContent, sendBinEmbed } from "../../helpers";
import { BinError } from "../../misc/BinError";
import { extensions } from "../../misc/extensions";

const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);

export default class MessageEvent extends Event {
	constructor(client: Client) {
		super("message", client);
	}

	async listener(message: Message): Promise<void> {
		const categories = process.env.CATEGORIES!.split(",");

		if (
			!(message.channel instanceof GuildChannel) ||
			message.author.bot ||
			!categories.includes(message.channel.parentID!)
		) {
			return;
		}

		if (message.attachments.size > 0) {
			const file = message.attachments.first(); // only take first attachment as, normally, users cannot send more than one attachment

			if (!file?.name || file?.width) {
				return;
			}

			const fileExtension = extname(file.name).substring(1);
			const language = fileExtension || "txt";

			if (language !== "txt" && !extensions.has(language)) {
				return;
			}

			const code = await fetch(file.url)
				.then((res) => res.text())
				.catch(() => undefined);

			const processed = await processContent(message.content);
			const content = code ? await createBin(code, language).catch((e: Error) => e) : undefined;

			if (!content && !processed) {
				return;
			}

			if (content instanceof Error) {
				const error =
					content instanceof BinError
						? errorFormatter(content)
						: `Une erreur imprévue est survenue : ${content.message}`;

				// eslint-disable-next-line max-len
				const botMessage = `${error}\n\nCependant, bien que votre message n'ait pas été effacé, il a été jugé trop "lourd" pour être lu (code trop long, fichier texte présent). Nous vous conseillons l'usage d'un service de bin pour les gros morceaux de code, tel ${
					process.env.BIN_URL!.split("/new")[0]
				}`;

				await message.channel.send(botMessage);

				return;
			}

			if (processed) {
				await sendBinEmbed(
					message,
					processed.processedString,
					processed.errors,
					content ? (embed): MessageEmbed => embed.addField("📁 Pièce jointe", content) : undefined,
				);
			} else if (content) {
				await sendBinEmbed(message, content);
			}

			return;
		}

		const lines = message.content.split("\n", MAX_LINES).length;

		if (lines < MAX_LINES) {
			return;
		}

		const processed = await processContent(message.content);

		if (processed) {
			await sendBinEmbed(message, processed.processedString, processed.errors);
		}
	}
}
