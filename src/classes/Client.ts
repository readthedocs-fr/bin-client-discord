import { Client as DiscordClient, ClientOptions } from "discord.js";
import { promises as fs } from "fs";
import * as path from "path";

import { capitalize } from "../functions/capitalize";
import { formatDate } from "../functions/formatDate";
import { Command } from "./Command";
import { Event } from "./Event";

class Client extends DiscordClient {
	commands: Map<string, Command>;

	aliases: Map<string, Command>;

	operational: boolean;

	constructor(options?: ClientOptions) {
		super(options);

		this.commands = new Map();
		this.aliases = new Map();

		this.operational = false;
	}

	async init(): Promise<void> {
		const commandsPath = path.join(__dirname, "../commands/");
		const commandsFolders = await fs.readdir(commandsPath).catch(() => null);
		if (commandsFolders) {
			for (const folder of commandsFolders) {
				const commandPath = path.join(commandsPath, folder);
				try {
					await this.loadCommand(commandPath);
				} catch (error) {
					console.error(`Could not load command in ${folder};\n${error.stackTrace}`);
				}
			}
		}

		const eventsPath = path.join(__dirname, "../events/");
		const eventsFolders = await fs.readdir(eventsPath).catch(() => null);
		if (eventsFolders) {
			for (const folder of eventsFolders) {
				const eventPath = path.join(eventsPath, folder);
				try {
					await this.loadEvent(eventPath, folder);
				} catch (error) {
					console.error(`Could not load event in ${folder};\n${error.stackTrace}`);
				}
			}
		}

		await this.login(process.env.TOKEN);
		await this.user?.setPresence({
			activity: {
				name: "code snippets",
				type: "LISTENING",
			},
			status: "online",
		});

		console.log(`ReadTheBin started at ${formatDate()}.`);
	}

	private async loadCommand(filePath: string): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { default: CommandClass } = await import(filePath);
		const command: Command = new CommandClass(this);

		if (!command.informations.name) {
			return console.info(`Command in '${filePath}' does not have any name. Skipping...`);
		}

		if (this.commands.has(command.informations.name)) {
			return console.info(`Command ${command.informations.name} in '${filePath}' already exists. Skipping...`);
		}

		this.commands.set(command.informations.name, command);

		const category = capitalize(command.informations.category || "Misc");
		command.setCategory(category);
		command.setPath(filePath);

		console.info(`Command ${command.informations.name} loaded.`);

		if (!command.informations.aliases) {
			return;
		}

		for (const alias of command.informations.aliases) {
			const double = this.aliases.get(alias) || this.commands.get(alias);
			if (double) {
				console.warn(`Alias ${alias} already exist for command ${double.informations.name}.`);
				continue;
			}
			this.aliases.set(alias, command);
		}
	}

	private async loadEvent(eventPath: string, name: string): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { default: EventClass } = await import(eventPath);
		const event: Event = new EventClass(this);

		this.on(event.event, event.listener.bind(event));

		console.info(`Event ${name} (${event.event}) loaded.`);
	}
}

export { Client };
