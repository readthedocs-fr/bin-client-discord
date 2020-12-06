import { createBin } from "./createBin";
import { getCode } from "./getCode";
import { getConfig } from "./getConfig";

export async function blockMatcher(content: string): Promise<Map<string, { language: string; code: string }>> {
	const matches = content.match(/`{3}.*\n*(.+\n*)*?`{3}/g);
	const blocks = new Map<string, { language: string; code: string }>();

	if (!matches) {
		return blocks;
	}

	const MAX_LINES_ALLOWED = (await getConfig()).maxNumberOfLines;

	for (const block of matches) {
		const { language, code } = getCode(block);

		if (code && code.split("\n").length >= MAX_LINES_ALLOWED && !blocks.has(block)) {
			blocks.set(block, { language, code });
		}
	}

	return blocks;
}

export async function blocksToBins(
	content: string,
	blocks: Map<string, { language: string; code: string }>,
): Promise<string> {
	let result = content;

	for (const block of blocks.entries()) {
		const [blockString, binInfos] = block;
		const bin = await createBin(binInfos.code, binInfos.language);

		// TODO: awaiting TypeScript for String#replaceAll implementation
		result = result.split(blockString).join(bin instanceof Error ? bin.message : bin);
	}

	return result;
}
