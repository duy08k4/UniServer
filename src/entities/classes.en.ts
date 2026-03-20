import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./user.en";
import { ClassMembers } from "./class_members.en";
import { Progresses } from "./progresses.en";
import { Notifications } from "./notifications.en";

@Entity('classes')
export class Classes {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', nullable: true, default: null })
    join_code: string

    @Column({ type: 'varchar', default: "Lớp học mới" })
    label: string

    @Column({ type: "varchar", nullable: true, default: null })
    description: string

    @Column({ type: 'varchar', nullable: false })
    subject: string

    @Column({ type: 'boolean', default: false })
    created_approval: boolean

    @Column({ type: 'boolean', default: false })
    required_approval: boolean

    @Column({ type: 'boolean', default: false })
    required_join_form: boolean

    @Column({ type: 'boolean', default: false })
    is_deleted: boolean

    @Column({ type: 'boolean', default: false })
    is_banned: boolean

    @Column({ type: 'timestamptz' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    // Relations
    @ManyToOne(() => Users, (user) => user.createdClasses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    createdBy: Users;

    @OneToMany(() => ClassMembers, (member) => member.class, { cascade: true })
    members: ClassMembers[];

    @OneToOne(() => Progresses, (progress) => progress.class, { cascade: true })
    progress: Progresses;

    @OneToMany(() => Notifications, (notification) => notification.class, { cascade: true })
    notifications: Notifications[];
}