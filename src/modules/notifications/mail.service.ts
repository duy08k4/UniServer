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
            port: 465,
            secure: true, // use SSL
            pool: true,   // use connection pool
            auth: {
                user: this.configService.get<string>('GMAIL_USER'),
                pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
            },
            // Render/PaaS optimization: Force IPv4 and increase timeouts
            connectionTimeout: 10000, // 10s
            greetingTimeout: 10000,
            socketTimeout: 10000,
            family: 4 // Force IPv4 to avoid resolution issues on some cloud providers
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
