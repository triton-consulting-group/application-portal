import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";

export default function FileViewerDialog({ src }: { src: File | string }) {
    const [fileValue, setFileValue] = useState<string | null>(null);
    const [fileType, setFileType] = useState<"pdf" | "image" | null>(null);
    const getFileValueQuery = api.applicationResponse.getS3DownloadUrl.useQuery(src as string, { enabled: false });
    const [open, setOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const getUrl = async () => {
            setLoading(true);
            if (typeof src === "string") {
                if (src.length > 0) {
                    setFileValue((await getFileValueQuery.refetch()).data!);
                    setFileType(src.includes(".pdf") ? "pdf" : "image");
                }
            } else {
                // it is a raw file
                setFileValue(URL.createObjectURL(src));
                setFileType(src.type === "application/pdf" ? "pdf" : "image");
            }
            setLoading(false);
        };
        open && void getUrl();
    }, [src, open]);

    return (
        <>
            {src && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <DialogTrigger asChild>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Eye />
                                    </Button>
                                </TooltipTrigger>
                            </DialogTrigger>
                            <DialogContent className="min-w-[80%] max-w-[80%] min-h-[80%] max-h-[80%] overflow-auto">
                                {loading ?
                                    <div className="w-full h-full flex justify-center items-center">
                                        <Loader2 className="animate-spin" />
                                    </div>
                                    :
                                    <>
                                        {fileType === "pdf" ? (
                                            <iframe className="w-full h-full" src={fileValue!}></iframe>
                                        ) : (
                                            <img className="max-h-[600px]" src={fileValue!} />
                                        )}
                                    </>
                                }
                            </DialogContent>
                            <TooltipContent>
                                <p>View uploaded file</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </Dialog>
            )}
        </>
    );
}
