export function isCurrentEnvValid(): boolean {
	return ["DISCORD_TOKEN", "MAX_LINES", "CATEGORIES", "BIN_URL"].every((name) => process.env[name]);
}
