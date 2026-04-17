import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Enum
import { Field_Type } from "src/enums/enums";
import { Forms } from "./forms.en";
import { SubmissionCheckboxes } from "./submission_checkboxes.en";
import { CheckboxFieldChoices } from "./checkbox_field_choices.en";

@Entity('checkbox_fields')
@Index(['form'])
export class Checkbox_fields {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'int' })
    index : number
    
    @Column({ type: 'varchar' })
    label : string 
    
    @Column({ type: 'varchar', nullable: true, default: null })
    description : string | null
    
    @Column({ type: 'enum', enum: Field_Type, default: Field_Type.CHECKBOX })
    input_type:  Field_Type.CHECKBOX
    
    @Column({ type: 'int' })
    choice_count : number
    
    @Column({ type: 'boolean', default: false })
    is_required : boolean
    
    @Column({ type: 'boolean', default: false })
    is_multiple : boolean
    
    @Column({ type: 'boolean', default: false })
    is_deleted : boolean
    
    @UpdateDateColumn({ type: 'timestamptz' })
    update_at : Date

    @CreateDateColumn({ type: 'timestamptz' })
    created_at : Date

    // Relations
    @ManyToOne(() => Forms, (form) => form.checkboxFields, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'form' })
    form: Forms;

    @OneToMany(() => SubmissionCheckboxes, (sc) => sc.checkboxField, { cascade: true })
    submissionCheckboxes: SubmissionCheckboxes[];

    @OneToMany(() => CheckboxFieldChoices, (cfc) => cfc.checkbox_field, { cascade: true })
    checkbox_field_choices: CheckboxFieldChoices[]
}