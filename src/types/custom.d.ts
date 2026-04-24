/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from '../entities/User';
import { Customer } from '../entities/Customer';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    customer?: Customer;
  }
}
