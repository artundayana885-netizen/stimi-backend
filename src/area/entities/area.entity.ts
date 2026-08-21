import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Sede } from '../../sede/entities/sede.entity';

@Entity('area')
export class Area {
  @PrimaryGeneratedColumn()
  id_area: number;

  @Column('varchar', { length: 50 })
  nombre: string;

  @ManyToOne(() => Sede, { eager: true })
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;
}