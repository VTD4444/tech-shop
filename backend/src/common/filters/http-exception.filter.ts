import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dto/pagination.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      if (message.includes('ECONNREFUSED') || message.includes('connect')) {
        message =
          'Database unavailable. Start PostgreSQL (port 5433): docker start techshop-db or docker compose up -d postgres';
      }
      const prismaCode = (exception as { code?: string }).code;
      if (prismaCode === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Duplicate value violates unique constraint';
      } else if (prismaCode === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      } else if (prismaCode === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference — related record not found';
      } else if (prismaCode) {
        message = `${message} (${prismaCode})`;
      }
    }

    response.status(status).json(ApiResponseDto.fail(message));
  }
}
