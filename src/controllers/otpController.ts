import { redis } from "../configs/redis";
import { generateOTP } from "../utils/otpUtils";

export async function generateAndStoreOTP(email: string): Promise<string> {
    const otp = generateOTP();

    await redis.set(`otp:${email}`, otp, { EX: 300 });
    return otp;
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
    const storedOTP = await redis.get(`otp:${email}`);
    if (storedOTP === otp) {
        return true;
    }
    return false;
}