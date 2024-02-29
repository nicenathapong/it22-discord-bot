const { ApplicationCommandOptionType } = require("discord.js");
const { PrismaClient } = require("@prisma/client");
const { EmbedBuilder } = require("discord.js");

const prisma = new PrismaClient();

module.exports = {
    data: {
        name: "user-info",
        description:
            "ทำความรู้จักกับเพื่อน ด้วยการดูข้อมูลที่เพื่อนแนะนำตัวไว้",
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: "user",
                description: "ผู้ใช้ที่ต้องการจะดูข้อมูล",
                required: true,
            },
        ],
    },
    async run(interaction) {
        const user = interaction.options.getUser("user", true);

        const student = await prisma.student.findUnique({
            where: { discordId: user.id },
        });

        if (!student || !student.nickname || !student.verifiedAt) {
            return interaction.reply({
                content: "😭 ไม่พบข้อมูลของผู้ใช้นี้",
            });
        }

        interaction.reply({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: user.username,
                        iconURL: user.avatarURL(),
                    },
                    title: `ชื่อเล่น: ${student.nickname}`,
                    ...(student.note
                        ? {
                              description: student.note,
                          }
                        : {}),
                        fields: [
                            {
                                name: "สาขา",
                                value: student.program,
                                inline: true
                            },
                            {
                                name: "โครงการ",
                                value: student.project,
                                inline: true
                            }
                        ],
                    footer: {
                        text: `ยืนยันตัวตนเมื่อ ${student.verifiedAt.toLocaleString()}`,
                    },
                    color: 0x2757A1,
                }),
            ],
        });
    },
};
