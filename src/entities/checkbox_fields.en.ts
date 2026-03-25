import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Enum
import { Field_Type } from "src/enums/enums";
import { Forms } from "./forms.en";
import { SubmissionCheckboxes } from "./submission_checkboxes.en";

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
    description : string
    
    @Column({ type: 'enum', enum: Field_Type, default: Field_Type.CHECKBOX })
    input_type:  Field_Type.CHECKBOX
    
    @Column({ type: 'int' })
    choice_count : number
    
    @Column({ type: 'boolean', default: false })
    is_required : boolean
    
    @Column({ type: 'boolean', default: false })
    is_multiple : boolean
    
    @CreateDateColumn({ type: 'timestamptz' })
    created_at : Date

    @UpdateDateColumn({ type: 'timestamptz' })
    update_at : Date

    // Relations
    @ManyToOne(() => Forms, (form) => form.checkboxFields, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'form' })
    form: Forms;

    @OneToOne(() => SubmissionCheckboxes, (sc) => sc.checkboxField)
    submissionCheckbox: SubmissionCheckboxes;
}