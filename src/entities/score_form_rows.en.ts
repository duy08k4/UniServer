import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./user.en";
import { ScoreForms } from "./score_forms.en";
import { ScoreFormCells } from "./score_form_cells.en";

@Entity('score_form_rows')
@Index(['student', 'scoreForm'])
export class ScoreFormRows {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'int' })
    index: number

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    // Relations
    @ManyToOne(() => Users, (user) => user.scoreFormRows, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'student' })
    student: Users;

    @ManyToOne(() => ScoreForms, (sf) => sf.rows, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'score_form' })
    scoreForm: ScoreForms;

    @OneToMany(() => ScoreFormCells, (cell) => cell.row, { cascade: true })
    cells: ScoreFormCells[];
}