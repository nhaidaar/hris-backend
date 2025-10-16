import Queue from "bull";

export const emailQueue = new Queue("emailQueue", {
	redis: {
		host: process.env.REDIS_HOST as string,
		port: (process.env.REDIS_PORT || 6379) as number,
		password: (process.env.REDIS_PASSWORD as string) || undefined,
	},
});