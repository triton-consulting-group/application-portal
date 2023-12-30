import { Tabs, TabsContent, TabsList, TabsTrigger } from "src/components/ui/tabs";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import RecruitmentCycleCombobox from "./recruitment-cycle-combobox";
import QuestionCard from "./question-card";
import PhaseCard from "./phase-card";
import ViewApplications from "./view-applicatons";
import Test from "./test";

export default async function Dashboard() {
    const session = await getServerAuthSession();

    if (!session) {
        redirect("/api/auth/signin");
    } else if (session.user.role === Role.APPLICANT) {
        redirect("/");
    }

    const cycles = await api.recruitmentCycle.getAll.query();

    return (
        <main className="flex flex-col px-12 py-8">
            <h1 className="text-3xl">Dashboard</h1>
            <RecruitmentCycleCombobox
                className="mt-6 mb-2"
                createOption={false}
                recruitmentCycles={cycles}
            ></RecruitmentCycleCombobox>
            <Tabs defaultValue="applications" className="dark h-full">
                <TabsList>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="manage">Management</TabsTrigger>
                </TabsList>
                <TabsContent value="applications" className="flex flex-col">
                    <ViewApplications></ViewApplications>
                    {/*<Test></Test>*/}
                </TabsContent>
                <TabsContent value="manage">
                    <div className="flex gap-x-8">
                        <QuestionCard></QuestionCard>
                        <PhaseCard></PhaseCard>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    );
}
