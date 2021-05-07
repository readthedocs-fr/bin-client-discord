import { FormData } from "@typescord/famfor";
import { Headers, HTTPError, TimeoutError } from "got";

import { BinError } from "../misc/BinError";
import { request } from "./request";

const TOKEN_REGEXP = /[a-z\d]{24}\.[a-z\d]{6}\.[\w-]{27}|mfa\.[\w-]{84}/gi;

interface BinOptions {
	code: string;
	filename: string;
	lifeTime?: string | number;
	maxUses?: number;
}

export async function createBin({ code, lifeTime, maxUses, filename }: BinOptions): Promise<string> {
	const fd = new FormData();

	fd.append("lifetime", (lifeTime || 0).toString());
	fd.append("maxusage", (maxUses ?? 0).toString());
	fd.append("code", code.replace(TOKEN_REGEXP, "[DISCORD TOKEN DETECTED]"), {
		filename,
		type: "text/plain; charset=utf-8",
	});

	return request
		.post(process.env.BIN_URL!, {
			headers: (fd.headers as unknown) as Headers,
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
