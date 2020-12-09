import { lexer as markdown } from "marked";

import { createBin } from "./createBin";

export async function blockMatcher(content: string): Promise<Map<string, { language?: string; code: string }>> {
	const matches = markdown(content);
	const blocks = new Map<string, { language?: string; code: string }>();

	if (!matches) {
		return blocks;
	}

	const MAX_LINES_ALLOWED = Number(process.env.MAX_LINES);

	for (const block of matches) {
		if (!("lang" in block)) {
			continue;
		}

		const { lang: language, text: code } = block;

		if (code && code.split("\n").length >= MAX_LINES_ALLOWED && !blocks.has(block.raw)) {
			blocks.set(block.raw, { language, code });
		}
	}

	return blocks;
}

export async function blocksToBins(
	content: string,
	blocks: Map<string, { language?: string; code: string }>,
): Promise<string> {
	let result = content;

	for (const block of blocks.entries()) {
		const [blockString, binInfos] = block;
		const bin = await createBin(binInfos.code, binInfos.language);

		// TODO: awaiting TypeScript for String#replaceAll implementation
		result = result.split(blockString).join(`${bin instanceof Error ? bin.message : bin} `);
	}

	return result;
}
