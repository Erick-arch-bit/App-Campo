import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    usuario?: {
        id_usuario: number;
        codigo_acceso: string;
        nombre_completo: string;
        rol: string;
        especialidad: string | null;
        puede_registrar_beneficiarios: boolean;
        zona_nombre: string | null;
    };
}
export declare const autenticar: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requiereAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requierePermisoBeneficiarios: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const generarToken: (payload: {
    id_usuario: number;
    codigo_acceso: string;
    nombre_completo: string;
    rol: string;
    especialidad: string | null;
    puede_registrar_beneficiarios: boolean;
    zona_nombre: string | null;
}) => string;
//# sourceMappingURL=auth.d.ts.map