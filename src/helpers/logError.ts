export function logError(...args: unknown[]): void {
	console.error(`[${new Date().toLocaleString()}]`, ...args);
}
