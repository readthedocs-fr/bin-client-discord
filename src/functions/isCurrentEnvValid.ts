export function isCurrentEnvValid(): boolean {
	return (
		Boolean(process.env.TOKEN) &&
		Boolean(process.env.MAX_LINES) &&
		Boolean(process.env.CATEGORIES) &&
		Boolean(process.env.BIN_URL)
	);
}
