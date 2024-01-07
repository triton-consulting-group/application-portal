import * as fs from 'fs'
import { db } from '../src/server/db';
import { users } from '../src/server/db/schema';
import { Role } from '../src/server/db/types';

export const loadNames = (): [string[], string[]] => [
    fs.readFileSync("./first-names.txt", { encoding: "utf8" }).split("\n"),
    fs.readFileSync("./last-names.txt", { encoding: "utf8" }).split("\n"),
];

export const pickName = (names: string[]): string => names[Math.floor(Math.random() * names.length)]!;

export const generateUser = (firstNames: string[], lastNames: string[]) => {
    const firstName = pickName(firstNames);
    const lastName = pickName(lastNames);

    return {
        id: crypto.randomUUID(),
        name: `${firstName} ${lastName}`,
        email: `${firstName}${lastName}@gmail.com`,
        role: Role.APPLICANT
    }
}

export const insertUsers = (u: { id: string, name: string, email: string, role: Role }[]) => {
    return db.insert(users).values(u)
};

