import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { ScoreForms } from "src/entities/score_forms.en";
import { Repository } from "typeorm";
import { ScoreFormsGateway } from "../scoreforms/scoreforms.gateway";

@Injectable()
export class ScoreFormsTaskService {
    private readonly logger = new Logger(ScoreFormsTaskService.name);

    constructor(
        @InjectRepository(ScoreForms)
        private readonly scoreFormRepo: Repository<ScoreForms>,
        private readonly scoreFormsGateway: ScoreFormsGateway
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleScoreFormAutoStatus() {
        const now = new Date();

        try {
            const openForms = await this.scoreFormRepo.createQueryBuilder("sf")
                .where("sf.is_auto_open = :isAutoOpen", { isAutoOpen: true })
                .andWhere("sf.open_at <= :now", { now })
                .andWhere("sf.is_stopped = :isStopped", { isStopped: true })
                .andWhere("sf.is_deleted = :isDeleted", { isDeleted: false })
                .getMany();

            if (openForms.length > 0) {
                await this.scoreFormRepo.update(openForms.map(f => f.id), { is_stopped: false });
                this.logger.log(`Automatically opened ${openForms.length} score forms.`);
                for (const form of openForms) {
                    this.scoreFormsGateway.toggleStop(form.id, false);
                }
            }

            const closeForms = await this.scoreFormRepo.createQueryBuilder("sf")
                .where("sf.is_auto_close = :isAutoClose", { isAutoClose: true })
                .andWhere("sf.close_at <= :now", { now })
                .andWhere("sf.is_stopped = :isStopped", { isStopped: false })
                .andWhere("sf.is_deleted = :isDeleted", { isDeleted: false })
                .getMany();

            if (closeForms.length > 0) {
                await this.scoreFormRepo.update(closeForms.map(f => f.id), { is_stopped: true });
                this.logger.log(`Automatically closed ${closeForms.length} score forms.`);
                for (const form of closeForms) {
                    this.scoreFormsGateway.toggleStop(form.id, true);
                }
            }
        } catch (error) {
            this.logger.error("Error occurred while processing auto score form status:", error.stack);
        }
    }
}
