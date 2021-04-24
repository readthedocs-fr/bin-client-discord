export function isCurrentEnvValid(): boolean {
	return ["DISCORD_TOKEN", "MAX_LINES", "CATEGORIES", "BIN_URL", "MAX_TIMEOUT_MS"].every((name) => process.env[name]);
}
