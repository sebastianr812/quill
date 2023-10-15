'use client';

import {Button}  from "./ui/button";
import { useClerk } from "@clerk/nextjs";

const LogoutButton = () => {
    const {signOut} = useClerk();

    return (
        <Button onClick={() => signOut()} className="w-full" >
            Sign Out
        </Button>
    )
}

export default LogoutButton;
