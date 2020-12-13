export function capitalize(baseString: string): string {
	const firstLetter = baseString[0].toUpperCase();
	const base = baseString.slice(1).toLowerCase().replaceAll("_", " ");

	return firstLetter + base;
}
