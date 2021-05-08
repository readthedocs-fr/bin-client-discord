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
		regex: /^```(?:([\w-.]*)?(?:\s*\n))?([^\n].*?)\n*```/sy,
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

function insertAt(source: string, insertion: string, start: number, end = start): string {
	return source.slice(0, start) + insertion + source.slice(end);
}

export async function processContent(source: string, maxLines: number): Promise<[string, string[]] | undefined> {
	const codes = new Map<string, string | Error>();
	let final = source;

	let escaped = false;

	for (let i = 0; i < final.length; i++) {
		const char = final[i];

		if (char === ESCAPE) {
			escaped = !escaped;
			continue;
		}

		if (char === BACK_TICK && !escaped) {
			const matches = match(`${escaped ? ESCAPE : ""}${final.slice(i)}`);
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

			const content = result.content.trim();
			let bin: string | Error | undefined = codes.get(content);

			if (!bin) {
				bin = await createBin({ code: result.content, filename: `..${result.lang || "txt"}` })
					.then((url) => url.slice(0, url.lastIndexOf(".")))
					// eslint-disable-next-line @typescript-eslint/no-loop-func
					.catch((e: Error) => {
						// log if the error is critical.
						if (!(e instanceof BinError) || [400, 403, 404, 405].includes(e.code) || e.code >= 500) {
							logError(e);
						}
						return e;
					});
				codes.set(content, bin);
			}

			const text = typeof bin === "string" ? `<${bin}.${result.lang || "txt"}>` : `[${bin}]`;
			final = insertAt(final, text, start + 1, i + result.end);
			i += text.length - 1;

			continue;
		}

		escaped = false;
	}

	const binUrls = [...codes.values()].filter((code): code is string => typeof code === "string");
	return binUrls.length > 0 ? [final, binUrls] : undefined;
}
