import { Check, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Enum
import { Role } from "src/enums/enums";
import { Classes } from "./classes.en";

@Entity('class_members')
@Check(`"role" IN ('${Role.ROOMADMIN}', '${Role.STUDENT}', '${Role.LECTURER}')`)
export class ClassMembers {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'varchar', enum: Role, default: Role.STUDENT })
    role : Role
    
    @Column({ type: 'varchar', unique: true })
    student_code : string
    
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
    @OneToOne(() => Classes, (cls) => cls.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class' })
    class: Classes;
}