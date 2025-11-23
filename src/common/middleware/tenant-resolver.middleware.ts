import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  use(req: Request & { scope?: any }, res: Response, next: NextFunction) {
    // prefer JWT attached user
    const anyReq: any = req;
    if (anyReq.user && anyReq.user.schoolId) {
      req.scope = { schoolId: anyReq.user.schoolId };
    } else if (req.header('x-school-id')) {
      req.scope = { schoolId: req.header('x-school-id') };
    } else if (req.query?.schoolId) {
      req.scope = { schoolId: String(req.query.schoolId) };
    } else {
      req.scope = { schoolId: null };
    }
    next();
  }
}
