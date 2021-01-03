import { processContent } from "../src/helpers";

const binUrl = (ext = "txt"): string => `<https://rtdbin\\.fusetim\\.tk/[A-Za-z]+\\.${ext}>`;
const MAX_LINES = 3;

describe(processContent, () => {
	it("should replace the code with undefined when an error occurs since there are no changes", async () => {
		jest.resetModules();
		process.env.BIN_URL = "https://rtdbin.timoth.ee/new";
		console.error = jest.fn();
		expect(await processContent("see : `this\nis\nmultiline !`", MAX_LINES)).toBeUndefined();
		expect(console.error).toBeCalledTimes(1);
	});

	beforeEach(() => {
		jest.resetModules();
		process.env.BIN_URL = "https://rtdbin.fusetim.tk/new";
	});

	it("should replace the code with the error message when an error occurs", async () => {
		expect(
			await processContent(
				`see : \`\`\`js\nthis\nis\nmulti\nline !\`\`\` \`\`\`${"and this is big\n".repeat(4097)}\`\`\``,
				MAX_LINES,
			),
		).toEqual(expect.stringMatching(`see : ${binUrl("js")} \\[Erreur [0-9]+ : .+\\.\\]`));
	});

	it("should return undefined if there are no changes", async () => {
		expect(await processContent("no changes", MAX_LINES)).toBeUndefined();
	});

	it("should replace duplicated codes by the same bin url", async () => {
		const [first, last] = (await processContent("`\na\nb\nc` et `\na\nb\nc`", MAX_LINES))!.split(" et ", 2);
		expect(first).toEqual(last);

		const [first2, last2] = (await processContent("```js\na\nb\nc``` ```js\na\nb\nc```", MAX_LINES))!.split(" ", 2);
		expect(first2).toEqual(last2);
	});

	it("should replace duplicated codes by the same bin url with different extension", async () => {
		const [first, last] = (await processContent("```jss\na\nb\nc``` ```ts\na\nb\nc```", MAX_LINES))!.split(" ", 2);
		expect(last).toEqual(`${first.slice(0, -4)}ts>`);
	});

	it("should make the corrects changes", async () => {
		expect(await processContent("see : `this\nis\nmultiline !`", MAX_LINES)).toEqual(
			expect.stringMatching(new RegExp(`see : ${binUrl()}`)),
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
				`Bonjour ${binUrl("js")} voilà\n\`\`\`js\nabc\n\`\`\`\n ${binUrl(
					"txt",
				)} puis \`retest\` sans oublier ${binUrl("txt")} et \\\\\`\`\`abc\`\`\` blabla \`\`\`a.\`\`\``,
			),
		);
	});
});
