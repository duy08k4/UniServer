import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Enum
import { Role } from "src/enums/enums";
import { Classes } from "./classes.en";
import { Users } from "./user.en";

@Entity('class_members')
@Check(`"role" IN ('${Role.ROOMADMIN}', '${Role.STUDENT}', '${Role.LECTURER}')`)
@Index(['class', 'user'], { unique: true })
export class ClassMembers {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'enum', enum: Role, default: Role.STUDENT })
    role : Role
    
    @Column({ type: 'boolean', default: false })
    is_committee_member : boolean
    
    @Column({ type: 'boolean', default: false })
    can_create_notifications : boolean
    
    @Column({ type: 'boolean', default: false })
    can_create_forms : boolean
    
    @Column({ type: 'boolean', default: false })
    can_create_score_forms : boolean
    
    @Column({ type: 'timestamptz' })
    joined_at : Date
    
    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at : Date

    // Relations
    @ManyToOne(() => Classes, (cls) => cls.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class' })
    class: Classes;

    @ManyToOne(() => Users, (user) => user.classMember, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Users
}