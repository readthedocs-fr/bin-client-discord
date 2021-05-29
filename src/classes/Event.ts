import { ClientEvents } from "discord.js";

import { Client } from "./Client";

type EventName = keyof ClientEvents | (string & { _: never });

export interface EventContext {
	client: Client;
}

type EventListener<E> = (
	this: EventContext,
	...args: E extends keyof ClientEvents ? ClientEvents[E] : unknown[]
) => Promise<void> | void;

export class Event<E extends EventName = EventName> {
	constructor(public readonly name: E, public readonly listener: EventListener<E>) {}
}
