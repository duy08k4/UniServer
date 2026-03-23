import { MainRole } from "src/enums/enums";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Classes } from "./classes.en";
import { Progresses } from "./progresses.en";
import { Milestones } from "./milestones.en";
import { Notifications } from "./notifications.en";
import { Forms } from "./forms.en";
import { ScoreForms } from "./score_forms.en";
import { ScoreFormRows } from "./score_form_rows.en";
import { ScoreFormCells } from "./score_form_cells.en";
import { Submissions } from "./submissions.en";
import { ClassMembers } from "./class_members.en";

@Entity('users')
export class Users {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column('varchar')
    supabase_id: string

    @Column('varchar')
    full_name: string

    @Column({ type: 'varchar', unique: true })
    email: string

    @Column('boolean', { default: false })
    is_banned: boolean

    @Column('boolean', { default: false })
    is_deleted: boolean

    @Column({ type: 'enum', enum: MainRole, default: MainRole.USER })
    role: MainRole

    @Column('varchar', { nullable: true })
    phone_number: string

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    // Relations
    @OneToMany(() => Classes, (cls) => cls.createdBy, { cascade: true })
    createdClasses: Classes[];

    @OneToMany(() => Progresses, (prog) => prog.createdBy, { cascade: true })
    createdProgresses: Progresses[];

    @OneToMany(() => Milestones, (milestone) => milestone.createdBy, { cascade: true })
    createdMilestones: Milestones[];

    @OneToMany(() => Notifications, (notif) => notif.createdBy, { cascade: true })
    notifications: Notifications[];

    @OneToMany(() => Forms, (form) => form.createdBy, { cascade: true })
    forms: Forms[];

    @OneToMany(() => ScoreForms, (sf) => sf.createdBy, { cascade: true })
    scoreForms: ScoreForms[];

    @OneToMany(() => ScoreFormRows, (row) => row.student, { cascade: true })
    scoreFormRows: ScoreFormRows[];

    @OneToMany(() => ScoreFormCells, (cell) => cell.updatedBy, { cascade: true })
    updatedCells: ScoreFormCells[];

    @OneToMany(() => Submissions, (sub) => sub.user, { cascade: true })
    submissions: Submissions[];

    @OneToMany(() => ClassMembers, (members) => members.user, { cascade: true })
    classMember: ClassMembers[]
}