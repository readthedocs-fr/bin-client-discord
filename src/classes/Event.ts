import { ClientEvents } from "discord.js";

import { Client } from "./Client";

type EventName = keyof ClientEvents | string;

export abstract class Event {
	public readonly event: EventName;

	protected readonly client: Client;

	protected constructor(event: EventName, client: Client) {
		this.event = event;
		this.client = client;
	}

	public abstract listener(...args: unknown[]): Promise<void> | void;
}
