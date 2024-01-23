import { Fragment, type ReactNode, useEffect, useState, forwardRef, type ForwardedRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronsUpDown, Loader2, Pencil, Trash2, X } from "lucide-react";
import CreateNote from "./create-note";
import { getSession } from "next-auth/react";

const ViewNotes = forwardRef(function ViewNotes({
    applicationId,
    children,
    asChild,
    ...props
}: {
    applicationId: string,
    children?: ReactNode,
    asChild?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}, ref: ForwardedRef<any>) {
    const [editing, setEditing] = useState<boolean>(false);
    const [userId, setUserId] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);
    const utils = api.useContext();
    const getNotesQuery = api.applicationNote.getByApplicationId.useQuery(applicationId, { enabled: open });
    const deleteNoteMutation = api.applicationNote.delete.useMutation({
        onMutate: async (noteId) => {
            // cancel outgoing refetches that will overwrite data
            await utils.applicationNote.getByApplicationId.cancel();
            const previousNotes = utils.applicationNote.getByApplicationId.getData(applicationId);

            // optimistically update notes
            utils.applicationNote.getByApplicationId.setData(
                applicationId,
                previousNotes?.filter(n => n.id !== noteId)
            );

            return { previousNotes };
        },
        onSettled: () => utils.applicationNote.getByApplicationId.invalidate(applicationId),
        onError: (_err, _deletedId, context) => {
            utils.applicationNote.getByApplicationId.setData(applicationId, context?.previousNotes);
        },
    });

    const fetchUserId = async () => {
        setUserId((await getSession())?.user.id ?? "");
    };

    useEffect(() => {
        void fetchUserId();
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div ref={ref} {...props}>
                    {asChild ? children : (
                        <Button>
                            Notes
                        </Button>
                    )}
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Notes</DialogTitle>
                </DialogHeader>
                {getNotesQuery.isLoading ?
                    <div className="flex justify-center items-center">
                        <Loader2 className="animate-spin" />
                    </div> :
                    <div className="flex flex-col divide-y overflow-hidden">
                        {getNotesQuery.data?.length === 0 && <div>No notes yet</div>}
                        {getNotesQuery.data?.map(note => (
                            <Fragment key={note.id}>
                                <Collapsible className="pt-2 first:pt-0 mb-2 last:mb-0">
                                    <div className="flex justify-between items-center">
                                        <CreateNote
                                            applicationId={applicationId}
                                            existingNote={note}
                                            disabled={!editing || userId !== note.authorId}
                                            asChild
                                        >
                                            <h3 className={editing ? "cursor-pointer" : ""}>{note.title} - {note.authorName}</h3>
                                        </CreateNote>
                                        {!editing ?
                                            (
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="w-9 p-0">
                                                        <ChevronsUpDown className="h-4 w-4" />
                                                    </Button>
                                                </CollapsibleTrigger>
                                            ) : userId === note.authorId ?
                                                (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-9 p-0"
                                                        onClick={() => deleteNoteMutation.mutate(note.id)}
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                ) :
                                                (
                                                    <Button
                                                        variant="ghost"
                                                        disabled
                                                        size="sm"
                                                        className="w-9 p-0"
                                                    ></Button>
                                                )
                                        }
                                    </div>
                                    <CollapsibleContent>
                                        <p className="whitespace-pre-wrap break-words">
                                            {note.content}
                                        </p>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Fragment>
                        ))}
                    </div>
                }
                <DialogFooter>
                    <div className="flex justify-between w-full mt-2">
                        <Button className="flex w-36 items-center justify-between" onClick={() => setEditing(!editing)}>
                            <span>
                                {editing ? "Stop Editing" : "Edit"}
                            </span>
                            {editing ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                        </Button>
                        <CreateNote
                            applicationId={applicationId}
                        ></CreateNote>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

export default ViewNotes;

