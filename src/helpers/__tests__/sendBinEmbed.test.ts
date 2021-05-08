import { Collection, Message, MessageAttachment, MessageEmbed, Snowflake } from "discord.js";

import { sendBinEmbed } from "..";

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
		startTyping: asyncFn(),
		stopTyping: jest.fn(() => {}),
	};

	public readonly reactions = {
		removeAll: asyncFn(),
	};

	public readonly awaitReactions = jest.fn(
		async () => new Collection<Snowflake, { message: MockMessage }>([["0", { message: this }]]),
	);

	public readonly deletable = true;

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

		expect(message.channel.startTyping).toBeCalledTimes(1);
		expect(message.channel.stopTyping).not.toBeCalled();
		expect(message.channel.send).toBeCalledTimes(1);
		expect(message.channel.send).toBeCalledWith({
			embed: new MessageEmbed({ description: "hey" })
				.setAuthor(message.member!.displayName, message.author.displayAvatarURL())
				.setTimestamp(message.createdAt)
				.addField("this", "is", true),
			files: attachments.array(),
		});
	});

	it("should start and stop typing correctly", async () => {
		const message = new MockMessage();
		message.channel.send = jest.fn(async () => {
			// eslint-disable-next-line @typescript-eslint/no-throw-literal
			throw "Error";
		});

		await sendBinEmbed((message as unknown) as Message, "hey");

		expect(message.channel.startTyping).toBeCalledTimes(1);
		expect(message.channel.stopTyping).toBeCalledTimes(1);
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

	it("should delete the right messages", async () => {
		const message = new MockMessage();
		await sendBinEmbed((message as unknown) as Message, "hey");

		expect(message.delete).toBeCalledTimes(2);
	});
});
