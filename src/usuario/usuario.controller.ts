import { Controller, Post, Body, HttpCode, HttpStatus, Get, Put, Delete, Param, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() payload: any) {
    const user = await this.usuarioService.register(payload);
    return {
      message: 'Usuario registrado exitosamente',
      id: user.id_usuario,
      email: user.username,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() payload: any) {
    const userProfile = await this.usuarioService.login(payload);
    return {
      message: 'Inicio de sesión exitoso',
      user: userProfile,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    await this.usuarioService.forgotPassword(email);
    return {
      message: 'Código de recuperación enviado',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() payload: any) {
    await this.usuarioService.resetPassword(payload);
    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() payload: any) {
    await this.usuarioService.changePassword(payload);
    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllUsers() {
    const users = await this.usuarioService.getAllUsers();
    return users.map(usuario => ({
      id: usuario.id_usuario,
      name: usuario.persona?.nombre || 'Usuario',
      email: usuario.username,
      role: usuario.rol?.nombre_rol?.toLowerCase() || '',
      active: usuario.estado === 'Activo',
      estado: usuario.estado,
      area: usuario.persona?.area?.nombre || 'Sin asignar',
      identificacion: usuario.persona?.identificacion || '',
      telefono: usuario.persona?.telefono || '',
    }));
  }

  @Put('status/:id')
  @HttpCode(HttpStatus.OK)
  async toggleUserStatus(@Param('id') id: string) {
    const user = await this.usuarioService.toggleUserStatus(Number(id));
    return {
      message: `Estado del usuario cambiado a ${user.estado}`,
      active: user.estado === 'Activo',
    };
  }

  @Put('role/:id')
  @HttpCode(HttpStatus.OK)
  async changeUserRole(@Param('id') id: string, @Body('role') role: string) {
    const user = await this.usuarioService.changeUserRole(Number(id), role);
    return {
      message: `Rol del usuario cambiado a ${user.rol?.nombre_rol}`,
      role: user.rol?.nombre_rol?.toLowerCase(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.usuarioService.deleteUser(Number(id));
    return {
      message: 'Usuario eliminado exitosamente',
    };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body('message') message: string) {
    if (!message || typeof message !== 'string') {
      throw new BadRequestException('Falta el campo "message"');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'Eres un asistente virtual del portal SITMI del SENA. Ayudas a instructores con dudas sobre informes GC y GF, fechas límite, documentos requeridos y uso del sistema. Responde siempre en español, de forma clara y concisa.'
            }]
          },
          contents: [
            { role: 'user', parts: [{ text: message }] }
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Error de la API de Gemini:', errText);
        throw new Error('Error al consultar el asistente');
      }

      const data: any = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || 'No pude generar una respuesta.';
      return { reply };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Error interno del asistente');
    }
  }
}
