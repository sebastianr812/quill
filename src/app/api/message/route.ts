import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {SendMessageValidator} from "@/lib/validators/sendMessageValidator";
import { db } from "@/db";

export async function POST (req: NextRequest) {
    // endpoint for asking question for a PDF
    
    const body = await req.json();
    const {getUser} = getKindeServerSession();
    const user = getUser();
    const {id: userId} = user;

    if (!userId) {
        return new NextResponse("unauthorized", {status: 401});
    }
    
    const {
        message,
        fileId
    } = SendMessageValidator.parse(body);
    
    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId,
        }
    });

    if (!file) {
        return new NextResponse("file not found", {status: 404});
    }

    await db.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId
        }
    });

    // ask LLM question that user asked

    
}
