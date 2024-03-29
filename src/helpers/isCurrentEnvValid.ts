export function isCurrentEnvValid(): boolean {
	return ["DISCORD_TOKEN", "MAX_LINES", "CATEGORIES", "CREATE_BIN_URL", "REQUEST_TIMEOUT"].every(
		(name) => process.env[name],
	);
}
