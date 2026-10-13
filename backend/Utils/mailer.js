const nodemailer = require('nodemailer');

// Sends email through SMTP when SMTP_* settings are in .env.
// Without them (local development) the email is printed to the console instead.
let transporter = null;
const getTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 587,
            secure: Number(SMTP_PORT) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS }
        });
    }
    return transporter;
};

const layout = (title, body) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#18181b">
  <h2 style="margin-bottom:4px">SHOPPER</h2>
  <h3 style="margin-top:0;font-weight:600">${title}</h3>
  ${body}
  <p style="color:#6b7280;font-size:13px;margin-top:32px">This is an automated email from Shopper.</p>
</div>`;

const formatPrice = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// Never throws: a failed email must not break signup, payment, etc.
const sendMail = async ({ to, subject, html, text }) => {
    const transport = getTransporter();
    if (!transport) {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`\n[email not configured - would send]\nTo: ${to}\nSubject: ${subject}\n${text || ''}\n`);
        }
        return false;
    }
    try {
        await transport.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to, subject, html, text
        });
        return true;
    } catch (err) {
        console.error('Email failed:', err.message);
        return false;
    }
};

const sendWelcomeEmail = (user) => sendMail({
    to: user.email,
    subject: 'Welcome to Shopper!',
    text: `Hi ${user.name}, your Shopper account is ready. Happy shopping!`,
    html: layout(`Welcome, ${user.name}!`, '<p>Your Shopper account is ready. Happy shopping!</p>')
});

const sendPasswordResetEmail = (user, link) => sendMail({
    to: user.email,
    subject: 'Reset your Shopper password',
    text: `Hi ${user.name}, reset your password using this link (valid for 15 minutes): ${link}`,
    html: layout('Reset your password', `
        <p>Hi ${user.name}, we received a request to reset your password.</p>
        <p><a href="${link}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none">Reset password</a></p>
        <p style="color:#6b7280;font-size:13px">This link is valid for 15 minutes. If you didn't request it, you can ignore this email.</p>`)
});

const orderItemsTable = (order) => order.items.map((i) =>
    `<tr><td style="padding:6px 0">${i.name} (Size ${i.size}) × ${i.quantity}</td><td style="text-align:right">${formatPrice(i.price * i.quantity)}</td></tr>`
).join('');

const sendOrderConfirmationEmail = (user, order) => sendMail({
    to: user.email,
    subject: `Order confirmed - ${formatPrice(order.amount)}`,
    text: `Hi ${user.name}, your order of ${formatPrice(order.amount)} has been placed. Payment ID: ${order.razorpayPaymentId}`,
    html: layout('Your order is confirmed', `
        <p>Hi ${user.name}, thanks for shopping with us!</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${orderItemsTable(order)}
          ${order.discount ? `<tr><td>Discount (${order.couponCode})</td><td style="text-align:right">-${formatPrice(order.discount)}</td></tr>` : ''}
          <tr><td style="padding-top:8px;font-weight:bold">Total paid</td><td style="text-align:right;font-weight:bold">${formatPrice(order.amount)}</td></tr>
        </table>
        <p style="font-size:14px">Delivering to: ${order.shippingAddress.fullName}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}</p>
        <p style="color:#6b7280;font-size:13px">Payment ID: ${order.razorpayPaymentId}</p>`)
});

const sendOrderCancelledEmail = (user, order) => sendMail({
    to: user.email,
    subject: 'Your order has been cancelled',
    text: `Hi ${user.name}, your order of ${formatPrice(order.amount)} has been cancelled. The refund will reach your account in 5-7 working days.`,
    html: layout('Order cancelled', `
        <p>Hi ${user.name}, your order of ${formatPrice(order.amount)} has been cancelled.</p>
        <p>The refund will reach your original payment method in 5-7 working days.</p>`)
});

module.exports = {
    sendMail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendOrderCancelledEmail
};
