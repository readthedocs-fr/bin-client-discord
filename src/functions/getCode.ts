interface Code {
	language: string | null;
	code: string | null;
}

export function getCode(block: string): Code {
	const language = block.match(/^`{3}([a-zA-Z]+)/)?.[1].trim() || null;
	const code = block.match(/`{3}.*\n*((.+\n*)+)`{3}/)?.[1].trim() || null;

	return { language, code };
}
