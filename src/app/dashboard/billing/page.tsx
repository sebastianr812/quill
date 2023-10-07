import BillingForm from "@/components/BillingForm";
import { getUserSubscriptionPlan } from "@/lib/stripe";

const BillingPage = async () => {

    const subscriptionPlan = await getUserSubscriptionPlan();

    return (
        <BillingForm subscriptionPlan={subscriptionPlan} />
    );
}

export default BillingPage;
