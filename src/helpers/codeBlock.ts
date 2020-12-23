import { createBin } from ".";

function parser(message: string): { raw: string; lang: string; code: string }[] {
	const blocks: { raw: string; lang: string; code: string }[] = [];
	let state = false; // false -> normal text, true -> code block
	let backtickNumber = 0; // 0 -> `, 1 -> ``, 2 -> ```
	let content = "";

	for (let i = 0; i < message.length; i++) {
		const index = i;
		const char = message[index];

		if (char !== "`") {
			if (state) {
				content += char;
			}

			continue;
		}

		// opening backticks
		if (!state) {
			if (message[index - 1] === "\\") {
				let pass = 0;

				if (message[index + 1] === "`") {
					pass++;
					if (message[index + 2] === "`") {
						pass++;
					}
				}

				i += pass;
				continue;
			}

			if (message[index + 1] === "`") {
				backtickNumber += 1;
				i++;
				if (message[index + 2] === "`") {
					backtickNumber += 1;
					i++;
				}
			}
			state = !state;

			continue;
		}

		// closing backticks
		if (state) {
			if (
				backtickNumber === 0 ||
				(backtickNumber === 1 && message[index + 1] === "`") ||
				(backtickNumber === 2 && message.slice(index + 1, index + 3) === "``")
			) {
				const text = content.split("\n");

				const lang =
					text[1] && backtickNumber === 2 && text[0].trim().split(" ").length === 1 ? text[0].trim() : "";
				const code = lang ? text.slice(1).join("\n") : text.join("\n");

				const backticks = "`".repeat(backtickNumber + 1);

				blocks.push({ raw: `${backticks}${content}${backticks}`, lang, code });

				state = !state;
				content = "";
				i += backtickNumber;
				backtickNumber = 0;

				continue;
			}
		}

		// textual backticks (inside code blocks)
		if (state) {
			content += char;
		}
	}

	return blocks;
}

export async function blockMatcher(content: string): Promise<Map<string, { lang: string; code: string }>> {
	const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);

	const matches = parser(content);
	const blocks = new Map<string, { lang: string; code: string }>();

	if (matches.length === 0) {
		return blocks;
	}

	for (const block of matches) {
		const { lang, code } = block;
		const raw = block.raw.trim();

		if (code.split("\n", MAX_LINES).length === MAX_LINES && !blocks.has(raw)) {
			blocks.set(raw, { lang, code });
		}
	}

	return blocks;
}

export async function blocksToBins(
	content: string,
	blocks: Map<string, { lang: string; code: string }>,
): Promise<string> {
	let result = content;

	for (const [blockString, binInfos] of blocks.entries()) {
		const bin = await createBin(binInfos.code, binInfos.lang);
		result = result.replaceAll(blockString, bin instanceof Error ? bin.message : bin);
	}

	return result;
}
