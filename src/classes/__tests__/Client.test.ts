import { Client } from "..";

describe(Client.prototype.init, () => {
	it("should throw error if the env variables are invalid", () => {
		const client = new Client();

		expect(client.init()).rejects.toThrow("Current environment is invalid.");
	});
});
