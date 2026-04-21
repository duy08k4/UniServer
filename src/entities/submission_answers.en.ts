import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Fields } from "./fields.en";
import { Submissions } from "./submissions.en";
import { Field_Type } from "@app/enums/enums";

@Entity('submission_answers')
@Index(['field', 'submission'])
export class SubmissionAnswers {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', nullable: true })
    body: string

    @Column({ type: 'enum', enum: Field_Type, default: Field_Type.STRING })
    input_type: Field_Type

    // Relations
    @ManyToOne(() => Fields, (field) => field.answer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'field' })
    field: Fields;

    @ManyToOne(() => Submissions, (sub) => sub.answers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission' })
    submission: Submissions;
}