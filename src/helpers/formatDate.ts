export function formatDate(dateToFormat?: Date | number): string {
	const date = dateToFormat ? new Date(dateToFormat) : new Date();

	return date.toLocaleDateString(undefined, {
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
	});
}
