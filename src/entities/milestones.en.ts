import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./user.en";
import { Progresses } from "./progresses.en";
import { Forms } from "./forms.en";
import { ScoreForms } from "./score_forms.en";
import { Notifications } from "./notifications.en";
import { Topics } from "./topics.en";

@Entity('milestones')
@Index(['progress', 'label', 'createdBy', 'is_deleted', 'is_stopped'])
export class Milestones {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'int' })
    index: number

    @Column({ type: 'varchar', default: true })
    label: string

    @Column({ type: 'varchar', nullable: true })
    description: string

    @Column({ type: 'boolean', default: false })
    is_deleted: boolean

    @Column({ type: 'boolean', default: false })
    is_stopped: boolean

    @Column({ type: 'boolean', default: false })
    is_registration_milestone: boolean

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date

    // Relations
    @ManyToOne(() => Users, (user) => user.createdMilestones, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    createdBy: Users;

    @ManyToOne(() => Progresses, (progress) => progress.milestones, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'progress' })
    progress: Progresses;

    @OneToMany(() => Forms, (form) => form.milestone, { cascade: true })
    forms: Forms[];

    @OneToMany(() => ScoreForms, (sf) => sf.milestone, { cascade: true })
    scoreForms: ScoreForms[];

    @OneToMany(() => Notifications, (n) => n.milestone, { cascade: true })
    notifications: Notifications[]

    @OneToMany(() => Topics, (topic) => topic.milestone, { cascade: true })
    topics: Topics[]
}