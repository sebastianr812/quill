import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import * as z from "zod";
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { absoluteUrl } from '@/lib/utils';
import { getUserSubscriptionPlan, stripe } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';
import {  auth, currentUser } from '@clerk/nextjs';
 
export const appRouter = router({
    authCallback: publicProcedure.query( async () => {
        const user = await currentUser();
        const {userId} = auth();

        if (!user || !userId ) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if user is in db
        const dbUser = await db.user.findFirst({
            where: {
                id: userId
            }
        });

        if (!dbUser) {
            // create user in db
            await db.user.create({
                data: {
                    id: userId,
                    email: user.emailAddresses[0].emailAddress 
                }
            });
        }
        return { success: true };
    }),
    getUserFiles: privateProcedure.query( async ({ctx}) => {
        const {userId} = ctx;
        
        return await db.file.findMany({
            where: {
                userId
            },
            include: {
                messages: true
            }
        });
    }),
    deleteFile: privateProcedure
        .input(z.object({ id: z.string() }))
        .mutation( async ({ctx, input }) => {
            const {userId} = ctx;

            const file = await db.file.findFirst({
                where: {
                    id: input.id,
                    userId
                }
            });

            if (!file) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            await db.file.delete({
                where: {
                    id: input.id,
                }
            });

            return file;
        }),
    getFile: privateProcedure
        .input(z.object({ key: z.string() }))
        .mutation( async ({ctx, input}) => {
            const {userId} = ctx;
            const {key} = input;
            
            const file = await db.file.findFirst({
                where: {
                    key,
                    userId
                }
            });

            if (!file) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return file;
        }),
    getFileUploadStatus: privateProcedure
        .input(z.object({ fileId: z.string() }))
        .query(async ({ctx, input}) => {
            const file = await db.file.findFirst({
                where: {
                    id: input.fileId,
                    userId: ctx.userId 
                }
        });

        if (!file) {
            return { status: "PENDING" as const };
        }

        return { status: file.uploadStatus };
        }),
    getFileMessages: privateProcedure
        .input(z.object({ fileId: z.string(), limit: z.number().min(1).max(100).nullish(), cursor: z.string().nullish() }))
        .query(async ({ctx, input}) => {
            const {userId} = ctx;
            const {fileId, cursor} = input;
            const limit = input.limit ?? INFINITE_QUERY_LIMIT;

            const file = await db.file.findFirst({
                where: {
                    id: fileId,
                    userId
                },
            });

            if (!file) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            const messages = await db.message.findMany({
                take: limit + 1,
                where: {
                    fileId
                },
                orderBy: {
                    createdAt: "desc"
                },
                cursor: cursor ? {id: cursor } : undefined,
                select: {
                    id: true,
                    isUserMessage: true,
                    createdAt: true,
                    text: true
                }
            });

            let nextCursor: typeof cursor | undefined = undefined;

            if (messages.length > limit ) {
                const nextItem = messages.pop();
                nextCursor = nextItem?.id;
            }

            return { messages, nextCursor }
        }),
    createStripeSession: privateProcedure.mutation(async ({ctx}) => {
        const {userId} = ctx;
        const billingUrl = absoluteUrl("/dashboard/billing");

        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const dbUser = await db.user.findFirst({
            where: {
                id: userId,
            }
        });

        if (!dbUser) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const subscriptionPlan = await getUserSubscriptionPlan();

        if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
            // user is subed and wants to manage their subscription
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: dbUser.stripeCustomerId,
                return_url: billingUrl
            });
            return {
                url: stripeSession.url
            }
        }

        const stripeSession = await stripe.checkout.sessions.create({
            success_url: billingUrl,
            cancel_url: billingUrl,
            payment_method_types: ["card", "paypal"],
            mode: "subscription",
            billing_address_collection: "auto",
            line_items: [
                {
                    price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
                    quantity: 1
                }
            ],
            metadata: {
                userId
            }
        });
        return {
            url: stripeSession.url
        }
    }),
})
 
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
