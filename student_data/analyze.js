const fs = require("fs");

const enum_programs = fs.readFileSync("./.enum_programs.txt", "utf-8").split("\n");
const enum_projects = fs.readFileSync("./.enum_projects.txt", "utf-8").split("\n");

const students = [];

for (const program of enum_programs) {
    for (const project of enum_projects) {
        const path = `./${program}_${project}.txt`;
        const isExits = fs.existsSync(path);
        if (!isExits) continue;
        const student_list = fs.readFileSync(path, "utf-8").split("\n");
        for (const student of student_list) {
            students.push({
                id: student.split(" ")[1],
                program,
                project,
            });
        }
    }
}

fs.writeFileSync("./student_formatted.json", JSON.stringify(students));