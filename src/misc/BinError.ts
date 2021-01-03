const errors: Record<number, string> = {
	400: "Erreur 400 : mauvaise requête. Contactez un développeur du bot.",
	403: "Erreur 403 : accès interdit. Contactez l'hébergeur du service de bin.",
	404: "Erreur 404 : site non trouvé. Il est possible qu'il soit arrêté, ou que le bot soit mal configuré.",
	405: "Erreur 405 : méthode non autorisée. Contactez un développeur du bot.",
	408: "Erreur 408 : timeout. Cela survient sûrement d'un petit problème de connexion.",
	// eslint-disable-next-line max-len
	413: "Erreur 413 : requête trop large. Votre code est trop lourd pour le service de bin qui a refusé de traiter la requête.",
};

export class BinError extends Error {
	public code: number;

	public constructor(message: string, code: number) {
		super(message);
		this.code = code;
		this.name = this.constructor.name;
	}

	public toString(): string {
		return errors[this.code] || `Erreur ${this.code} : ${this.message}.`;
	}
}
