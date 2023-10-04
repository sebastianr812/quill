import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import {Loader2} from "lucide-react";
import { Expand } from "lucide-react";
import SimpleBar from "simplebar-react";
import {Document, Page} from "react-pdf";
import { useToast } from "./ui/use-toast";
import { useResizeDetector } from "react-resize-detector";

interface PdfFullScreenProps {
    url: string;
}

const PdfFullscreen = ({url}: PdfFullScreenProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [numPages, setNumPages] = useState<number>();

    const {toast} = useToast();
    const {width, ref} = useResizeDetector();

    return (
        <Dialog open={isOpen} onOpenChange={ (v) => {
            if (!v){
                setIsOpen(v);
            }
        }}>
            <DialogTrigger 
                asChild  
                onClick={() => setIsOpen(true)}>
                <Button 
                    aria-label="fullscreen" 
                    variant="ghost" 
                    className="gap-1.5" >
                    <Expand className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-full">
               <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)] mt-6">
                <div ref={ref} >
                    <Document 
                        loading={
                            <div className="flex justify-center items-center">
                                <Loader2 className="my-24 h-6 w-6 animate-spin" />
                            </div>
                        }
                        onLoadError={() => {
                            toast({
                                title: "Error loading PDF",
                                description: "Please try again later",
                                variant: "destructive"
                            })
                        }}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        file={url}
                        className="max-h-full">
                        {new Array(numPages).fill(0).map((_, idx) => (
                            <Page 
                                key={idx}
                                width={width ? width : 1}
                                pageNumber={idx + 1}/>
                        ))}
                    </Document>
                </div>
               </SimpleBar> 
            </DialogContent>
        </Dialog>
    );
}

export default PdfFullscreen;
