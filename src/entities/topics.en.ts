import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ThesisType, TopicStatus } from "src/enums/enums";
import { Users } from "./user.en";
import { Milestones } from "./milestones.en";

@Entity('topics')
@Index(['milestone', 'student'], { unique: true })
export class Topics {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar' })
    title: string

    @Column({ type: 'varchar', nullable: true, default: null })
    description: string

    @Column({ type: 'enum', enum: ThesisType })
    thesis_type: ThesisType

    @Column({ type: 'enum', enum: TopicStatus, default: TopicStatus.DRAFT })
    status: TopicStatus

    @Column({ type: 'varchar', nullable: true, default: null })
    rejection_note: string | null

    @Column({ type: 'varchar', nullable: true, default: null })
    outline_file_url: string | null

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    // Relations
    @ManyToOne(() => Milestones, (milestone) => milestone.topics, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'milestone_id' })
    milestone: Milestones

    @ManyToOne(() => Users, (user) => user.topics, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'student_id' })
    student: Users

    @ManyToOne(() => Users, (user) => user.supervisedTopics, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'supervisor_id' })
    supervisor: Users
}
