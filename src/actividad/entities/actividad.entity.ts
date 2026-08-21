import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { InformeGc } from '../../informe_gc/entities/informe_gc.entity';

@Entity('actividad')
export class Actividad {
  @PrimaryGeneratedColumn()
  id_actividad: number;

  @Column({ length: 100 })
  competencia: string;

  @Column({ length: 50 })
  ficha: string;

  @Column({ length: 250 })
  resultado: string;

  @Column('date')
  fecha_inicio: Date;

  @Column('date')
  fecha_fin: Date;

  @Column({ type: 'simple-enum', enum: ['Aplica', 'No_Aplica'], default: 'Aplica' })
  estado: string;

  @ManyToOne(() => InformeGc, { eager: true })
  @JoinColumn({ name: 'id_gc' })
  informe_gc: InformeGc;
}