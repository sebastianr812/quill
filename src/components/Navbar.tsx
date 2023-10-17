import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import UserAccountNav from './UserAccountNav';
import MobileNav from './MobileNav';
import {currentUser } from '@clerk/nextjs';

const Navbar = async () => {

    const user = await currentUser();

    return (
        <nav className="sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all">
            <MaxWidthWrapper>
                <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
                    <Link
                        href="/"
                        className='flex z-40 font-semibold'>
                        Quill.
                    </Link>
                    <MobileNav isAuth={!!user}/>
                    <div className='hidden items-center space-x-4 sm:flex'>
                        {!user ? (
                            <>
                            <Link
                                href="/pricing"
                                className={buttonVariants({
                                    variant: "ghost",
                                    size: "sm"
                                })}>
                               Pricing 
                            </Link>
                            <Link
                                href="/sign-in"
                                className={buttonVariants({
                                    variant: "ghost",
                                    size: "sm"
                                })}>
                                Sign in
                            </Link>
                            <Link
                                href="/sign-up"
                                className={buttonVariants({
                                    size: "sm"
                                })}>
                            Get started <ArrowRight className='ml-1.5 h-5 w-5'/>
                            </Link>
                            </>
                        ): (
                            <>
                            <Link
                                href="/dashboard"
                                className={buttonVariants({
                                    variant: "ghost",
                                    size: "sm"
                                })}>
                                Dashboard
                            </Link>
                            <UserAccountNav 
                                name={!user.firstName || !user.lastName ? "Your Account": `${user.firstName} ${user.lastName}`}
                                email={user.emailAddresses[0].emailAddress  ?? ""}
                                imageUrl={user.imageUrl ?? ""} />
                            </>
                        )}
                    </div>
                </div>
            </MaxWidthWrapper>
        </nav>
    );
}


export default Navbar;
