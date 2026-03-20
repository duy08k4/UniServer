import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ScoreForms } from "./score_forms.en";
import { ScoreFormCells } from "./score_form_cells.en";

@Entity('score_form_columns')
@Index(['scoreForm'])
export class ScoreFormColumns {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: "varchar" })
    label: string

    // Relations
    @ManyToOne(() => ScoreForms, (sf) => sf.columns, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'score_form' })
    scoreForm: ScoreForms;

    @OneToMany(() => ScoreFormCells, (cell) => cell.column, { cascade: true })
    cells: ScoreFormCells[];
}