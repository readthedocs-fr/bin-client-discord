import { HTTPError, TimeoutError } from "got";

import { BinError } from "../misc/BinError";
import { request } from "./request";

const TOKEN_REGEXP = /[a-z\d]{24}\.[a-z\d]{6}\.[\w-]{27}|mfa\.[\w-]{84}/gi;

interface BinOptions {
	code: string;
	language?: string;
	lifeTime?: string | number;
	maxUsage?: number;
}
export async function createBin({ code, language, lifeTime, maxUsage }: BinOptions): Promise<string> {
	return request
		.post(process.env.BIN_URL!, {
			followRedirect: false,
			form: {
				code: code.replace(TOKEN_REGEXP, "[DISCORD TOKEN DETECTED]"),
				lang: language || "txt",
				lifetime: lifeTime || 0,
				maxusage: maxUsage ?? 0,
			},
		})
		.then(({ headers }) => headers.location!)
		.catch((error: Error) => {
			if (error instanceof HTTPError || error instanceof TimeoutError) {
				throw new BinError(error.message, error instanceof HTTPError ? error.response.statusCode : 408);
			}
			throw error;
		});
}
