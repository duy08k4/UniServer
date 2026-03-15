import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { SubmissionCheckboxes } from "./submission_checkboxes.en";

@Entity('checkbox_field_choices')
export class CheckboxFieldChoices {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'int' })
    index: number

    @Column({ type: 'varchar' })
    body: string

    // Relations
    @OneToOne(() => SubmissionCheckboxes, (sc) => sc.choice, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission_checkbox' })
    submissionCheckbox: SubmissionCheckboxes;
}