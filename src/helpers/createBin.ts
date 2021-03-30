import { FormData } from "@typescord/form-data";
import got, { HTTPError } from "got";

import { BinError } from "../misc/BinError";

const TOKEN_REGEXP = /[a-z\d]{24}\.[a-z\d]{6}\.[\w-]{27}|mfa\.[\w-]{84}/gi;

interface BinOptions {
	code: string;
	language?: string;
	lifeTime?: string | number;
	maxUses?: number;
}

export async function createBin({ code, language, lifeTime, maxUses }: BinOptions): Promise<string> {
	const fd = new FormData([
		{ name: "code", value: code.replace(TOKEN_REGEXP, "[DISCORD TOKEN DETECTED]") },
		{ name: "lang", value: language || "txt" },
		{ name: "lifetime", value: (lifeTime || 0).toString() },
		{ name: "maxusage", value: (maxUses ?? 0).toString() },
	]);

	const contentLength = await fd.getComputedLength();
	return got
		.post(process.env.BIN_URL!, {
			http2: true,
			followRedirect: false,
			headers: {
				...fd.headers,
				"Content-Length": contentLength !== undefined ? contentLength.toString() : undefined,
			},
			body: fd.stream,
		})
		.then(({ headers }) => headers.location!)
		.catch((error: Error) => {
			if (error instanceof HTTPError) {
				throw new BinError(error.message, error.response.statusCode);
			}
			throw error;
		});
}
