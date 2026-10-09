import jwt from "jsonwebtoken";

import { JWT_SECRET } from "@/helpers/jwtSecret";
import { NextRequest } from "next/server";
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
