import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";

// Enum
import { PriorityCase } from "src/enums/enums";

// Entities
import { UseCasePermission } from "./use_case_permissions.en";

@Entity('use_cases')
@Index(['module'])
export class UseCases {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  module: string

  @Column({ type: 'varchar' })
  uc_name: string

  @Column({ type: 'varchar' })
  description: string

  @Column({ type: 'enum', enum: PriorityCase, default: PriorityCase.M_HAVE })
  priority: PriorityCase

  @OneToMany(() => UseCasePermission, (usecase_permission) => usecase_permission.usecase_id)
  usecase_permissions: UseCasePermission[]
}