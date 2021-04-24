import got from "got";

export const request = got.extend({
	http2: true,
	timeout: parseInt(process.env.REQUEST_TIMEOUT!, 10),
	retry: {
		limit: 2,
		methods: ["POST", "GET", "PUT", "HEAD", "DELETE", "OPTIONS", "TRACE"],
		statusCodes: [500, 502, 503, 504, 521, 522, 524],
		errorCodes: ["ECONNRESET", "EADDRINUSE", "ECONNREFUSED", "EPIPE", "ENETUNREACH", "EAI_AGAIN"],
	},
});
