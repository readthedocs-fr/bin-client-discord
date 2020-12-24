export class BinError extends Error {
	public code: number;

	public constructor(message: string, code: number) {
		super(message);
		this.code = code;
		this.name = this.constructor.name;
	}
}
