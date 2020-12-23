import { createBin } from ".";

const BACK_TICK = "`";
const ESCAPE = "\\";
const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);

const rules: Record<string, { regex: RegExp; matcher: (match: string[], lastIndex: number) => any }> = {
	codeBlock: {
		regex: /^```(?:([\w+\-.]+?)?(?:\s*\n))?([^\n].*?)\n*```/sy,
		matcher([raw, lang, content]: (string | undefined)[], end: number): any {
			if (!content?.trim()) {
				return;
			}

			return {
				raw,
				lang: lang?.trim(),
				content,
				end,
			};
		},
	},
	inlineCode: {
		regex: /^(?:``([^\n].*?)\n*``|`([^`]*?)`)/sy,
		matcher([raw, content1, content2]: (string | undefined)[], end: number): any {
			const content = content1 ?? content2;
			if (!content?.trim()) {
				return;
			}

			return {
				raw,
				content,
				end,
			};
		},
	},
};

function match(source: string): any {
	for (const [name, rule] of Object.entries(rules)) {
		const ruleMatch = source.match(rule.regex);
		if (!ruleMatch) {
			continue;
		}

		const result = rule.matcher(ruleMatch, rule.regex.lastIndex);
		rule.regex.lastIndex = 0;
		if (result) {
			return { name, result };
		}
	}
	return undefined;
}

function replaceAt(source: string, replacement: string, start: number, end: number): string {
	return source.substring(0, start + 1) + replacement + source.substring(end, source.length);
}

export async function processContent(source: string): Promise<string | undefined> {
	if (!source.trim()) {
		return;
	}

	const codes = new Map<string, string>();
	let final = source;

	let escaped = false;
	let changed = false;

	for (let i = 0; i < final.length; i++) {
		const char = final[i];

		if (char === ESCAPE) {
			escaped = !escaped;
			continue;
		}

		if (char === BACK_TICK) {
			const matches = match(`${escaped ? ESCAPE : ""}${final.substring(i)}`);
			if (!matches) {
				continue;
			}

			const { result } = matches;
			const start = i - 1;
			const lines = result.content.split("\n", MAX_LINES).length;

			if (lines < MAX_LINES) {
				continue;
			}

			changed = true;
			let bin = codes.get(result.content.trim());

			if (!bin) {
				bin = await createBin(result.content, result.lang)
					.then((url) => `<${url}>`)
					.catch((e: Error) => e.message);
				codes.set(result.content.trim(), bin);
			}

			final = replaceAt(final, bin, start, i + result.end);
			i += bin.length - 1;

			continue;
		}

		escaped = false;
	}

	return changed ? final : undefined;
}
