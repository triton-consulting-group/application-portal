"use client";

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

function Item({ id }: { id: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <>
            {isDragging ? null : (<div ref={setNodeRef} style={style} {...attributes} {...listeners}>{id}</div>)}
        </>
    )
}

function Container({ id, items }: { id: string, items: string[] }) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <SortableContext items={items}>
            <div className="flex flex-col w-16 bg-black px-2 py-1" ref={setNodeRef}>
                {items.map(id => <Item key={id} id={id}></Item>)}
            </div>
        </SortableContext>
    )
}

export default function Test() {
    const [a, setA] = useState<string[]>(["1", "2", "3"]);
    const [b, setB] = useState<string[]>(["4", "5", "6"]);
    const [c, setC] = useState<string[]>(["7", "8", "9"]);
    const sensors = useSensors(useSensor(PointerSensor))
    const [activeId, setActiveId] = useState<string | null>(null)

    const handleStart = ({ active }: { active: DragStartEvent["active"] }) => {
        setActiveId(active.id as string);
    }

    const handleEnd = ({ active, over }: { active: DragEndEvent["active"], over: DragEndEvent["over"] }) => {
        if (!over) return;
        if (active.id === over.id) return;
        setA(a.filter(x => x !== active.id));
        setB(b.filter(x => x !== active.id));
        setC(c.filter(x => x !== active.id));

        if (over.id === "a" || a.includes(over.id as string)) {
            setA([active.id as string, ...a])
        } else if (over.id === "b" || b.includes(over.id as string)) {
            setB([active.id as string, ...b])
        } else if (over.id === "c" || c.includes(over.id as string)) {
            setC([active.id as string, ...c])
        }
    }

    return (
        <div className="flex gap-x-2">
            <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
                <Container items={a} id="a"></Container>
                <Container items={b} id="b"></Container>
                <Container items={c} id="c"></Container>
                <DragOverlay>{activeId ? <Item id={activeId}></Item> : null}</DragOverlay>
            </DndContext>
        </div>
    )
}
