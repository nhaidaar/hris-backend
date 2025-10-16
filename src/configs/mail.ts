import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
	service: process.env.MAIL_SERVICE || undefined,
	host: process.env.MAIL_HOST,
	secure: true,
	port: Number(process.env.MAIL_PORT),
	auth: {
		user: process.env.MAIL_USERNAME,
		pass: process.env.MAIL_PASSWORD,
	},
});