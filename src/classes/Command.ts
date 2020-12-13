import { Message, PermissionResolvable } from "discord.js";

import { Client } from "./Client";

type CommandInformations = {
	name: string;
	description?: string;
	category: string;
	usage?: (prefix: string) => string;
	aliases?: string[];
	permission?: PermissionResolvable | "BOT_OWNER";
	path?: string;
};

export abstract class Command {
	public readonly informations: CommandInformations;

	protected readonly client: Client;

	protected constructor(informations: CommandInformations, client: Client) {
		this.informations = informations;
		this.client = client;
	}

	public setCategory(category: string): void {
		this.informations.category = category;
	}

	public setPath(path: string): void {
		this.informations.path = path;
	}

	public abstract run(message: Message, args: string[]): void | Promise<void>;
}
