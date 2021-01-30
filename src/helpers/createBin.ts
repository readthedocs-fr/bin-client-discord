import got, { HTTPError } from "got";

import { BinError } from "../misc/BinError";

const TOKEN_REGEXP = /[a-z\d]{24}\.[a-z\d]{6}\.[\w-]{27}|mfa\.[\w-]{84}/gi;

interface BinOptions {
	code: string;
	language?: string;
	lifeTime?: string | number;
	maxUsage?: number;
}
export async function createBin({ code, language, lifeTime, maxUsage }: BinOptions): Promise<string> {
	const binUrl = process.env.BIN_URL!;
	return got
		.post(binUrl, {
			http2: true,
			followRedirect: false,
			form: {
				code: code.replace(TOKEN_REGEXP, "[DISCORD TOKEN DETECTED]"),
				lang: language || "txt",
				lifetime: lifeTime || 0,
				maxusage: maxUsage ?? 0,
			},
		})
		.then(({ headers }) => headers.location!)
		.catch((e: Error) => {
			if (e instanceof HTTPError) {
				throw new BinError(e.message, e.response.statusCode);
			}
			throw e;
		});
}
