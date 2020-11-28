import * as FormData from "form-data";
import fetch from "node-fetch";

import { checkStatus } from "./checkStatus";
import { getConfig } from "./getConfig";

export async function createBin(code: string, language = "txt"): Promise<string | Error> {
	const form = new FormData();
	form.append("code", code);
	form.append("lang", language);

	const { bin } = await getConfig();
	return fetch(bin.url, { method: "POST", body: form })
		.then(checkStatus)
		.then((res) => res.url)
		.catch((err: Error) => err);
}
