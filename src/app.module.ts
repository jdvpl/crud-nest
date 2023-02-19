import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Todo } from './todos/entities/todo.entity';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'containers-us-west-67.railway.app',
    port: 7726,
    username: 'postgres',
    password: 'hbMRFgSVNiFrAFFDx9XL',
    database: 'railway',
    entities: [Todo],
    // synchronize: true
  }), TodosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
