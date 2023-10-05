import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import {PDFLoader} from "langchain/document_loaders/fs/pdf";
import {  getPineconeClient } from "@/lib/pinecone";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import {PineconeStore} from "langchain/vectorstores/pinecone";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
        const {getUser} = getKindeServerSession();
        const user = getUser();

      if (!user || !user.id) throw new Error("Unauthorized");
 
      return {userId: user.id};
    })
    .onUploadComplete(async ({ metadata, file }) => {
        const createdFile = await db.file.create({
            data: {
                key: file.key,
                name: file.name,
                userId: metadata.userId,
                url: `http://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
                uploadStatus: "PROCESSING"
            }
        });

        try {
            const response = await fetch(`http://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`);
            const blob = await response.blob();
            const loader = new PDFLoader(blob);

            const pageLevelDocs = await loader.load();
            const pagesAmt = pageLevelDocs.length;

            // vectorize and index entire document

            const pinecone = await getPineconeClient();
            const pineconeIndex = pinecone.Index("quill");

            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY
            });

            await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
                pineconeIndex,
                namespace: createdFile.id
            });

            await db.file.update({
                where: {
                    id: createdFile.id
                },
                data: {
                    uploadStatus: "SUCCESS"
                }
            });

        } catch (e) {
            await db.file.update({
                where: {
                    id: createdFile.id
                },
                data: {
                    uploadStatus: "FAILED"
                }
            });
        }
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
