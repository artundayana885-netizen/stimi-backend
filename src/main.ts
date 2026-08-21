import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir peticiones desde el frontend React
 app.enableCors({
    origin: [
      'http://localhost:5173', // Puerto por defecto de Vite
      'http://localhost:3000', // Puerto alternativo o CRA
      'https://stimii-frontend.7niwok.easypanel.host',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

