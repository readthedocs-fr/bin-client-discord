import { ClientEvents } from "discord.js";

import { Client } from "./Client";

export abstract class Event {
	readonly event: keyof ClientEvents | string;

	protected readonly client: Client;

	protected constructor(event: keyof ClientEvents | string, client: Client) {
		this.event = event;
		this.client = client;
	}

	abstract listener(...args: unknown[]): void | Promise<void>;
}
