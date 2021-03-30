import { BinError, errors } from "../BinError";

describe(BinError, () => {
	it("should return the correct name", () => {
		const error = new BinError("", 0);
		expect(error.name).toEqual(BinError.name);
	});

	it("should return the correct object if the error exists", () => {
		const error = new BinError("hey", 400);

		expect(error.message).toEqual(`Erreur 400 : ${errors[400]}.`);
		expect(error.code).toEqual(400);
	});

	it("should return the correct object if the error doesn't exist", () => {
		const error = new BinError("I'm a teapot", 418);

		expect(error.message).toEqual("Erreur 418 : I'm a teapot.");
		expect(error.code).toEqual(418);
	});
});
