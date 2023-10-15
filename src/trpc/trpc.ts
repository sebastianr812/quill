import {auth, currentUser } from '@clerk/nextjs/server';
import { TRPCError, initTRPC } from '@trpc/server';
 
/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();
 
// create authProcedure or middleware to ensure only authenticated users can
// call this api
const middleware = t.middleware;
const isAuth = middleware( async (opts) => {

    const user = await currentUser();
    const {userId} = auth();

    if (!user || !user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
        ctx: {
            userId,
            user,
        }
    });
})

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuth);
