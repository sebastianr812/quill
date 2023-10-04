import { createContext, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useMutation } from "@tanstack/react-query";

type StreamResponse = {
    addMessage: () => void;
    message: string;
    handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    isLoading: boolean;
}

export const ChatContext = createContext<StreamResponse>({
    addMessage: () => {},
    message: "",
    handleInputChange: () => {},
    isLoading: false
});

interface Props {
    fileId: string;
    children: React.ReactNode;
}

export const ChatContextProvider = ({fileId, children} : Props) => {
    const [message, setMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const {toast} = useToast();

    const {
        data: sendMessage
    } = useMutation({
        mutationFn: async ({message} : {message: string}) => {
            const response = await fetch("/api/message", {
                method: "POST",
                body: JSON.stringify({
                    fileId,
                    message
                }),
            });

            if (!response.ok) {
                throw new Error("failed to send message");
            }

            return response.body;
        },
    });

    const addMessage = () => sendMessage({ message });
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
    }

    return (
        <ChatContext.Provider value={{
           isLoading,
           message,
           handleInputChange,
           addMessage
        }}>
            {children}
        </ChatContext.Provider>
    );
}

