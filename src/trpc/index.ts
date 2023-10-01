import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
 
export const appRouter = router({
    authCallback: publicProcedure.query( async () => {
        const {getUser} = getKindeServerSession();
        const user = getUser();

        if (!user.id || !user.email) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if user is in db
        const dbUser = await db.user.findFirst({
            where: {
                id: user.id
            }
        });

        if (!dbUser) {
            // create user in db
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email
                }
            });
        }
        return { success: true };
    }),
    getUserFiles: privateProcedure.query( ({ctx}) => {
        // todo use context to query db
    })

});
 
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
