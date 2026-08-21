import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Persona } from '../../persona/entities/persona.entity';

@Entity('notificacion')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id_notificacion: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column('text')
  informacion: string;

  @Column('boolean', { default: false })
  leida: boolean;

  @ManyToOne(() => Persona, { eager: true })
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;
}