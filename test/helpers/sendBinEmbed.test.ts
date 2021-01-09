import { Collection, Message, MessageAttachment, MessageEmbed, Snowflake } from "discord.js";

import { sendBinEmbed } from "../../src/helpers";

const cdnLink = "https://cdn.discordapp.com/attachments/0/0/";

const asyncFn = (): jest.Mock<Promise<void>> => jest.fn(async () => {});
class MockMessage {
	public readonly createdAt = Date.now();

	public readonly author = {
		displayAvatarURL: (): string => cdnLink,
	};

	public readonly member = {
		displayName: "Mysterious",
	};

	public readonly channel = {
		send: jest.fn(async () => this),
	};

	public readonly reactions = {
		removeAll: asyncFn(),
	};

	public readonly awaitReactions = jest.fn(
		async () => new Collection<Snowflake, { message: MockMessage }>([["0", { message: this }]]),
	);

	public readonly delete = asyncFn();

	public readonly react = asyncFn();
}

describe(sendBinEmbed, () => {
	it("should send the rights messages", async () => {
		const message = new MockMessage();
		const attachments = new Collection<Snowflake, MessageAttachment>(
			Array.from({ length: 3 }, (_, i) => [
				i.toString(),
				new MessageAttachment(`${cdnLink}${i}.jpg`, `${i}.jpg`, { size: 279e4 }),
			]),
		);
		await sendBinEmbed(
			(message as unknown) as Message,
			"hey",
			(embed) => embed.addField("this", "is", true),
			attachments.clone().set("3", new MessageAttachment(`${cdnLink}4.jpg`, "4.jpg", { size: 1e6 })),
		);
		expect(message.channel.send).toBeCalledTimes(2);
		expect(message.channel.send).toBeCalledWith("Transformation du message en cours...");
		expect(message.channel.send).toHaveBeenLastCalledWith({
			embed: new MessageEmbed({ description: "hey" })
				.setAuthor(message.member!.displayName, message.author.displayAvatarURL())
				.setTimestamp(message.createdAt)
				.addField("this", "is", true),
			files: attachments.array(),
		});
	});

	it("should react with 🗑️", async () => {
		const message = new MockMessage();
		await sendBinEmbed((message as unknown) as Message, "hey");
		expect(message.react).toBeCalledTimes(1);
		expect(message.react).toBeCalledWith("🗑️");
	});

	it("should correctly handle reactions", async () => {
		const message = new MockMessage();
		await sendBinEmbed((message as unknown) as Message, "hey");
		expect(message.awaitReactions).toBeCalledTimes(1);
		expect(message.reactions.removeAll).not.toBeCalled();
	});

	it("should delete the right number of messages", async () => {
		const message = new MockMessage();
		await sendBinEmbed((message as unknown) as Message, "hey");
		expect(message.delete).toBeCalledTimes(3);
	});
});
