import { Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Checkbox_fields } from "./checkbox_fields.en";
import { Submissions } from "./submissions.en";
import { CheckboxFieldChoices } from "./checkbox_field_choices.en";

@Entity('submission_checkboxes')
export class SubmissionCheckboxes {
    @PrimaryGeneratedColumn('uuid')
    id : string

    // Relations
    @OneToOne(() => Checkbox_fields, (cf) => cf.submissionCheckbox, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'checkbox_field_id' })
    checkboxField: Checkbox_fields;

    @ManyToOne(() => Submissions, (sub) => sub.checkboxes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission' })
    submission: Submissions;

    @OneToOne(() => CheckboxFieldChoices, (choice) => choice.submissionCheckbox)
    choice: CheckboxFieldChoices;
}