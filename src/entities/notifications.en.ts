import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Classes } from "./classes.en";
import { Users } from "./user.en";
import { Milestones } from "./milestones.en";
import { Forms } from "./forms.en";

@Entity('notifications')
@Index(['class', 'createdBy'])
export class Notifications {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar' })
    title: string

    @Column({ type: 'varchar' })
    body: string

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    // Relations
    @ManyToOne(() => Classes, (cls) => cls.notifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class' })
    class: Classes;

    @ManyToOne(() => Users, (user) => user.notifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    createdBy: Users;

    @ManyToOne(() => Milestones, (milestone) => milestone.notifications, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'milestone' })
    milestone: Milestones | null

    @OneToMany(() => Forms, (form) => form.notification, { cascade: true })
    forms: Forms[]
}