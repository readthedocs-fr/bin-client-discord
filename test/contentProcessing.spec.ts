import { processContent } from "../src/helpers";

const binUrl = (ext = "txt"): string => `<https://rtdbin\\.fusetim\\.tk/[a-z]+\\.${ext}>`;
const MAX_LINES = 3;

describe("processContent() with bin errors", () => {
	beforeAll(() => {
		jest.resetModules();
		process.env.BIN_URL = "https://rtdbin.timoth.ee/new";
	});

	test("processContent() replaces code with the error message", async () => {
		expect(await processContent("see : `this\nis\nmultiline !`", MAX_LINES)).toEqual(
			"see : request to https://rtdbin.timoth.ee/new failed, reason: getaddrinfo ENOTFOUND rtdbin.timoth.ee",
		);
	});
});

describe("processContent() without bin errors", () => {
	beforeAll(() => {
		jest.resetModules();
		process.env.BIN_URL = "https://rtdbin.fusetim.tk/new";
	});

	test("returns undefined if there are no changes", async () => {
		expect(await processContent("no changes", MAX_LINES)).toBeUndefined();
	});

	test("replaces duplicates codes by the same bin url", async () => {
		const [first, last] = (await processContent("`\na\nb\nc` et `\na\nb\nc`", MAX_LINES))!.split(" et ", 2);
		expect(first).toEqual(last);

		const [first2, last2] = (await processContent("```js\na\nb\nc``` ```js\na\nb\nc```", MAX_LINES))!.split(" ", 2);
		expect(first2).toEqual(last2);
	});

	test("replaces duplicates codes by the same bin url with different extension", async () => {
		const [first, last] = (await processContent("```jss\na\nb\nc``` ```ts\na\nb\nc```", MAX_LINES))!.split(" ", 2);
		expect(last).toEqual(`${first.slice(0, -4)}ts>`);
	});

	test("makes correct changes", async () => {
		expect(await processContent("see : `this\nis\nmultiline !`", MAX_LINES)).toEqual(
			expect.stringMatching(new RegExp(`see : ${binUrl()}`, "i")),
		);

		expect(
			await processContent("A ` b \\` et ```cdef``` puis\n```js\ncode\n``` et enfin \\```abcdef```", MAX_LINES),
		).toBeUndefined();

		expect(
			await processContent(
				"A ```b\nc\nd\ne``` et ```\nd\ne\nf\n``` puis ```\nco\nde \nn\n```\net ```\na\nB\nc\n```",
				MAX_LINES,
			),
		).toEqual(expect.stringMatching(`A ${binUrl("b")} et ${binUrl()} puis ${binUrl()}\net ${binUrl()}`));

		expect(
			await processContent(
				// eslint-disable-next-line max-len
				"Bonjour ```js\nabc\ndef\nghi``` voilà\n```js\nabc\n```\n ``test\nafg\nregf`` puis `retest` sans oublier `a\nb\nc` et \\```abc``` blabla ```a.```",
				MAX_LINES,
			),
		).toEqual(
			expect.stringMatching(
				new RegExp(
					`Bonjour ${binUrl("js")} voilà\n\`\`\`js\nabc\n\`\`\`\n ${binUrl(
						"txt",
					)} puis \`retest\` sans oublier ${binUrl("txt")} et \\\\\`\`\`abc\`\`\` blabla \`\`\`a.\`\`\``,
					"i",
				),
			),
		);
	});
});
