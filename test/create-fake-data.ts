import { Role } from "../src/server/db/types";
import { generateUser, insertUsers, loadNames } from "./create-users";
import { createApplications, fillApplications, submitApplications } from "./create-applications";

const generate = async (cycleId: string) => {
    const [firstNames, lastNames] = loadNames();

    const users: { id: string, name: string, email: string, role: Role }[] = []
    for (let i = 0; i < 200; i++) {
        users.push(generateUser(firstNames, lastNames));
    }
    await insertUsers(users);

    const applications = await createApplications(users.map(u => u.id), cycleId)
    await fillApplications(applications.map(a => a.id), cycleId);
    await submitApplications(applications.map(a => a.id));
}

generate("77d7d4b4-ed9c-499d-a258-a8c9c592c93b");

