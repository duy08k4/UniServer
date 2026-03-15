import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./user.en";
import { Classes } from "./classes.en";
import { Milestones } from "./milestones.en";

@Entity('progresses')
export class Progresses {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'varchar', nullable: true, default: true })
    label : string

    @Column({ type: 'varchar', nullable: true, default: true })
    description : string

    @Column({ type: 'timestamptz' })
    created_at : Date
    
    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at : Date

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