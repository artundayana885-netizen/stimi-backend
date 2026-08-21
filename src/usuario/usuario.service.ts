import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Persona } from '../persona/entities/persona.entity';
import { Area } from '../area/entities/area.entity';
import { Rol } from '../rol/entities/rol.entity';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,

    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,

    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async register(payload: any): Promise<Usuario> {
    const { name, contractNumber, siif, arl, area, email, password } = payload;

    const existingUser = await this.usuarioRepository.findOne({ where: { username: email } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    let userArea = await this.areaRepository.findOne({ where: { nombre: area } });
    if (!userArea && area) {
      userArea = this.areaRepository.create({ nombre: area });
      userArea = await this.areaRepository.save(userArea);
    }

    const isCoordinador = email.toLowerCase().includes('coordinador');
    const rolName = isCoordinador ? 'Coordinador' : 'Instructor';

    let userRol = await this.rolRepository.findOne({ where: { nombre_rol: rolName } });
    if (!userRol) {
      userRol = this.rolRepository.create({ nombre_rol: rolName });
      userRol = await this.rolRepository.save(userRol);
    }

    const persona = this.personaRepository.create({
      nombre: name,
      identificacion: contractNumber || Math.random().toString().slice(2, 12),
      correo: email,
      telefono: siif || '3000000000',
      area: userArea || undefined,
    });
    const savedPersona = await this.personaRepository.save(persona);

    const hashedPassword = bcrypt.hashSync(password, 10);
    const usuario = this.usuarioRepository.create({
      username: email,
      password: hashedPassword,
      estado: isCoordinador ? 'Activo' : 'Pendiente',
      persona: savedPersona,
      rol: userRol,
    });

    return await this.usuarioRepository.save(usuario);
  }

  async login(payload: any): Promise<any> {
    const { email, password } = payload;

    const usuario = await this.usuarioRepository.findOne({
      where: { username: email },
      relations: { persona: true, rol: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }

    const isPasswordValid = bcrypt.compareSync(password, usuario.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }

    if (usuario.estado === 'Pendiente') {
      throw new UnauthorizedException('Tu solicitud de registro aún no ha sido aceptada por el coordinador');
    }

    if (usuario.estado === 'Inactivo') {
      throw new UnauthorizedException('La cuenta de usuario se encuentra inactiva');
    }

    return {
      name: usuario.persona?.nombre || 'Usuario',
      email: usuario.username,
      role: usuario.rol?.nombre_rol?.toLowerCase() || 'instructor',
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({
      where: { username: email },
    });

    if (!usuario) {
      throw new UnauthorizedException('El correo electrónico no está registrado');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    usuario.recovery_code = code;
    await this.usuarioRepository.save(usuario);

    const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
    const isGmail = mailHost.includes('gmail.com');

    const transporterConfig: any = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: process.env.MAIL_USER || '',
            pass: process.env.MAIL_PASS || '',
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {
          host: mailHost,
          port: Number(process.env.MAIL_PORT) || 587,
          secure: process.env.MAIL_SECURE === 'true',
          auth: {
            user: process.env.MAIL_USER || '',
            pass: process.env.MAIL_PASS || '',
          },
          tls: {
            rejectUnauthorized: false,
          },
        };

    const transporter = nodemailer.createTransport(transporterConfig);

    console.log(`[RECOVERY CODE] Enviando correo de recuperación a ${email}`);

    const mailSender = process.env.MAIL_USER || 'no-reply@sena.edu.co';

    try {
      await transporter.sendMail({
        from: `"SITMI Soporte" <${mailSender}>`,
        to: email,
        subject: 'Código de recuperación de contraseña - SITMI',
        text: `Tu código de recuperación es: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff; border-radius: 8px; font-weight: bold; font-size: 20px;">SENA SITMI</div>
            </div>
            <h2 style="color: #1a202c; text-align: center;">Recuperación de Contraseña</h2>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5; text-align: center;">
              Has solicitado restablecer tu contraseña. Utiliza el siguiente código de verificación de 6 dígitos:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #16a34a; background-color: #f0fdf4; padding: 12px 24px; border: 1px dashed #16a34a; border-radius: 8px;">
                ${code}
              </span>
            </div>
            <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 24px;">
              Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
            </p>
          </div>
        `,
      });
      console.log(`[EMAIL] Correo de recuperación enviado exitosamente a ${email}`);
   } catch (mailError: any)  {
      console.error(`[EMAIL ERROR] Fallo al enviar correo a ${email}:`, mailError.message);
      throw new InternalServerErrorException('Error al enviar el correo de recuperación. Revisa las credenciales de correo en el archivo .env.');
    }
  }

  async resetPassword(payload: any): Promise<void> {
    const { email, code, newPassword } = payload;

    const usuario = await this.usuarioRepository.findOne({
      where: { username: email },
    });

    if (!usuario) {
      throw new UnauthorizedException('El correo electrónico no está registrado');
    }

    if (!usuario.recovery_code || usuario.recovery_code !== code.trim()) {
      throw new UnauthorizedException('El código de recuperación es incorrecto');
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    usuario.password = hashedPassword;
    usuario.recovery_code = null;
    await this.usuarioRepository.save(usuario);
  }

  async changePassword(payload: any): Promise<void> {
    const { email, currentPassword, newPassword } = payload;

    const usuario = await this.usuarioRepository.findOne({
      where: { username: email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isPasswordValid = bcrypt.compareSync(currentPassword, usuario.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    usuario.password = hashedPassword;
    await this.usuarioRepository.save(usuario);
  }

  async getAllUsers(): Promise<Usuario[]> {
    return await this.usuarioRepository.find({
      relations: { persona: true, rol: true },
    });
  }

  async toggleUserStatus(id: number): Promise<Usuario> {
    const user = await this.usuarioRepository.findOne({ where: { id_usuario: id } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    user.estado = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
    return await this.usuarioRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: { persona: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const personaId = user.persona?.id_persona;
    await this.usuarioRepository.remove(user);
    if (personaId) {
      await this.personaRepository.delete(personaId);
    }
  }

  async changeUserRole(id: number, roleName: string): Promise<Usuario> {
    const user = await this.usuarioRepository.findOne({ where: { id_usuario: id } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    let userRol = await this.rolRepository.findOne({ where: { nombre_rol: roleName } });
    if (!userRol) {
      userRol = this.rolRepository.create({ nombre_rol: roleName });
      userRol = await this.rolRepository.save(userRol);
    }

    user.rol = userRol;
    if (user.estado === 'Pendiente') {
      user.estado = 'Activo';
    }
    return await this.usuarioRepository.save(user);
  }
}