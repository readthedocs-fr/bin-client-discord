interface Code {
	language: string | undefined;
	code: string | undefined;
}

export function getCode(block: string): Code {
	const language = block.match(/^`{3}([a-zA-Z]+)/)?.[1].trim() || undefined;
	const code = block.match(/`{3}.*\n*((.+\n*)+)`{3}/)?.[1].trim() || undefined;

	return { language, code };
}
