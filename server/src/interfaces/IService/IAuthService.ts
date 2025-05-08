import { Response } from "express";

export interface IAuthService{
    loginAction(email: string, password: string): Promise<string>;
    setTokenCookie(res: Response, token: string): Promise<void>;
    clearTokenCookie(res: Response): Promise<void>
}