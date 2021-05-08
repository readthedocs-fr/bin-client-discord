import { Client as DiscordClient, ClientOptions } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";

import { capitalize, formatDate, isCurrentEnvValid } from "../helpers";
import { logError } from "../helpers/logError";
import { Command, Event } from ".";

const noop = (): void => {};
export class Client extends DiscordClient {
	public commands = new Map<string, Command>();

	public aliases = new Map<string, Command>();

	public operational = false;

	public constructor(options?: ClientOptions) {
		super(options);
	}

	public async init(): Promise<void> {
		if (!isCurrentEnvValid()) {
			throw new Error("Current environment is invalid.");
		}

		const commandsPath = join(__dirname, "../commands/");
		const commandsFolders = await readdir(commandsPath).catch(noop);
		if (commandsFolders) {
			for (const folder of commandsFolders) {
				const commandPath = join(commandsPath, folder);
				try {
					await this.loadCommand(commandPath);
				} catch (error) {
					logError(`Could not load command in ${folder}.`, error);
				}
			}
		}

		const eventsPath = join(__dirname, "../events/");
		const eventsFolders = await readdir(eventsPath).catch(noop);
		if (eventsFolders) {
			for (const folder of eventsFolders) {
				const eventPath = join(eventsPath, folder);
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
		const { default: event }: { default: Event } = await import(eventPath);

		this.on(event.name as string, event.listener.bind({ client: this }));

		console.info(`Event ${name} (${event.name}) loaded.`);
	}
}
