import { Tabs, TabsContent, TabsList, TabsTrigger } from "src/components/ui/tabs";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import RecruitmentCycleCombobox from "./recruitment-cycle-combobox";
import QuestionCard from "./question-card";
import ApplicationTable from "./application-table";
import PhaseCard from "./phase-card";

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
            <Tabs defaultValue="applications" className="dark mt-4">
                <TabsList>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="manage">Management</TabsTrigger>
                </TabsList>
                <TabsContent value="applications" className="flex flex-col">
                    <RecruitmentCycleCombobox
                        className="mb-6"
                        createOption={false}
                        recruitmentCycles={cycles}
                    ></RecruitmentCycleCombobox>
                    <ApplicationTable></ApplicationTable>
                </TabsContent>
                <TabsContent value="manage">
                    <RecruitmentCycleCombobox
                        className="mb-6"
                        createOption={true}
                        recruitmentCycles={cycles}
                    ></RecruitmentCycleCombobox>
                    <div className="flex gap-x-8">
                        <QuestionCard></QuestionCard>
                        <PhaseCard></PhaseCard>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    );
}
