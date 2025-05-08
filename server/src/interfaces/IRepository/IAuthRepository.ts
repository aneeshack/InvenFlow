export interface IAuthRepository{
    generateToken(email: string): Promise<string>;
    setTokenCookie (res: Response, token: string): Promise<void>;
    clearTokenCookie (res: Response): Promise<void>
}