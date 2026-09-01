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

  private getMailTransporter() {
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

    return nodemailer.createTransport(transporterConfig);
  }

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

    // Todo registro público queda siempre como Instructor pendiente de
    // aprobación. El rol de Coordinador solo puede asignarlo otro
    // coordinador ya autenticado, vía changeUserRole(). Nunca se infiere
    // del texto del correo electrónico: eso permitía que cualquiera se
    // auto-asignara el rol de coordinador con solo poner "coordinador"
    // en su correo al registrarse.
    const rolName = 'Instructor';

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
      estado: 'Pendiente',
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
      id: usuario.id_usuario,
      name: usuario.persona?.nombre || 'Usuario',
      email: usuario.username,
      role: usuario.rol?.nombre_rol?.toLowerCase() || 'instructor',
      telefono: usuario.persona?.telefono || '',
      area: usuario.persona?.area?.nombre || '',
      centro: usuario.persona?.area?.sede?.centro?.nombre_centro || '',
    };
  }

  /**
   * Actualiza el nombre, correo y/o teléfono del usuario (self-service,
   * desde "Perfil de usuario" en Ajustes). Antes esto solo se guardaba en
   * localStorage del navegador, así que se perdía al cambiar de
   * dispositivo o borrar caché, y nunca quedaba realmente en la base de
   * datos. El rol y el área/centro de formación NO se pueden cambiar aquí
   * a propósito: esos los asigna el coordinador desde Gestión de Usuarios.
   */
  async updateProfile(id: number, payload: { nombre?: string; correo?: string; telefono?: string }) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: { persona: true, rol: true },
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const nuevoCorreo = payload.correo?.trim();
    if (nuevoCorreo && nuevoCorreo !== usuario.persona.correo) {
      const yaExiste = await this.personaRepository.findOne({ where: { correo: nuevoCorreo } });
      if (yaExiste && yaExiste.id_persona !== usuario.persona.id_persona) {
        throw new ConflictException('Ese correo ya está en uso por otra cuenta');
      }
      usuario.persona.correo = nuevoCorreo;
      // El login busca por `username`, que se mantiene igual al correo.
      usuario.username = nuevoCorreo;
    }

    if (payload.nombre?.trim()) {
      usuario.persona.nombre = payload.nombre.trim();
    }
    if (payload.telefono?.trim()) {
      usuario.persona.telefono = payload.telefono.trim();
    }

    await this.personaRepository.save(usuario.persona);
    await this.usuarioRepository.save(usuario);

    return {
      id: usuario.id_usuario,
      name: usuario.persona.nombre,
      email: usuario.username,
      role: usuario.rol?.nombre_rol?.toLowerCase() || 'instructor',
      telefono: usuario.persona.telefono || '',
      area: usuario.persona.area?.nombre || '',
      centro: usuario.persona.area?.sede?.centro?.nombre_centro || '',
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

    const transporter = this.getMailTransporter();

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

  async toggleUserStatus(id: number): Promise<{ user: Usuario; emailSent: boolean }> {
    const user = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: { persona: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    user.estado = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const savedUser = await this.usuarioRepository.save(user);

    const toEmail = user.persona?.correo || savedUser.username;
    const nombre = user.persona?.nombre;

    let emailSent: boolean;
    if (savedUser.estado === 'Activo') {
      emailSent = await this.sendAccountNotification(
        toEmail,
        nombre,
        'Tu cuenta fue reactivada - SITMI',
        'Tu cuenta fue reactivada',
        'el coordinador reactivó tu cuenta en el Portal SITMI. Ya puedes volver a iniciar sesión.',
      );
    } else {
      emailSent = await this.sendAccountNotification(
        toEmail,
        nombre,
        'Tu cuenta fue desactivada - SITMI',
        'Tu cuenta fue desactivada',
        'el coordinador desactivó tu cuenta en el Portal SITMI. Si crees que esto es un error, contacta al coordinador.',
      );
    }

    return { user: savedUser, emailSent };
  }

  async deleteUser(id: number): Promise<{ emailSent: boolean }> {
    const user = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: { persona: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const toEmail = user.persona?.correo || user.username;
    const nombre = user.persona?.nombre;
    // Si estaba pendiente, esto es un rechazo de solicitud de registro,
    // no la eliminación de una cuenta ya activa: el correo debe decir lo que corresponde.
    const eraPendiente = user.estado === 'Pendiente';

    const personaId = user.persona?.id_persona;
    await this.usuarioRepository.remove(user);
    if (personaId) {
      await this.personaRepository.delete(personaId);
    }

    let emailSent: boolean;
    if (eraPendiente) {
      emailSent = await this.sendAccountNotification(
        toEmail,
        nombre,
        'Tu solicitud de registro fue rechazada - SITMI',
        'Tu solicitud de registro fue rechazada',
        'el coordinador revisó tu solicitud de registro en el Portal SITMI y decidió no aprobarla. Si crees que esto es un error, contacta al coordinador.',
      );
    } else {
      emailSent = await this.sendAccountNotification(
        toEmail,
        nombre,
        'Tu cuenta fue eliminada - SITMI',
        'Tu cuenta fue eliminada',
        'el coordinador eliminó tu cuenta del Portal SITMI.',
      );
    }

    return { emailSent };
  }

  async changeUserRole(id: number, roleName: string): Promise<{ user: Usuario; emailSent: boolean }> {
    const user = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: { persona: true, rol: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // Guardamos el estado y el rol ANTES de tocar nada, para saber si esta
    // es la aprobación inicial de un registro (Pendiente -> Activo) o solo
    // un cambio de rol posterior a una cuenta ya activa.
    const eraPendiente = user.estado === 'Pendiente';
    const rolAnterior = user.rol?.nombre_rol;

    let userRol = await this.rolRepository.findOne({ where: { nombre_rol: roleName } });
    if (!userRol) {
      userRol = this.rolRepository.create({ nombre_rol: roleName });
      userRol = await this.rolRepository.save(userRol);
    }

    user.rol = userRol;
    if (eraPendiente) {
      user.estado = 'Activo';
    }
    const savedUser = await this.usuarioRepository.save(user);

    const toEmail = user.persona?.correo || savedUser.username;
    const nombre = user.persona?.nombre;
    const displayRole = userRol.nombre_rol?.toLowerCase().startsWith('coord') ? 'Coordinador' : 'Instructor';

    let emailSent = true; // si no hay cambio que notificar, no contamos eso como un fallo de envío
    if (eraPendiente && savedUser.estado === 'Activo') {
      // Primera aprobación de la solicitud de registro.
      emailSent = await this.sendAccountNotification(
        toEmail,
        nombre,
        'Tu cuenta fue aprobada - SITMI',
        '¡Tu cuenta fue aprobada!',
        `el coordinador aprobó tu solicitud de registro en el Portal SITMI con el rol de <strong>${displayRole}</strong>. Ya puedes iniciar sesión con tu correo y contraseña.`,
      );
    } else if (rolAnterior && rolAnterior !== userRol.nombre_rol) {
      // Cuenta ya activa a la que le cambiaron el rol.
      emailSent = await this.sendAccountNotification(
        toEmail,
        nombre,
        'Tu rol fue actualizado - SITMI',
        'Tu rol fue actualizado',
        `el coordinador cambió tu rol en el Portal SITMI a <strong>${displayRole}</strong>.`,
      );
    }

    return { user: savedUser, emailSent };
  }

  /**
   * Notifica por correo al usuario cualquier acción del coordinador sobre su
   * cuenta (aprobación, cambio de rol, activación/desactivación, rechazo o
   * eliminación). No bloquea la acción si el envío falla: la acción ya se
   * aplicó en la base de datos. Devuelve true/false para que quien la llame
   * pueda avisar al coordinador en pantalla si el correo no salió — igual
   * que ya se hace en forgotPassword().
   */
  private async sendAccountNotification(
    toEmail: string,
    userName: string | undefined,
    subject: string,
    heading: string,
    message: string,
  ): Promise<boolean> {
    if (!toEmail) {
      console.warn('[EMAIL] Se omitió el envío: el usuario no tiene un correo registrado.');
      return false;
    }

    const transporter = this.getMailTransporter();
    const mailSender = process.env.MAIL_USER || 'no-reply@sena.edu.co';

    console.log(`[EMAIL] Enviando "${subject}" a ${toEmail}`);

    try {
      await transporter.sendMail({
        from: `"SITMI Soporte" <${mailSender}>`,
        to: toEmail,
        subject,
        text: `Hola ${userName || ''}, ${message.replace(/<[^>]+>/g, '')}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff; border-radius: 8px; font-weight: bold; font-size: 20px;">SENA SITMI</div>
            </div>
            <h2 style="color: #1a202c; text-align: center;">${heading}</h2>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5; text-align: center;">
              Hola${userName ? ` ${userName}` : ''}, ${message}
            </p>
            <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 24px;">
              Si no reconoces esta acción, contacta a soporte.
            </p>
          </div>
        `,
      });
      console.log(`[EMAIL] "${subject}" enviado exitosamente a ${toEmail}`);
      return true;
    } catch (mailError: any) {
      console.error(`[EMAIL ERROR] Fallo al enviar "${subject}" a ${toEmail}:`, mailError.message);
      return false;
    }
  }
}