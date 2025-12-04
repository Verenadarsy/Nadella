// @/lib/mailer.js
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmailToClient(email, password, name = 'User') {
  try {
    const { data, error } = await resend.emails.send({
      from: "Nadella Tech <onboarding@resend.dev>", // Gunakan domain verified atau resend.dev untuk testing
      to: email,
      subject: "Your Account Login Credentials - Nadella Tech",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { background: #ffffff; padding: 30px; }
            .credentials { background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
            .password { font-size: 20px; font-weight: bold; color: #667eea; letter-spacing: 1px; font-family: 'Courier New', monospace; background: #e7f3ff; padding: 10px; border-radius: 5px; display: inline-block; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; background: #f8f9fa; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Nadella Tech!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>Your account has been successfully created. Below are your login credentials:</p>
              
              <div class="credentials">
                <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${email}</p>
                <p style="margin: 15px 0 5px 0;"><strong>🔑 Password:</strong></p>
                <div class="password">${password}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong><br>
                Please change your password immediately after your first login for security purposes.
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
                  Login to Your Account
                </a>
              </div>
              
              <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br><strong>Nadella Tech Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Nadella Tech. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      throw new Error(error.message || 'Failed to send email via Resend')
    }

    console.log('✅ Email sent successfully via Resend:', {
      id: data?.id,
      to: email
    })

    return { success: true, data }

  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error.message,
      to: email
    })
    
    // Throw error agar bisa di-catch di API route
    throw error
  }
}