import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export function createSuccessResponse<T>(data: T, requestId?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    ok: true,
    data,
    meta: {
      requestId: requestId || uuidv4(),
      timestamp: new Date().toISOString(),
    },
  });
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
  requestId?: string,
  status: number = 400,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        requestId: requestId || uuidv4(),
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

export function getRequestId(request: Request): string {
  const header = request.headers.get('x-request-id');
  return header || uuidv4();
}
