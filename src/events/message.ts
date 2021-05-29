import { GuildChannel, MessageEmbed } from "discord.js";
import { URL } from "url";

import { Event } from "../classes";
import { request } from "../helpers";
import { handleMessage } from "../helpers/handleMessage";

const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);
const ORIGIN_URL = new URL(process.env.BIN_URL!).origin;
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT!, 10) || 5000;

const noop = (): undefined => undefined;

export default new Event("message", async function (message) {
	const categories = process.env.CATEGORIES!.split(",");

	if (!(message.channel instanceof GuildChannel) || message.author.bot) {
		return;
	}

	if (
		[`<@!${this.client.user!.id}> ping`, `<@${this.client.user!.id}> ping`].includes(message.content.toLowerCase())
	) {
		const pingMessage = await message.channel
			.send(`Ping ? *Cela peut durer jusqu'à ${REQUEST_TIMEOUT / 1000} secondes.*`)
			.catch(noop);

		if (!pingMessage) {
			return;
		}

		const binHealth = await request.head(`${ORIGIN_URL}/health`).catch(noop);

		const embed = new MessageEmbed()
			.setColor(binHealth ? 0x2ab533 : 0xf33030)
			.addField("État du bin", binHealth ? "En ligne" : "Hors ligne", true)
			.addField("Latence du bot", `${pingMessage.createdTimestamp - message.createdTimestamp}ms`, true)
			.addField("Latence du WebSocket", `${Math.round(this.client.ws.ping)}ms`, true);

		pingMessage.edit("", embed).catch(noop);

		return;
	}

	if (categories.includes(message.channel.parentID!)) {
		handleMessage(message, MAX_LINES);
	}
});
