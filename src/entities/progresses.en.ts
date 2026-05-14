import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./user.en";
import { Classes } from "./classes.en";
import { Milestones } from "./milestones.en";
import { Exclude } from "class-transformer";

@Entity('progresses')
export class Progresses {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', nullable: true })
    label: string

    @Column({ type: 'varchar', nullable: true  })
    description: string

    @Column({ type: 'boolean', default: false })
    is_deleted: boolean
    
    @Column({ type: 'boolean', default: false })
    is_submitted: boolean // Send to system admin not not

    @Column({ type: 'boolean', default: false })
    is_banned: boolean

    @Column({ type: 'boolean', default: false }) // created_approval = false => Do not create a submission
    created_approval: boolean

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    // Relations
    @ManyToOne(() => Users, (user) => user.createdProgresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'created_by' })
    createdBy: Users;

    @OneToOne(() => Classes, (cls) => cls.progress, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class' })
    class: Classes;

    @OneToMany(() => Milestones, (milestone) => milestone.progress, { cascade: true })
    milestones: Milestones[];
}