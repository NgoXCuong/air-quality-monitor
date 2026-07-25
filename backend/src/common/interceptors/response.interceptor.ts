import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

@Injectable()
export class ResponseInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>>
{
    intercept(
        _context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((res) => {
                // If the handler already returned a structured response, unwrap it
                if (res && typeof res === 'object' && 'data' in res && 'message' in res) {
                    return {
                        success: true,
                        message: res.message as string,
                        data: res.data as T,
                    };
                }
                // Otherwise wrap everything in data
                return {
                    success: true,
                    message: res?.message ?? 'Success',
                    data: res,
                };
            }),
        );
    }
}
