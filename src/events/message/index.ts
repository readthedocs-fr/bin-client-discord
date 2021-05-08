import { GuildChannel, Message, MessageEmbed } from "discord.js";
import { extname } from "path";
import { URL } from "url";

import { Client, Event } from "../../classes";
import { createBin, processContent, request, sendBinEmbed } from "../../helpers";
import { extensions } from "../../misc";

const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);
const HEALTH_URL = new URL("/health", process.env.BIN_URL);
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT!, 10) || 5000;
const CATEGORIES = process.env.CATEGORIES!.split(",");

const noop = (): undefined => undefined;

export default class MessageEvent extends Event {
	public constructor(client: Client) {
		super("message", client);
	}

	public async listener(message: Message): Promise<void> {
		if (!(message.channel instanceof GuildChannel) || message.author.bot) {
			return;
		}

		if (
			[`<@!${this.client.user!.id}> ping`, `<@${this.client.user!.id}> ping`].includes(
				message.content.toLowerCase(),
			)
		) {
			const pingMessage = await message.channel
				.send(`Ping ? *Cela peut durer jusqu'à ${REQUEST_TIMEOUT / 1000} secondes.*`)
				.catch(noop);

			if (!pingMessage) {
				return;
			}

			const binHealth = await request.head(HEALTH_URL).catch(noop);

			const embed = new MessageEmbed()
				.setColor(binHealth ? 0x2ab533 : 0xf33030)
				.addField("État du bin", binHealth ? "En ligne" : "Hors ligne", true)
				.addField("Latence du bot", `${pingMessage.createdTimestamp - message.createdTimestamp}ms`, true)
				.addField("Latence du WebSocket", `${Math.round(this.client.ws.ping)}ms`, true);

			pingMessage.edit("", embed).catch(noop);

			return;
		}

		if (!CATEGORIES.includes(message.channel.parentID!)) {
			return;
		}

		const file = message.attachments.find((attachment) => {
			if (!attachment.name || attachment.width || attachment.size === 0) {
				return false;
			}

			const fileExtension = extname(attachment.name).slice(1).toLowerCase();

			return ["txt", ""].includes(fileExtension) || extensions.has(fileExtension);
		});

		if (file) {
			message.attachments.delete(file.id);

			const processed =
				message.content.split("\n").length > MAX_LINES
					? await processContent(message.content, MAX_LINES)
					: undefined;

			try {
				const content = await createBin({
					code: await request(file.url).text(),
					filename: file.name!,
				});

				sendBinEmbed(
					message,
					processed?.[0] ?? message.content,
					processed?.[1],
					content ? (embed): MessageEmbed => embed.addField("📁 Pièce jointe", content) : undefined,
					message.attachments.size > 0 ? message.attachments : undefined,
				);
			} catch (error) {
				const errorEmbed = new MessageEmbed({ title: error.toString() });
				errorEmbed.setDescription(
					// eslint-disable-next-line max-len
					`Cependant, bien que votre message n'ait pas été effacé, il a été jugé trop "lourd" pour être lu (code trop long, fichier texte présent).\n\nNous vous conseillons l'usage d'un service de bin pour les gros morceaux de code, tel ${HEALTH_URL.origin} (s'il est hors-ligne, utilisez d'autres alternatives comme https://paste.artemix.org/).`,
				);
				message.channel.send(errorEmbed).catch(noop);
			}

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
				processed[0],
				processed[1],
				undefined,
				message.attachments.size > 0 ? message.attachments : undefined,
			).catch(noop);
		}
	}
}
