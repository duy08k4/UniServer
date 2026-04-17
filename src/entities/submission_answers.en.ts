import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Fields } from "./fields.en";
import { Submissions } from "./submissions.en";

@Entity('submission_answers')
@Index(['field', 'submission'])
export class SubmissionAnswers {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'varchar' })
    body : string

    // Relations
    @ManyToOne(() => Fields, (field) => field.answer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'field' })
    field: Fields;

    @ManyToOne(() => Submissions, (sub) => sub.answers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission' })
    submission: Submissions;
}