interface Code {
	language: string;
	code: string;
}

export function getCode(block: string): Code {
	const language = block.match(/^`{3}([a-zA-Z]+)/)?.[1].trim() || "txt";
	const code = block.match(/`{3}.*\n*((.+\n*)+)`{3}/)?.[1].trim() || "";

	return { language, code };
}
