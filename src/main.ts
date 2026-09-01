import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // La carpeta donde Multer guarda los informes subidos debe existir de
  // antemano; diskStorage no la crea sola.
  mkdirSync(join(process.cwd(), 'uploads', 'informes'), { recursive: true });

  const app = await NestFactory.create(AppModule);

  // Activa las reglas de validación que ya estaban escritas en cada DTO
  // (@IsString, @IsNotEmpty, @IsInt, etc.) pero que nunca se ejecutaban
  // porque faltaba registrar el ValidationPipe global. A partir de ahora,
  // cualquier request que no cumpla esas reglas se rechaza con un 400
  // claro, en vez de llegar tal cual a la base de datos.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );

  // Habilitar CORS para permitir peticiones desde el frontend React
  app.enableCors({
    origin: [
      'http://localhost:5173', // Puerto por defecto de Vite
      'http://localhost:3000', // Puerto alternativo o CRA
      'https://stimii-frontend.7niwok.easypanel.host', // Frontend en producción (Easypanel)
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();