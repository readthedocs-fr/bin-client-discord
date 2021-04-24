import { FormData } from "@typescord/form-data";
import { HTTPError, TimeoutError } from "got";

import { BinError } from "../misc/BinError";
import { request } from "./request";

const TOKEN_REGEXP = /[a-z\d]{24}\.[a-z\d]{6}\.[\w-]{27}|mfa\.[\w-]{84}/gi;

interface BinOptions {
	code: string;
	language?: string;
	lifeTime?: string | number;
	maxUses?: number;
}

export async function createBin({ code, language, lifeTime, maxUses }: BinOptions): Promise<string> {
	const fd = new FormData();
	fd.set("code", code.replace(TOKEN_REGEXP, "[DISCORD TOKEN DETECTED]"));
	fd.set("lang", language || "text");
	fd.set("lifetime", (lifeTime || 0).toString());
	fd.set("maxusage", (maxUses ?? 0).toString());

	const contentLength = await fd.getComputedLength();
	return request
		.post(process.env.BIN_URL!, {
			headers: {
				"Content-Type": fd.headers["Content-Type"],
				"Content-Length": contentLength !== undefined ? contentLength.toString() : undefined,
			},
			body: fd.stream,
		})
		.then(({ headers }) => headers.location!)
		.catch((error: Error) => {
			if (error instanceof HTTPError || error instanceof TimeoutError) {
				throw new BinError(error.message, error instanceof HTTPError ? error.response.statusCode : 408);
			}
			throw error;
		});
}
