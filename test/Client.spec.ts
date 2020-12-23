import { Client } from "../src/classes";

test("client.init() throws error if the env variables is not valid", async () => {
	const client = new Client();
	expect(client.init()).rejects.toThrow("Current environment is invalid.");
});
