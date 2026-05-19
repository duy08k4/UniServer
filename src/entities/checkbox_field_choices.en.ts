import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Checkbox_fields } from "./checkbox_fields.en";
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
    @ManyToOne(() => Checkbox_fields, (cf) => cf.checkbox_field_choices, { onDelete: "CASCADE" } )
    @JoinColumn({ name: "checkbox_field" })
    checkbox_field: Checkbox_fields

    @OneToMany(() => SubmissionCheckboxes, (sc) => sc.fieldChoices, { cascade: true })
    submission_checkboxes: SubmissionCheckboxes[]
}