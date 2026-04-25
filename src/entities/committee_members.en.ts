import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CommitteeRole } from "src/enums/enums";
import { Committees } from "./committees.en";
import { Users } from "./user.en";

@Entity('committee_members')
@Index(['committee', 'user'], { unique: true })
export class CommitteeMembers {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'enum', enum: CommitteeRole })
    role: CommitteeRole

    // Relations
    @ManyToOne(() => Committees, (committee) => committee.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'committee_id' })
    committee: Committees

    @ManyToOne(() => Users, (user) => user.committeeMembers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Users
}
