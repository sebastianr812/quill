import { NextRequest } from "next/server";
import {SendMessageValidator} from "@/lib/validators/sendMessageValidator";
import { db } from "@/db";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { getPineconeClient } from "@/lib/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { openai } from "@/lib/openai";
import {OpenAIStream, StreamingTextResponse} from "ai";
import { auth } from "@clerk/nextjs";

export async function POST (req: NextRequest) {
    // endpoint for asking question for a PDF
    
    const body = await req.json();
    const {userId} = auth();

    if (!userId) {
        return new Response("unauthorized", {status: 401});
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
        return new Response("file not found", {status: 404});
    }

    await db.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId
        }
    });

// vectorize message
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY
    });

    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.Index("quill");

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: file.id
    });

    const results = await vectorStore.similaritySearch(message, 4);

    const prevMessages = await db.message.findMany({
        where: {
            fileId
        },
        orderBy: {
            createdAt: "asc"
        },
        take: 6
    });

    const formattedPrevMessages = prevMessages.map((message) => ({
        role: message.isUserMessage ? ("user" as const) : ("assistant" as const),
        content: message.text
    }));

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        stream: true,
        messages: [
      {
        role: 'system',
        content:
          'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
      },
      {
        role: 'user',
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
    if (message.role === 'user') return `User: ${message.content}\n`
    return `Assistant: ${message.content}\n`
  })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`,
      },
    ],
    });

    const stream = OpenAIStream(response, {
        async onCompletion(completion) {
            await db.message.create({
                data: {
                    text: completion,
                    isUserMessage: false,
                    fileId,
                    userId
                }
            });
        }
    });

    return new StreamingTextResponse(stream);
}
