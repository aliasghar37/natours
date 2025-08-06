const nodemailer = require("nodemailer");
const htmlToText = require("html-to-text");
const pug = require("pug");
const { TransactionalEmailsApi, SendSmtpEmail } = require("@getbrevo/brevo");

module.exports = class Email {
    constructor(user, url) {
        this.from = `Ali Asghar <${process.env.EMAIL_FROM}>`;
        this.firstName = user.name;
        this.url = url;
        this.to = user.email;
    }

    brevo() {
        const emailApi = new TransactionalEmailsApi();
        if (!process.env.BREVO_API_KEY) {
            console.error("ERROR 💥: Brevo API not found.");
        }
        emailApi.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;
        return emailApi;
    }

    mailtrap() {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async send(template, subject) {
        // 1) Render HTML based on pug template
        const html = pug.renderFile(
            `${__dirname}/../views/emails/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject,
            }
        );
        // BREVO
        if (process.env.NODE_ENV === "production") {
            const brevo = this.brevo();

            // 2) Define email options
            let message = new SendSmtpEmail();
            message.subject = subject;
            message.htmlContent = html;
            message.textContent = htmlToText.convert(html);
            message.sender = {
                name: "Ali Asghar",
                email: process.env.BREVO_FROM_EMAIL,
            };
            message.to = [{ email: this.to, name: this.firstName }];

            // 3) Create transport and send email
            await brevo.sendTransacEmail(message);
        } else {
            // MAILTRAP
            const mailtrap = this.mailtrap();

            // 2) Define Email options
            const mailOptions = {
                from: this.from,
                to: this.to,
                subject,
                html,
                text: htmlToText.convert(html),
            };
            // 3) Create a transport and send email
            await mailtrap.sendMail(mailOptions);
        }
    }

    async sendWelcome() {
        await this.send("welcome", "Welcome to the Natours family!");
    }

    async sendPasswordReset() {
        await this.send(
            "resetPassword",
            "Password reset link (valid for 5 minutes)"
        );
    }
};
