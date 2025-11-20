import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Global exception filter
 * Standardizes error responses across the API
 * Includes request ID for tracking and debugging
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const responseObj = exceptionResponse as any;
        message = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : responseObj.message;
        errorCode = responseObj.error || exception.name;
        details = responseObj.details;
      } else {
        message = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.name;
    }

    // Log the error for monitoring (in production, use proper logging service)
    console.error({
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      errorCode,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Send standardized error response
    response.status(status).json({
      error: {
        code: errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  }
}
