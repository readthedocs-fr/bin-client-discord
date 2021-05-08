export function isCurrentEnvValid(): boolean {
	return ["DISCORD_TOKEN", "MAX_LINES", "CATEGORIES", "BIN_URL", "REQUEST_TIMEOUT", "TRANSFORM_MIN_REACTIONS"].every(
		(name) => process.env[name],
	);
}
