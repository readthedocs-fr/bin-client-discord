import * as FormData from "form-data";
import fetch from "node-fetch";

import { checkStatus } from "./checkStatus";
import { getConfig } from "./getConfig";

const TOKEN_REGEXP = /[a-zA-Z0-9]{24}\.[a-zA-Z0-9]{6}\.[a-zA-Z0-9_-]{27}|mfa\.[a-zA-Z0-9_-]{84}/g;

export async function createBin(code: string, language = "txt"): Promise<string | Error> {
	const form = new FormData();
	form.append("code", code.replace(TOKEN_REGEXP, "[DISCORD TOKEN DETECTED]"));
	form.append("lang", language);

	const { bin } = await getConfig();
	return fetch(bin.url, { method: "POST", body: form })
		.then(checkStatus)
		.then((res) => res.url)
		.catch((err: Error) => err);
}
