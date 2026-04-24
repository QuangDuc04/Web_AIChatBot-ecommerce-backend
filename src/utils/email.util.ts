import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || 'noreply@yourstore.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function baseTemplate(title: string, body: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .header { background: #2563eb; color: #fff; padding: 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; }
      .body { padding: 32px 24px; color: #333; line-height: 1.6; }
      .btn { display: inline-block; padding: 12px 32px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
      .footer { padding: 16px 24px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h1>${title}</h1></div>
      <div class="body">${body}</div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Ecommerce Store. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>`;
}

export class EmailUtil {
  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;
    const html = baseTemplate(
      'Xác thực email',
      `
      <p>Xin chào,</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn nút bên dưới để xác thực email của bạn:</p>
      <p style="text-align:center"><a class="btn" href="${verifyUrl}">Xác thực email</a></p>
      <p>Hoặc sao chép đường link sau vào trình duyệt:</p>
      <p style="word-break:break-all;color:#2563eb">${verifyUrl}</p>
      <p>Link này sẽ hết hạn sau <strong>24 giờ</strong>.</p>
      <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
      `
    );

    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Xác thực email - Ecommerce Store',
      html,
    });
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
    const html = baseTemplate(
      'Đặt lại mật khẩu',
      `
      <p>Xin chào,</p>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tiếp tục:</p>
      <p style="text-align:center"><a class="btn" href="${resetUrl}">Đặt lại mật khẩu</a></p>
      <p>Hoặc sao chép đường link sau vào trình duyệt:</p>
      <p style="word-break:break-all;color:#2563eb">${resetUrl}</p>
      <p>Link này sẽ hết hạn sau <strong>1 giờ</strong>.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      `
    );

    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Đặt lại mật khẩu - Ecommerce Store',
      html,
    });
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const shopUrl = CLIENT_URL;
    const html = baseTemplate(
      'Chào mừng bạn!',
      `
      <p>Xin chào <strong>${firstName}</strong>,</p>
      <p>Chúc mừng bạn đã xác thực email thành công! Tài khoản của bạn đã sẵn sàng sử dụng.</p>
      <p>Bắt đầu mua sắm ngay hôm nay:</p>
      <p style="text-align:center"><a class="btn" href="${shopUrl}">Khám phá cửa hàng</a></p>
      <p>Nếu bạn cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi.</p>
      <p>Trân trọng,<br>Đội ngũ Ecommerce Store</p>
      `
    );

    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Chào mừng bạn đến với Ecommerce Store!',
      html,
    });
  }
}
