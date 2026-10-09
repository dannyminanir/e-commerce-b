// Keeps user input from being treated as HTML inside the email
const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const welcomeEmailTemplate = (name: string) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937; line-height: 1.6;">
    <h2 style="margin: 0 0 16px; color: #1e40af;">Welcome, ${escapeHtml(name)}!</h2>
    <p>Thank you for registering. Your account is ready, so you can log in and start shopping.</p>
    <p style="color: #6b7280; font-size: 13px;">If you didn't create this account, you can ignore this email.</p>
  </div>
`;