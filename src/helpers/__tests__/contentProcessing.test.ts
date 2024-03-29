import { processContent } from "..";

const binUrl = (ext = "txt"): string => `<http://127.0.0.1:8012/[A-Za-z]+\\.${ext}>`;
const MAX_LINES = 3;
const consoleError = console.error;

describe(processContent, () => {
	it("should replace the code with undefined when an error occurs since there are no changes", async () => {
		process.env.CREATE_BIN_URL = "https://binn.readthedocs.fr/new";
		console.error = jest.fn();

		expect(await processContent("see : `this\nis\nmultiline !`", MAX_LINES)).toBeUndefined();
		expect(console.error).toBeCalledTimes(1);
	});

	beforeEach(() => {
		jest.resetModules();
		process.env.CREATE_BIN_URL = "http://127.0.0.1:8012/new";
		console.error = consoleError;
	});

	it("should replace the code with the error message when an error occurs", async () => {
		expect(
			await processContent(
				`see : \`\`\`js\nthis\nis\nmulti\nline !\`\`\` \`\`\`${"and this is big\n".repeat(4097)}\`\`\``,
				MAX_LINES,
			),
		).toEqual(expect.stringMatching(`see : ${binUrl("js")} \\[Err(eu|o)r( [0-9]+ )?: .+\\.?\\]`));
	});

	it("should return undefined if there are no changes", async () => {
		expect(await processContent("no changes", MAX_LINES)).toBeUndefined();
	});

	it("should replace duplicated codes by the same bin url", async () => {
		const results = (await processContent("`\na\nb\nc` et `\na\nb\nc`", MAX_LINES))?.split(" et ", 2);
		expect(results).not.toBeUndefined();
		expect(results?.[0]).toEqual(results?.[1]);

		const results2 = (await processContent("```js\na\nb\nc``` ```js\na\nb\nc```", MAX_LINES))?.split(" ", 2);
		expect(results2).not.toBeUndefined();
		expect(results2?.[0]).toEqual(results2?.[1]);
	});

	it("should replace duplicated codes by the same bin url with different extension", async () => {
		const results = (await processContent("```python\na\nb``` ```py\na\nb```", 1))?.split(" ", 2);
		expect(results).not.toBeUndefined();
		expect(results?.[0]).toEqual(`${results?.[1].slice(0, -3)}python>`);
	});

	it("should work with utf8", async () => {
		console.error = jest.fn();
		const results = await processContent(
			// eslint-disable-next-line max-len
			"```Ḽơᶉëᶆ ȋṕšᶙṁ ḍỡḽǭᵳ ʂǐť ӓṁệẗ, ĉṓɲṩḙċťᶒțûɾ ấɖḯƥĭṩčįɳġ ḝłįʈ, șếᶑ ᶁⱺ ẽḭŭŝḿꝋď ṫĕᶆᶈṓɍ ỉñḉīḑȋᵭṵńť ṷŧ ḹẩḇőꝛế éȶ đꝍꞎôꝛȇ ᵯáꞡᶇā ąⱡîɋṹẵ.``` ```py\ná'bç'dé'f'g'h'k```",
			1,
		);
		expect(console.error).not.toBeCalled();
		expect(results).toEqual(expect.stringMatching(`${binUrl()} ${binUrl("py")}`));
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
