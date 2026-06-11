import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/pagination.dto';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && data.success !== undefined) return data;
        if (data && Array.isArray(data.data) && data.meta) {
          return ApiResponseDto.ok(data.data, data.meta);
        }
        return ApiResponseDto.ok(data);
      }),
    );
  }
}
