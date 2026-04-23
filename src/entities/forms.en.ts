import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Milestones } from "./milestones.en";
import { Users } from "./user.en";
import { Fields } from "./fields.en";
import { Checkbox_fields } from "./checkbox_fields.en";
import { Submissions } from "./submissions.en";
import { Classes } from "./classes.en";
import { Notifications } from "./notifications.en";

@Entity('forms')
@Index(['label', 'milestone', 'createdBy', 'is_auto_open', 'is_auto_close', 'is_deleted', 'is_stopped'])
export class Forms {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'boolean', default: false })
    is_join_form : boolean
    
    @Column({ type: 'varchar' })
    label : string
    
    @Column({ type: 'varchar', nullable: true, default: null })
    description : string | null
    
    @Column({ type: 'int' })
    field_count : number
    
    @Column({ type: 'boolean', default: false })
    is_auto_open : boolean
    
    @Column({ type: 'boolean', default: false })
    is_auto_close : boolean

    @Column({ type: 'boolean', default: false })
    is_deleted: boolean

    @Column({ type: 'boolean', default: false })
    is_stopped: boolean
    
    @Column({ type: 'timestamptz', nullable: true, default: null })
    open_at : Date | null
    
    @Column({ type: 'timestamptz', nullable: true, default: null })
    close_at : Date | null
    
    @UpdateDateColumn({ type: 'timestamptz', nullable: true })
    update_at : Date
    
    @CreateDateColumn({ type: 'timestamptz', nullable: true })
    created_at : Date

    // Relations
    @ManyToOne(() => Milestones, (milestone) => milestone.forms, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'milestone' })
    milestone: Milestones | null

    @ManyToMany(() => Notifications, (noti) => noti.forms)
    notifications: Notifications[]

    @ManyToOne(() => Users, (user) => user.forms, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    createdBy: Users;

    @ManyToOne(() => Classes, (classes) => classes.forms, { onDelete: 'CASCADE' } )
    @JoinColumn({ name: 'class' })
    class: Classes

    @OneToMany(() => Fields, (field) => field.form, { cascade: true })
    fields: Fields[];

    @OneToMany(() => Checkbox_fields, (checkboxField) => checkboxField.form, { cascade: true })
    checkboxFields: Checkbox_fields[];

    @OneToMany(() => Submissions, (submission) => submission.form, { cascade: true })
    submissions: Submissions[];
}