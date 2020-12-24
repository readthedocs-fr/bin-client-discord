import { createBin, errorFormatter } from ".";
import { BinError } from "../misc/BinError";

const BACK_TICK = "`";
const ESCAPE = "\\";
const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);

interface CodeToken {
	raw: string;
	content: string;
	end: number;
	lang?: string;
}

interface Rule {
	regex: RegExp;
	matcher(match: (string | undefined)[], lastIndex: number): CodeToken | undefined;
}

const rules: Record<string, Rule> = {
	codeBlock: {
		regex: /^```(?:([\w+\-.]+?)?(?:\s*\n))?([^\n].*?)\n*```/sy,
		matcher([raw, lang, content]: string[], end: number): CodeToken | undefined {
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
		matcher([raw, content1, content2]: string[], end: number): CodeToken | undefined {
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

function match(source: string): { name: string; result: CodeToken } | undefined {
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
}

function replaceAt(source: string, replacement: string, start: number, end: number): string {
	return source.substring(0, start + 1) + replacement + source.substring(end, source.length);
}

export async function processContent(
	source: string,
): Promise<{ processedString: string; errors: boolean } | undefined> {
	if (!source.trim()) {
		return;
	}

	const codes = new Map<string, string>();
	let final = source;

	let escaped = false;
	let changed = false;

	let errors = false;

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
				i += result.end - 1;
				continue;
			}

			changed = true;
			let bin = codes.get(result.content.trim());

			if (!bin) {
				bin = await createBin(result.content, result.lang)
					.then((url) => `<${url}>`)
					// eslint-disable-next-line @typescript-eslint/no-loop-func
					.catch((e: Error) => {
						errors = true;
						return e instanceof BinError ? `[${errorFormatter(e)}]` : `[${e.message}]`;
					});
				codes.set(result.content.trim(), bin);
			}

			final = replaceAt(final, bin, start, i + result.end);
			i += bin.length - 1;

			continue;
		}

		escaped = false;
	}

	return changed ? { processedString: final, errors } : undefined;
}
