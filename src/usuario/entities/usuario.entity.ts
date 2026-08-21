import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Persona } from '../../persona/entities/persona.entity';
import { Rol } from '../../rol/entities/rol.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column('varchar', { length: 60, unique: true })
  username: string;

  @Column('varchar', { length: 255 })
  password: string; // guardar SIEMPRE el hash (bcrypt), nunca texto plano

  @Column({ type: 'simple-enum', enum: ['Activo', 'Inactivo', 'Pendiente'], default: 'Pendiente' })
  estado: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;

  @Column('varchar', { length: 10, nullable: true })
  recovery_code: string;

  @OneToOne(() => Persona, { eager: true })
  @JoinColumn({ name: 'id_persona' })
  persona: Persona; // 1:1 -> cada persona tiene un único usuario

  @ManyToOne(() => Rol, { eager: true })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol; // si un usuario puede tener VARIOS roles, cambia esto por una tabla usuario_rol (N:M)
}