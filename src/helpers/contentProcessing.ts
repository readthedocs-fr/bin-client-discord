import { BinError } from "../misc/BinError";
import { createBin } from "./createBin";
import { logError } from "./logError";

const BACK_TICK = "`";
const ESCAPE = "\\";

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

export async function processContent(source: string, maxLines: number): Promise<string | undefined> {
	if (!source.trim()) {
		return;
	}

	const codes = new Map<string, (ext?: string) => string>();
	let final = source;

	let escaped = false;
	let errors = 0;

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
			const lines = result.content.split("\n", maxLines).length;

			if (lines < maxLines) {
				i += result.end - 1;
				continue;
			}

			let bin = codes.get(result.content.trim())?.(result.lang);

			if (!bin) {
				const link = await createBin(result.content, result.lang)
					.then((url) => (ext = "txt"): string =>
						`<${url.slice(0, url.endsWith("txt") ? -3 : -result.lang!.length)}${ext}>`,
					)
					// eslint-disable-next-line @typescript-eslint/no-loop-func
					.catch((e: Error) => {
						errors++;
						// log if the error is critical.
						if (e instanceof BinError ? [400, 403, 404, 405].includes(e.code) : true) {
							logError(e);
						}
						return (): string => `[${e}]`;
					});
				bin = link(result.lang);
				codes.set(result.content.trim(), link);
			}

			final = replaceAt(final, bin, start, i + result.end);
			i += bin.length - 1;

			continue;
		}

		escaped = false;
	}
	return codes.size - errors > 0 ? final : undefined;
}
