import { GuildChannel, Message, MessageEmbed } from "discord.js";
import { extname } from "path";
import { URL } from "url";

import { Client, Event } from "../../classes/index.js";
import { createBin, logError, processContent, request, sendBinEmbed } from "../../helpers/index.js";
import { extensions } from "../../misc/index.js";

const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);
const ORIGIN_URL = new URL(process.env.CREATE_BIN_URL!).origin;
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT!, 10) || 5000;

const noop = (): undefined => undefined;

export default class MessageEvent extends Event {
	public constructor(client: Client) {
		super("messageCreate", client);
	}

	public async listener(message: Message): Promise<void> {
		const categories = process.env.CATEGORIES!.split(",");

		if (!(message.channel instanceof GuildChannel) || message.author.bot) {
			return;
		}

		if (
			[`<@!${this.client.user!.id}> ping`, `<@${this.client.user!.id}> ping`].includes(
				message.content.toLowerCase(),
			)
		) {
			const pingMessage = await message.channel
				.send({ content: `Ping ? *Cela peut durer jusqu'à ${REQUEST_TIMEOUT / 1000} secondes.*` })
				.catch(noop);

			if (!pingMessage) {
				return;
			}

			const binHealth = await request(`${ORIGIN_URL}/health`).text().catch(noop);

			const embed = new MessageEmbed()
				.setColor(binHealth ? 0x2ab533 : 0xf33030)
				.addField("État du bin", binHealth ? "En ligne" : "Hors ligne", true)
				.addField("Latence du bot", `${pingMessage.createdTimestamp - message.createdTimestamp}ms`, true)
				.addField("Latence du WebSocket", `${Math.round(this.client.ws.ping)}ms`, true);

			pingMessage.edit({ content: null, embeds: [embed] }).catch(noop);

			return;
		}

		if (!categories.includes(message.channel.parentId!)) {
			return;
		}

		const files = message.attachments.filter((attachment) => {
			if (!attachment.name || attachment.width || attachment.size === 0) {
				return false;
			}

			const fileExtension = extname(attachment.name).slice(1).toLowerCase();

			return ["txt", ""].includes(fileExtension) || extensions.has(fileExtension);
		});

		if (files.size) {
			const processed =
				message.content.split("\n").length > MAX_LINES
					? await processContent(message.content, MAX_LINES)
					: undefined;

			const bins: [string, string][] = [];
			const errors: [string, string][] = [];

			for (const [, file] of files) {
				const fileToBin = await createBin({
					code: await request(file.url).text(),
					filename: file.name!,
				}).catch((error) => void errors.push([file.name!, error.toString()]));

				if (!fileToBin) {
					continue;
				}

				message.attachments.delete(file.id);
				bins.push([file.name!, fileToBin]);
			}

			if (bins.length === 0) {
				const errorEmbed = new MessageEmbed({
					color: 0xf33030,
					title: "Vos fichiers entraînent des erreurs",
					// eslint-disable-next-line max-len
					description: `Cependant, bien que votre message n'ait pas été effacé, il a été jugé trop "lourd" pour être lu (code trop long, fichier texte présent).\n\nNous vous conseillons l'usage d'un service de bin pour les gros morceaux de code, tel ${ORIGIN_URL} (s'il est hors-ligne, utilisez d'autres alternatives comme https://paste.artemix.org/).`,
				});

				for (const [fileName, error] of errors) {
					errorEmbed.addField(fileName, error);
				}

				message.channel.send({ embeds: [errorEmbed] }).catch(noop);
				return;
			}

			const fieldName = bins.length > 1 ? "📁 Pièces jointes" : "📁 Pièce jointe";
			sendBinEmbed(
				message,
				processed || message.content,
				bins.length
					? (embed): MessageEmbed =>
						embed.addField( // eslint-disable-line prettier/prettier
							fieldName, // eslint-disable-line prettier/prettier
							bins.map(([name, link]) => `**${name}**: ${link}`).join("\n"), // eslint-disable-line prettier/prettier
						) // eslint-disable-line prettier/prettier
					: undefined,
				message.attachments.size > 0 ? message.attachments : undefined,
			).catch(logError);

			return;
		}

		const lines = message.content.split("\n").length;

		if (lines < MAX_LINES) {
			return;
		}

		const processed = await processContent(message.content, MAX_LINES);

		if (processed) {
			sendBinEmbed(
				message,
				processed,
				undefined,
				message.attachments.size > 0 ? message.attachments : undefined,
			).catch(noop);
		}
	}
}
