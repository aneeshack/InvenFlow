import jwt from 'jsonwebtoken';
import { Response } from "express";

export class AuthRepository{
    
  async generateToken(email: string): Promise<string> {
    try {
            const token = jwt.sign({email}, process.env.JWT_SECRET || 'secret', {
                expiresIn: '1d'
            });

            return token

    } catch (error) {
      console.error("authRepository generate token error:", error);
      throw new Error(`Error in generating token: ${(error as Error).message}`);
    }
  }

  async setTokenCookie (res: Response, token: string): Promise<void> {
    try {
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 24 * 60 * 60 * 1000, 
            sameSite: "strict",
        });
    } catch (error) {
        console.error("AuthRepository setTokenCookie error:", error);
        throw new Error(`Failed to set token cookie: ${(error as Error).message}`);
    }
  };

  async clearTokenCookie (res: Response): Promise<void> {
    try {
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    } catch (error) {
        console.error("AuthRepository setTokenCookie error:", error);
        throw new Error(`Failed to set token cookie: ${(error as Error).message}`);
    }
  };
}

