import { Request, Response } from 'express';
import { AuthService } from "../services/authService";
import { throwError } from "../middlewares/errorMiddleware";
import { HTTP_STATUS } from '../constants/httpStatus';
import { IAuthService } from '../interfaces/IService/IAuthService';
import { AuthenticatedRequest } from '../middlewares/authMiddlewar';

class AuthController {
  
    constructor(
        // private _authService: AuthService,
        private _authService: IAuthService,
    ) {}

    async login(req: Request, res: Response): Promise<void> {
        try {
            console.log('inside login ',req.body)
            const { email, password } = req.body;

            if (!email || !password) {
                throwError(HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
                return;
            }

            const token = await this._authService.loginAction(email, password);
      
            if(!token){
                throwError(500, "token required.");
                return
              }

            await this._authService.setTokenCookie(res, token)

            res.status(HTTP_STATUS.OK).json({ success:true,data:email });
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Login failed' });
        }
    }

    async logout(req: Request, res: Response):Promise<void>{
        try {
            await this._authService.clearTokenCookie(res)
          res.status(HTTP_STATUS.OK).json({ success: true, message: 'Logged out successfully' })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "An unexpected error occurred";
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success:false, message: message })
        }
      }

      async fetchUser(req: AuthenticatedRequest, res: Response):Promise<void>{
        try {

            console.log(req.user)
            const email = req.user?.email;
            if(email !== process.env.EMAIL){
                throwError(HTTP_STATUS.BAD_REQUEST, 'not authenticated')
            }
            
          res.status(HTTP_STATUS.OK).json({ success: true, data:email })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "An unexpected error occurred";
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success:false, message: message })
        }
      }
}

export default AuthController;