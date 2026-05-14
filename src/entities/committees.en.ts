import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Classes } from "./classes.en";
import { Milestones } from "./milestones.en";
import { CommitteeMembers } from "./committee_members.en";

@Entity('committees')
@Index(['class'], { unique: true })
export class Committees {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    // Relations
    @ManyToOne(() => Classes, (cls) => cls.committees, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class_id' })
    class: Classes

    @ManyToOne(() => Milestones, (milestone) => milestone.committees, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'milestone_id' })
    milestone: Milestones

    @OneToMany(() => CommitteeMembers, (member) => member.committee, { cascade: true })
    members: CommitteeMembers[]
}
