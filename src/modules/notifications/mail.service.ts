import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,

            auth: {
                user: this.configService.get<string>("GMAIL_USER"),
                pass: this.configService.get<string>("GMAIL_APP_PASSWORD"),
            },

            tls: {
                family: 4,
            },
        }as any)
    }

    async sendBulk(
        emails: string[],
        subject: string,
        html: string
    ): Promise<void> {
        if (!emails.length) return;

        // chia batch nhỏ
        const batchSize = 20;

        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            try {
                await this.transporter.sendMail({
                    from: `"UniProject" <${this.configService.get(
                        "GMAIL_USER"
                    )}>`,
                    bcc: batch,
                    subject,
                    html,
                });

                this.logger.log(`Sent batch ${i / batchSize + 1}`);

                // delay nhẹ tránh Gmail throttle
                await new Promise((r) => setTimeout(r, 1000));
            } catch (err) {
                this.logger.error(
                    `Batch ${i / batchSize + 1} failed`,
                    err
                );
            }
        }
    }
}