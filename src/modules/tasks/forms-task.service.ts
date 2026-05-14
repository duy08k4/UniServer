import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Forms } from "src/entities/forms.en";
import { LessThanOrEqual, Repository } from "typeorm";

@Injectable()
export class FormsTaskService {
    private readonly logger = new Logger(FormsTaskService.name);

    constructor(
        @InjectRepository(Forms)
        private readonly formRepo: Repository<Forms>
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleFormAutoStatus() {
        const now = new Date();

        try {
            // 1. Auto Open Forms
            const openResult = await this.formRepo.createQueryBuilder()
                .update(Forms)
                .set({ is_stopped: false })
                .where("is_auto_open = :isAutoOpen", { isAutoOpen: true })
                .andWhere("open_at <= :now", { now })
                .andWhere("is_stopped = :isStopped", { isStopped: true })
                .andWhere("is_deleted = :isDeleted", { isDeleted: false })
                .execute();

            if (openResult.affected && openResult.affected > 0) {
                this.logger.log(`Automatically opened ${openResult.affected} forms.`);
            }

            // 2. Auto Close Forms
            const closeResult = await this.formRepo.createQueryBuilder()
                .update(Forms)
                .set({ is_stopped: true })
                .where("is_auto_close = :isAutoClose", { isAutoClose: true })
                .andWhere("close_at <= :now", { now })
                .andWhere("is_stopped = :isStopped", { isStopped: false })
                .andWhere("is_deleted = :isDeleted", { isDeleted: false })
                .execute();

            if (closeResult.affected && closeResult.affected > 0) {
                this.logger.log(`Automatically closed ${closeResult.affected} forms.`);
            }
        } catch (error) {
            this.logger.error("Error occurred while processing auto form status:", error.stack);
        }
    }
}
