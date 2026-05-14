import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ColumnAllowedRole, ColumnLabel, ColumnType } from "src/enums/enums";
import { ScoreForms } from "./score_forms.en";
import { ScoreFormCells } from "./score_form_cells.en";

@Entity('score_form_columns')
@Index(['scoreForm'])
export class ScoreFormColumns {
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column({ type: "varchar" })
    label: string

    @Column({ type: 'int' })
    index: number

    @Column({type: 'varchar', nullable: true, default: null })
    formula_content: string | null

    @Column({ type: 'enum', enum: ColumnAllowedRole, nullable: true, default: null })
    allowed_role: ColumnAllowedRole | null

    @Column({ type: 'enum', enum: ColumnType, default: ColumnType.NORMAL })
    column_type: ColumnType

    @Column({ type: 'enum', enum: ColumnLabel, nullable: true, default: null })
    column_label: ColumnLabel | null

    // Relations
    @ManyToOne(() => ScoreForms, (sf) => sf.columns, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'score_form' })
    scoreForm: ScoreForms;

    @OneToMany(() => ScoreFormCells, (cell) => cell.column, { cascade: true })
    cells: ScoreFormCells[];
}