import { Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Checkbox_fields } from "./checkbox_fields.en";
import { Submissions } from "./submissions.en";
import { CheckboxFieldChoices } from "./checkbox_field_choices.en";

@Entity('submission_checkboxes')
@Index(['checkboxField', 'submission'])
export class SubmissionCheckboxes {
    @PrimaryGeneratedColumn('uuid')
    id : string

    // Relations
    @ManyToOne(() => Checkbox_fields, (cf) => cf.submissionCheckboxes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'checkbox_field' })
    checkboxField: Checkbox_fields;

    @ManyToOne(() => CheckboxFieldChoices, (cfc) => cfc.submission_checkboxes, { onDelete: "CASCADE" })
    fieldChoices: CheckboxFieldChoices

    @ManyToOne(() => Submissions, (sub) => sub.checkboxes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'submission' })
    submission: Submissions;
}