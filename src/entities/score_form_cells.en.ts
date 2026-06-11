import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./user.en";
import { ScoreFormRows } from "./score_form_rows.en";
import { ScoreFormColumns } from "./score_form_columns.en";
import { ScoreForms } from "./score_forms.en";

@Entity('score_form_cells')
@Index(['row', 'column'], { unique: true })
@Index(['updatedBy', 'row', 'column'])
export class ScoreFormCells {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: 'varchar', nullable: true })
    value : string

    @UpdateDateColumn({ type: 'timestamptz', update: false })
    updated_at : Date

    // Relations
    @ManyToOne(() => Users, (user) => user.updatedCells, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'updated_by' })
    updatedBy: Users;

    @ManyToOne(() => ScoreForms, (scoreForm) => scoreForm.cell , { onDelete: 'CASCADE' })
    @JoinColumn({name: 'score_form' })
    score_form: ScoreForms;

    @ManyToOne(() => ScoreFormRows, (row) => row.cells, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'row' })
    row: ScoreFormRows;

    @ManyToOne(() => ScoreFormColumns, (col) => col.cells, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'column' })
    column: ScoreFormColumns;
}