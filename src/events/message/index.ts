import { GuildChannel, Message, MessageEmbed } from "discord.js";
import got from "got";
import { extname } from "path";
import { URL } from "url";

import { Client, Event } from "../../classes";
import { createBin, processContent, sendBinEmbed } from "../../helpers";
import { extensions } from "../../misc/extensions";

const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);
const ORIGIN_URL = new URL(process.env.BIN_URL!).origin;

const noop = (): undefined => undefined;

export default class MessageEvent extends Event {
	public constructor(client: Client) {
		super("message", client);
	}

	public async listener(message: Message): Promise<void> {
		const categories = process.env.CATEGORIES!.split(",");

		if (!(message.channel instanceof GuildChannel) || message.author.bot) {
			return;
		}

		if (
			message.content.trim().toLowerCase() === `<@!${this.client.user!.id}> ping` ||
			message.content.trim().toLowerCase() === `<@${this.client.user!.id}> ping`
		) {
			const pingMessage = await message.channel.send("Ping ?").catch(noop);

			if (!pingMessage) {
				return;
			}

			const binHealth = await got(`${ORIGIN_URL}/health`).text().catch(noop);

			const embed = new MessageEmbed()
				.setAuthor(this.client.user!.username, this.client.user!.displayAvatarURL({ dynamic: true }))
				.setColor(binHealth === "alive" ? 0xb5e655 : 0xa61111)
				.setTitle("Pong !")
				.addField("État du bin", binHealth === "alive" ? "En ligne" : "Hors ligne", true)
				.addField("Latence du bot", `${pingMessage.createdTimestamp - message.createdTimestamp}ms`, true)
				.addField("Latence du WebSocket", `${Math.round(this.client.ws.ping)}ms`, true);

			pingMessage.edit("", embed).catch(noop);

			return;
		}

		if (!categories.includes(message.channel.parentID!)) {
			return;
		}

		const file = message.attachments.find((attachment) => {
			if (!attachment.name || attachment.width) {
				return false;
			}

			const fileExtension = extname(attachment.name).slice(1);
			const language = fileExtension || "txt";

			return language === "txt" || extensions.has(language);
		});

		if (file) {
			const code = await got(file.url, { http2: true }).text().catch(noop);

			const processed =
				message.content.split("\n", MAX_LINES).length === MAX_LINES
					? await processContent(message.content, MAX_LINES)
					: undefined;

			const language = extname(file.name!).slice(1);
			const content = code?.trim() ? await createBin({ code, language }).catch((e: Error) => e) : undefined;

			if (!content && !processed) {
				return;
			}

			if (content instanceof Error) {
				const errorEmbed = new MessageEmbed({ title: content.toString() }).setDescription(
					// eslint-disable-next-line max-len
					`Cependant, bien que votre message n'ait pas été effacé, il a été jugé trop "lourd" pour être lu (code trop long, fichier texte présent).\n\nNous vous conseillons l'usage d'un service de bin pour les gros morceaux de code, tel ${ORIGIN_URL} (s'il est hors-ligne, utilisez d'autres alternatives comme https://paste.artemix.org/).`,
				);

				await message.channel.send(errorEmbed).catch(noop);

				return;
			}

			const otherAttachments = message.attachments.filter((attachment) => attachment.id !== file.id);

			await sendBinEmbed(
				message,
				processed || message.content.trim(),
				content ? (embed): MessageEmbed => embed.addField("📁 Pièce jointe", content) : undefined,
				otherAttachments.size > 0 ? otherAttachments : undefined,
			);

			return;
		}

		const lines = message.content.split("\n", MAX_LINES).length;

		if (lines < MAX_LINES) {
			return;
		}

		const processed = await processContent(message.content, MAX_LINES).catch(noop);

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
