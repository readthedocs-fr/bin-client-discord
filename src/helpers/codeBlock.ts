import { lexer as markdown } from "marked";

import { createBin } from "./createBin";

export async function blockMatcher(content: string): Promise<Map<string, { language?: string; code: string }>> {
	const matches = markdown(content);
	const blocks = new Map<string, { language?: string; code: string }>();

	if (!matches) {
		return blocks;
	}

	const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);

	for (const block of matches) {
		if (!("lang" in block)) {
			continue;
		}

		const { lang: language, text: code } = block;

		if (code.split("\n", MAX_LINES).length === MAX_LINES && !blocks.has(block.raw)) {
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

	for (const [blockString, binInfos] of blocks.entries()) {
		const bin = await createBin(binInfos.code, binInfos.language);
		result = result.replace(blockString, `${bin instanceof Error ? bin.message : bin} `);
	}

	return result.trimEnd();
}
