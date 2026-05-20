import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService implements OnModuleInit {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // false for STARTTLS (port 587)
            requireTLS: true,
            auth: {
                user: this.configService.get<string>('GMAIL_USER'),
                pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
            },
            tls: {
                // Do not fail on invalid certs (optional, but helps if there's a proxy)
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        } as any);
    }

    async onModuleInit() {
        try {
            await this.transporter.verify();
            this.logger.log('SMTP Connection has been established successfully.');
        } catch (error) {
            this.logger.error('SMTP Connection failed:', error.message);
        }
    }

    async sendBulk(emails: string[], subject: string, html: string): Promise<void> {
        if (!emails.length) return;
        
        // Gửi không đồng bộ, không block response
        this.transporter.sendMail({
            from: `"UniProject" <${this.configService.get('GMAIL_USER')}>`,
            bcc: emails.join(','),  // dùng bcc để ẩn email người nhận
            subject,
            html,
        }).catch(err => this.logger.error(`[MailService] Send failed: ${err.message}`));
    }
}
