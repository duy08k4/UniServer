import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Classes } from "./classes.en";
import { Users } from "./user.en";

@Entity('notifications')
export class Notifications {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar' })
    title: string

    @Column({ type: 'varchar' })
    body: string

    @Column({ type: 'boolean', default: false })
    email_notification_enabled: boolean

    @Column({ type: 'timestamptz' })
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
}