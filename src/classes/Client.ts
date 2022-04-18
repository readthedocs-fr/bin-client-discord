import { Client as DiscordClient, ClientOptions } from "discord.js";
import { readdir } from "fs/promises";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

import { formatDate, isCurrentEnvValid, logError } from "../helpers/index.js";
import { Event } from "./index.js";

// eslint-disable-next-line @typescript-eslint/naming-convention,no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));
const noop = (): void => {};

export class Client extends DiscordClient {
	public constructor(options: ClientOptions) {
		super(options);
	}

	public async init(): Promise<void> {
		if (!isCurrentEnvValid()) {
			throw new Error("Current environment is invalid.");
		}

		const eventsPath = join(__dirname, "../events/");
		const eventsFolders = await readdir(eventsPath).catch(noop);
		if (eventsFolders) {
			for (const folder of eventsFolders) {
				const eventPath = relative(__dirname, join(eventsPath, folder, "index.js"));
				try {
					await this.loadEvent(eventPath, folder);
				} catch (error) {
					logError(`Could not load event in ${folder}.`, error);
				}
			}
		}

		await this.login(process.env.DISCORD_TOKEN);
		await this.user?.setActivity({
			name: "code snippets",
			type: "LISTENING",
		});

		console.log(`ReadTheBin started at ${formatDate()}.`);
	}

	private async loadEvent(eventPath: string, name: string): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { default: EventClass } = await import(eventPath);
		const event: Event = new EventClass(this);

		this.on(event.event, event.listener.bind(event));

		console.info(`Event ${name} (${event.event}) loaded.`);
	}
}
