import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../../generated/prisma/client';

/**
 * Maps well-known Prisma errors to HTTP errors so services don't need
 * per-call try/catch. Anything unmapped falls through to Nest's default
 * handler, which logs it and returns a generic 500 (no internals leaked).
 * Error codes: https://www.prisma.io/docs/orm/reference/error-reference
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    super.catch(this.toHttpException(exception) ?? exception, host);
  }

  private toHttpException(
    exception: Prisma.PrismaClientKnownRequestError,
  ): HttpException | undefined {
    switch (exception.code) {
      case 'P2002': // unique constraint
        return new ConflictException(
          'A record with these details already exists',
        );
      case 'P2003': // foreign key constraint
        return new ConflictException(
          'Operation violates a relation constraint',
        );
      case 'P2025': // record required for the operation not found
        return new NotFoundException('Record not found');
      default:
        return undefined;
    }
  }
}
