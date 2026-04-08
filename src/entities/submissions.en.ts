import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Forms } from "./forms.en";
import { Users } from "./user.en";
import { SubmissionAnswers } from "./submission_answers.en";
import { SubmissionCheckboxes } from "./submission_checkboxes.en";
import { SubmissionStatus } from "src/enums/enums";

@Entity('submissions')
@Index(['user', 'form'])
export class Submissions {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.PENDING })
    status: SubmissionStatus

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date
    
    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    // Relations
    @ManyToOne(() => Forms, (form) => form.submissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'form_id' })
    form: Forms;

    @ManyToOne(() => Users, (user) => user.submissions, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'user' })
    user: Users;

    @OneToMany(() => SubmissionAnswers, (answer) => answer.submission, { cascade: true })
    answers: SubmissionAnswers[];

    @OneToMany(() => SubmissionCheckboxes, (checkbox) => checkbox.submission, { cascade: true })
    checkboxes: SubmissionCheckboxes[];
}