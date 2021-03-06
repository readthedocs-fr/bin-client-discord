export function formatDate(dateToFormat?: Date | number): string {
	const date = dateToFormat ? new Date(dateToFormat) : new Date();
	const dateOptions = {
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
	} as const;

	return date.toLocaleDateString(undefined, dateOptions);
}
