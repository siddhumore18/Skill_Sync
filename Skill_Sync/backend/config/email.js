import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Check if email is configured
 * @returns {boolean}
 */
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && 
         process.env.EMAIL_USER !== 'your-email@gmail.com' &&
         process.env.EMAIL_PASS &&
         process.env.EMAIL_PASS !== 'your-app-password';
};

// Create email transporter only if email is configured
let transporter = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter error:', error);
    } else {
      console.log('Email transporter ready');
    }
  });
} else {
  console.warn('⚠️  Email not configured. OTP will be returned in API response (development mode).');
}


/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise<void>}
 */
export const sendOTPEmail = async (email, otp) => {
  // Check if email is configured
  if (!isEmailConfigured() || !transporter) {
    // In development mode, allow skipping email
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Email not configured. Skipping email send (development mode).');
      console.log(`📧 OTP for ${email}: ${otp}`);
      return { messageId: 'dev-mode', otp }; // Return object with OTP for development
    }
    throw new Error('Email not configured');
  }

  const mailOptions = {
    from: `"Skill Sync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Skill Sync Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

export default transporter;

