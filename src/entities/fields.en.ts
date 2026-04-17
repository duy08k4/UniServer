import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Enum
import { Field_Label, Field_Type, Unit } from "src/enums/enums";
import { Forms } from "./forms.en";
import { SubmissionAnswers } from "./submission_answers.en";

@Entity('fields')
@Index(['form'])
export class Fields {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'int' })
    index : number
    
    @Column({ type: 'enum', enum: Field_Label, default: Field_Label.NULL })
    label : Field_Label

    @Column({ type: 'varchar' })
    title : string
    
    @Column({ type: 'varchar', nullable: true, default: null })
    description : string | null
    
    @Column({ type: 'enum', enum: Field_Type, default: Field_Type.STRING })
    input_type : Field_Type
    
    @Column({ type: 'boolean', default: false })
    is_required : boolean

    @Column({ type: "enum", enum: Unit })
    unit: Unit
    
    @Column({ type: 'int', default: 20 })
    max_attempts : number
    
    @Column({ type: 'int', default: 1 })
    min_attempts : number
    
    @Column({ type: 'boolean', default: false })
    is_deleted : boolean
    
    @UpdateDateColumn({ type: 'timestamptz' })
    update_at : Date
    
    @CreateDateColumn({ type: 'timestamptz' })
    created_at : Date

    // Relations
    @ManyToOne(() => Forms, (form) => form.fields, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'form' })
    form: Forms;

    @OneToMany(() => SubmissionAnswers, (answer) => answer.field)
    answer: SubmissionAnswers[];
}