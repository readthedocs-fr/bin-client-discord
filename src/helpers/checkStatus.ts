import { Response } from "node-fetch";

export function checkStatus(res: Response): Response {
	if (res.ok) {
		return res;
	}

	throw new Error(`[Error ${res.status}: ${res.statusText}]`);
}
