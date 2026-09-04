import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // La carpeta donde Multer guarda los informes subidos debe existir de
  // antemano; diskStorage no la crea sola.
  mkdirSync(join(process.cwd(), 'uploads', 'informes'), { recursive: true });
  // Igual que arriba, pero para las imágenes de evidencia (pantallazos)
  // que el coordinador adjunta al aprobar/corregir un informe.
  mkdirSync(join(process.cwd(), 'uploads', 'observaciones'), { recursive: true });

  const app = await NestFactory.create(AppModule);

  // Activa las reglas de validación que ya estaban escritas en cada DTO
  // (@IsString, @IsNotEmpty, @IsInt, etc.) pero que nunca se ejecutaban
  // porque faltaba registrar el ValidationPipe global. A partir de ahora,
  // cualquier request que no cumpla esas reglas se rechaza con un 400
  // claro, en vez de llegar tal cual a la base de datos.
  //
  // OJO: `transformOptions.enableImplicitConversion` se probó y se quitó
  // a propósito. Convertía automáticamente TODOS los campos según su tipo
  // declarado, pero para campos de arreglo libre sin forma fija (como
  // `marcas`, las anotaciones que el coordinador dibuja sobre un informe)
  // esa conversión los corrompía silenciosamente: en vez de guardar el
  // arreglo real, guardaba un arreglo vacío, y eso hacía fallar con error
  // 500 la función "Solicitar Corrección". Los pocos campos que sí
  // necesitan conversión de texto a número (como `id_version`, que llega
  // como string en las subidas con archivo adjunto) ahora se declaran
  // explícitamente con `@Type(() => Number)` en su propio DTO — así solo
  // se convierte ese campo puntual, sin arriesgar los demás.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
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