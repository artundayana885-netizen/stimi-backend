import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData = require('form-data');

@Injectable()
export class RevisionGcService {
  // URL del webhook de n8n. Ponla en tu .env como N8N_WEBHOOK_GC_URL
  // Ej: N8N_WEBHOOK_GC_URL=https://ia-whatsapp-n8n.7niwok.easypanel.host/webhook/revisar-gc
  private readonly n8nWebhookUrl = process.env.N8N_WEBHOOK_GC_URL;

  constructor(private readonly httpService: HttpService) {}

  async enviarGcParaRevision(
    file: Express.Multer.File,
    identificador: string, // ej. la cédula o el id del instructor
  ) {
    if (!this.n8nWebhookUrl) {
      throw new InternalServerErrorException(
        'Falta configurar N8N_WEBHOOK_GC_URL en las variables de entorno',
      );
    }

    // Arma el multipart/form-data que espera el nodo "Preparar Datos Web GC" en n8n
    const form = new FormData();
    form.append('telefono', identificador);
    form.append('documento', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.n8nWebhookUrl, form, {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      );
      // response.data ya viene en el formato que definimos en n8n:
      // { valido: true/false, mensaje: '...' } o { valido: true, colaEstado: '...', mensaje: '...' }
      return response.data;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Error al comunicarse con el servicio de revisión: ${error.message}`,
      );
    }
  }
}