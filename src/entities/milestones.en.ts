import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./user.en";
import { Progresses } from "./progresses.en";
import { Forms } from "./forms.en";
import { ScoreForms } from "./score_forms.en";

@Entity('milestones')
export class Milestones {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'int' })
    index: number

    @Column({ type: 'varchar', nullable: true, default: true })
    label: string

    @Column({ type: 'varchar', nullable: true, default: true })
    description: string

    @Column({ type: 'timestamptz' })
    updated_at: Date

    @Column({ type: 'timestamptz' })
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
}