import got, { HTTPError, TimeoutError } from "got";

import { BinError } from "../misc/BinError";

const TOKEN_REGEXP = /[a-z\d]{24}\.[a-z\d]{6}\.[\w-]{27}|mfa\.[\w-]{84}/gi;

interface BinOptions {
	code: string;
	language?: string;
	lifeTime?: string | number;
	maxUsage?: number;
}
export async function createBin({ code, language, lifeTime, maxUsage }: BinOptions): Promise<string> {
	return got
		.post(process.env.BIN_URL!, {
			http2: true,
			followRedirect: false,
			form: {
				code: code.replace(TOKEN_REGEXP, "[DISCORD TOKEN DETECTED]"),
				lang: language || "txt",
				lifetime: lifeTime || 0,
				maxusage: maxUsage ?? 0,
			},
			timeout: Number(process.env.MAX_TIMEOUT_MS),
			retry: {
				limit: 2,
				methods: ["POST"],
				statusCodes: [500, 502, 503, 504, 521, 522, 524],
				errorCodes: ["ECONNRESET", "EADDRINUSE", "ECONNREFUSED", "EPIPE", "ENETUNREACH", "EAI_AGAIN"],
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
