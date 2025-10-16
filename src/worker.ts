import { transporter } from "./configs/mail";
import { emailQueue } from "./configs/queue";

emailQueue.process(async (job) => {
	const { email, otp } = job.data;

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: "Your OTP Code",
		html: `
            <h2>Your Verification Code</h2>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 5 minutes.</p>
        `,
	};

	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		throw new Error("Failed to send OTP");
	}
});