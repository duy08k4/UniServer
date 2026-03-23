import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

// Enum
import { Role } from "src/enums/enums";

// Entities
import { UseCases } from "./use_cases.en";

@Entity('use_case_permissions')
@Index(['role', 'usecase'])
export class UseCasePermission {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'enum', enum: Role })
    role: Role

    @Column({ type: 'boolean', default: true })
    can_view: boolean

    @Column({ type: 'boolean', default: false })
    can_create: boolean

    @Column({ type: 'boolean', default: false })
    can_edit: boolean

    @Column({ type: 'boolean', default: false })
    can_delete: boolean

    @Column({ type: 'boolean', default: false })
    can_approve: boolean

    @ManyToOne(() => UseCases, (usecase) => usecase.usecase_permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usecase' })
    usecase: UseCases
}