import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('GMAIL_USER'),
                pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
            }
        })
    }

    async sendBulk(emails: string[], subject: string, html: string): Promise<void> {
        if (!emails.length) return
        // Gửi không đồng bộ, không block response
        this.transporter.sendMail({
            from: `"UniProject" <${this.configService.get('GMAIL_USER')}>`,
            bcc: emails.join(','),  // dùng bcc để ẩn email người nhận
            subject,
            html,
        }).catch(err => console.error('[MailService] Send failed:', err.message))
    }
}