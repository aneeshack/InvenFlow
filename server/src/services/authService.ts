import { throwError } from "../middlewares/errorMiddleware";
import { AuthRepository } from "../repository/authRepository";
import { Response } from "express";

export class AuthService{
    constructor(private _authRepository: AuthRepository) {}

    async loginAction(email: string, password: string): Promise<string>{
        try {
            if (!email || !password) {
                throwError(400, 'Email and password are required');
            }

            if (email!== process.env.EMAIL || password!== process.env.PASSWORD) {
                throwError(400, 'Invalid credentials');
            }
                  
            const token = await this._authRepository.generateToken(email)

            if(!token){
                throw new Error('Failed to generate token')
            }
            
            return token
        } catch (error:unknown) {
            console.error('authService login error:',error)
            throw new Error(`${(error as Error).message}`)
        }
    }

    async setTokenCookie(res: Response, token: string): Promise<void> {
        try {
            await this._authRepository.setTokenCookie(res, token);
        } catch (error) {
            console.error('AuthService setTokenCookie error:', error);
            throwError(500, 'Failed to set token cookie');
        }
    }

    async clearTokenCookie(res: Response): Promise<void> {
        try {
            await this._authRepository.clearTokenCookie(res);
        } catch (error) {
            console.error('AuthService setTokenCookie error:', error);
            throwError(500, 'Failed to set token cookie');
        }
    }
}