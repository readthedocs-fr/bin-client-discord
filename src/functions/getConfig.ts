import { Snowflake } from "discord.js";
import { promises as fs } from "fs";
import * as path from "path";

interface Config {
	maxNumberOfLines: number;
	categoryIds: Snowflake[];
	bin: {
		url: string;
		longevityInMinutes: number;
	};
}

export async function getConfig(): Promise<Config> {
	const file = path.join(__dirname, "../config.json");

	return JSON.parse(await fs.readFile(file, "utf-8"));
}
