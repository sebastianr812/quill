import { db } from '@/db';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { getUserSubscriptionPlan } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';

const DashboardPage = async () => {
   const {userId} = auth();
   
   if (!userId ) {
       redirect('/auth-callback?origin=dashboard');
    }

    const dbUser = await db.user.findFirst({
        where: {
            id: userId
        }
    });

    if (!dbUser) {
        redirect('/auth-callback?origin=dashboard');
    }

    const subscriptionPlan = await getUserSubscriptionPlan();

   return (
        <Dashboard subscriptionPlan={subscriptionPlan}/>
    );
}
export default DashboardPage;
