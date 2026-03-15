import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

// Enum
import { Role } from "src/enums/enums";

// Entities
import { UserCases } from "./use_cases.en";

@Entity('use_case_permissions')
export class UserCasePermission {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', enum: Role })
    role: string

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

    @ManyToOne(() => UserCases, (usecase) => usecase.usecase_permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usecase_id' })
    usecase_id: UserCases
}