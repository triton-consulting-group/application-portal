import { Fragment, type ReactNode, useEffect, useState, forwardRef, type ForwardedRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { type ApplicationNote } from "../types";
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
    const [notes, setNotes] = useState<(ApplicationNote & { authorName: string | null })[]>([]);
    const [editing, setEditing] = useState<boolean>(false);
    const [userId, setUserId] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const getNotesQuery = api.applicationNote.getByApplicationId.useQuery(applicationId, { enabled: false });
    const deleteNoteMutation = api.applicationNote.delete.useMutation();

    const deleteNote = async (noteId: string) => {
        setNotes(notes.filter(n => n.id !== noteId));
        await deleteNoteMutation.mutateAsync(noteId);
    };

    const fetchUserId = async () => {
        setUserId((await getSession())?.user.id ?? "");
    };

    useEffect(() => {
        const fetchNotes = async () => {
            setLoading(true);
            setNotes((await getNotesQuery.refetch()).data ?? []);
            setLoading(false);
        };
        if (open) void fetchNotes();
    }, [open, applicationId]);

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
                {loading ?
                    <div className="flex justify-center items-center">
                        <Loader2 className="animate-spin" />
                    </div> :
                    <div className="flex flex-col divide-y overflow-hidden">
                        {notes.length === 0 && <div>No notes yet</div>}
                        {notes.map(note => (
                            <Fragment key={note.id}>
                                <Collapsible className="pt-2 first:pt-0 mb-2 last:mb-0">
                                    <div className="flex justify-between items-center">
                                        <CreateNote
                                            applicationId={applicationId}
                                            existingNote={note}
                                            setNotes={setNotes}
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
                                                        onClick={() => deleteNote(note.id ?? "")}
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
                            setNotes={setNotes}
                        ></CreateNote>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

export default ViewNotes;

