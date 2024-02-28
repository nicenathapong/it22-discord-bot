// Load process.env
require("dotenv").config();

const { Client, Events, GatewayIntentBits } = require("discord.js");
const { PrismaClient } = require("@prisma/client");
const { join } = require("path");
const { readdirSync } = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
    ],
});
const prisma = new PrismaClient();

const commands = [];
const commandFiles = readdirSync(join(__dirname, "./commands"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command);
}

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✨ Ready! Logged in as ${readyClient.user.tag}`);

    const studentsCount = await prisma.student.count();
    if (!studentsCount) {
        console.log("‼️ No students info, start migration");
        await migrateStudents();
    }

    const mainGuild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!mainGuild) return console.log("💥 Error: main guild not found");

    mainGuild.commands.set(commands.map((c) => c.data));
    console.log(`🚀 Pushed ${commands.length} commands to main guild`);

    // Put commands
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isCommand()) {
        const command = commands.find(
            (c) => c.data.name === interaction.command.name
        );
        if (!command) return;

        command.run(interaction).catch(async (err) => {
            console.error(err);
            await interaction[
                interaction.replied || interaction.deferred
                    ? "followUp"
                    : "reply"
            ]({
                content: `💥 เกิดข้อผิดพลาด: ${err.name}, โปรดติดต่อผู้ดูแล`,
                ephemeral: true,
            });
        });
    }
});

async function migrateStudents() {
    const students_raw = require("./student_data/student_formatted.json");

    for (const student of students_raw) {
        await prisma.student.create({
            data: student,
        });
    }

    console.log("✨ Migration finish");
}

client.login(process.env.TOKEN);
