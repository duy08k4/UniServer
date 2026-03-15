import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

// Enum
import { PriorityCase } from "src/enums/enums";

// Entities
import { UserCasePermission } from "./use_case_permissions.en";

@Entity('use_cases')
export class UserCases {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  module: string

  @Column({ type: 'varchar' })
  uc_name: string

  @Column({ type: 'varchar' })
  description: string

  @Column({ type: 'varchar', enum: PriorityCase })
  priority: string

  @OneToMany(() => UserCasePermission, (usecase_permission) => usecase_permission.usecase_id)
  usecase_permissions: UserCasePermission[]
}