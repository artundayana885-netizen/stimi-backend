import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { CentroFormacion } from '../../centro-formacion/entities/centro-formacion.entity';

@Entity('sede')
export class Sede {
  @PrimaryGeneratedColumn()
  id_sede: number;

  @Column('varchar', { length: 100 })
  nombre_sede: string;

  @ManyToOne(() => CentroFormacion, { eager: true })
  @JoinColumn({ name: 'id_centro' })
  centro: CentroFormacion;
}