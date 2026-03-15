import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Enum
import { ScoreForm_Type } from "src/enums/enums";
import { Users } from "./user.en";
import { Milestones } from "./milestones.en";
import { CcoreFormColumns } from "./score_form_columns.en";
import { ScoreFormRows } from "./score_form_rows.en";

@Entity('score_forms')
export class ScoreForms {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'varchar', enum: ScoreForm_Type, default: ScoreForm_Type.OTHERS })
    score_form_type : ScoreForm_Type
    
    @Column({ type: 'varchar' })
    label : string
    
    @Column({ type: 'varchar', nullable: true, default: null })
    description : string
    
    @Column({ type: 'int' })
    field_count : number
    
    @Column({ type: 'boolean', default: false })
    is_auto_open : boolean
    
    @Column({ type: 'boolean', default: false })
    is_auto_close : boolean
    
    @Column({ type: 'boolean', default: true })
    email_notification_enabled : boolean
    
    @Column({ type: 'timestamptz' })
    open_at : Date
    
    @Column({ type: 'timestamptz' })
    close_at : Date
    
    @Column({ type: 'timestamptz' })
    created_at : Date
    
    @UpdateDateColumn({ type: 'timestamptz' })
    update_at : Date

    // Relations
    @ManyToOne(() => Users, (user) => user.scoreForms, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    createdBy: Users;

    @ManyToOne(() => Milestones, (milestone) => milestone.scoreForms, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'milestone' })
    milestone: Milestones;

    @OneToMany(() => CcoreFormColumns, (col) => col.scoreForm, { cascade: true })
    columns: CcoreFormColumns[];

    @OneToMany(() => ScoreFormRows, (row) => row.scoreForm, { cascade: true })
    rows: ScoreFormRows[];
}