export const errors: Record<number, string> = {
	400: "mauvaise requête. Veuillez créer une issue si cela persiste",
	403: "accès interdit. Contactez l'hébergeur du service de bin ou créer une issue sur `bin-server` si cela persiste",
	404: "site non trouvé. Il est possible qu'il soit arrêté, ou que le bot soit mal configuré",
	405: "méthode non autorisée. Veuillez créer une issue si cela persiste",
	408: "timeout. Problème de connexion entre le bot et le bin",
	413: "requête trop large. Votre code est trop lourd pour le service de bin qui a refusé de traiter la requête",
	500: "erreur interne du serveur. Veuillez créer une issue si cela persiste",
	502: "bad gateway",
	522: "timeout (cloudflare). Il est fort possible que le site ait planté",
};

export class BinError extends Error {
	public readonly code: number;

	public constructor(message: string, code: number) {
		super(`Erreur ${code} : ${errors[code] || message}.`);
		this.code = code;
		this.name = this.constructor.name;
	}

	public toString(): string {
		return this.message;
	}
}
