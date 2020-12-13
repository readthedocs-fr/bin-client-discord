import { parse } from "./contentLexer";
import { createBin } from "./createBin";

const MAX_LINES = parseInt(process.env.MAX_LINES!, 10);

interface TextNode {
	type: "text";
	content: string;
}

interface CodeNode {
	type: "code";
	content: string;
	lang: string;
	raw: string;
	inline: boolean;
	isBig?: boolean;
}

interface BlankNode {
	type: "blank";
}

type Parsed = Array<CodeNode | TextNode | BlankNode>;

export function blockMatcher(content: string): Parsed {
	try {
		const matches: Parsed = parse(content);
		let containsBigCode = false;
		for (let i = 0; i < matches.length; i++) {
			const node = matches[i];

			if (node.type !== "code") {
				continue;
			}

			node.isBig = node.content.split("\n", MAX_LINES).length === MAX_LINES;

			if (node.isBig) {
				containsBigCode = true;
			}

			matches[i] = node;
		}
		return containsBigCode ? matches : [];
	} catch (e) {
		// TODO: better error handling ?
		return [];
	}
}

export async function blocksToBins(nodes: Parsed): Promise<string> {
	const { result } = await nodes.reduce(async (acc, curr) => {
		const accum = await acc;
		if (curr.type !== "code") {
			return {
				codes: accum.codes,
				result: accum.result + (curr.type === "text" ? curr.content : "\n"),
			};
		}

		if (curr.isBig) {
			const isExists = accum.codes.has(curr.raw);
			let code: string | undefined = isExists ? accum.codes.get(curr.raw) : undefined;

			if (!isExists) {
				const bin = await createBin(curr.content, curr.lang);
				accum.codes.set(curr.raw, (code = bin instanceof Error ? bin.message : bin));
			}

			return {
				codes: accum.codes,
				result: `${accum.result + code}\n`,
			};
		}

		return {
			codes: accum.codes,
			result: accum.result + curr.raw,
		};
	}, Promise.resolve({ codes: new Map<string, string>(), result: "" }));

	return result.trimEnd();
}
