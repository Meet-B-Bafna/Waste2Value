import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

import { JWT_SECRET } from "@/helpers/jwtSecret";
type DecodedToken = {
    id: number;
};

export const getDataFromJwt = (request: NextRequest) => {
    try {
        const token = request.cookies.get("token")?.value || "";
        const decodedToken: DecodedToken = jwt.verify(token, JWT_SECRET) as DecodedToken;
        return decodedToken.id;
    } catch (error) {
        throw new Error("Error decrypting jwt: " + error);
    }
};
