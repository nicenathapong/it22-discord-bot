const {
    ApplicationCommandOptionType,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder
} = require("discord.js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
    data: {
        name: "verify",
        description: "ยืนยันตัวตนเพื่อรับยศ IT22",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "applicant_number",
                description: "เลขที่ผู้สมัคร",
                required: true,
            },
        ],
    },
    async run(interaction) {
        const applicant_number = interaction.options.getString(
            "applicant_number",
            true
        );

        const student = await prisma.student.findUnique({
            where: {
                id: applicant_number,
            },
        });

        if (!student) {
            return interaction.reply({
                content: "😭 ไม่พบนักศึกษา",
                ephemeral: true,
            });
        }

        if (student.discordId) {
            return interaction.reply({
                content:
                    "🥶 คุณได้ทำการยืนยันตัวตนไปแล้ว, หากนั่นไม่ใช่คุณ โปรดติดต่อผู้ดูแล",
                ephemeral: true,
            });
        }

        const studentByDiscordId = await prisma.student.findUnique({
            where: {
                discordId: interaction.user.id
            }
        });

        if (studentByDiscordId) {
            return interaction.reply({
                content:
                    `🥶 คุณได้ใช้บัญชี Discord นี้ ทำการยืนยันตัวตนไปแล้ว (${studentByDiscordId.nickname})`,
                ephemeral: true,
            });
        }

        const modalCustomId = `${interaction.user.id}-${Date.now()}`;
        const modal = new ModalBuilder({
            customId: modalCustomId,
            title: "แนะนำตัวให้เพื่อนๆ รู้จัก ✨",
            components: [
                new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            customId: "nickname",
                            label: "ชื่อเล่นของคุณ",
                            style: TextInputStyle.Short,
                            placeholder:
                                "หรือชื่อที่ต้องการให้เพื่อนเรียกนั่นแหละ",
                            required: true,
                        }),
                    ],
                }),
                new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            customId: "note",
                            label: "ข้อความแนะนำตัว",
                            style: TextInputStyle.Paragraph,
                            placeholder:
                                "ประวัติส่วนตัว/ความสนใจ/เป้าหมายหรือความฝัน/สิ่งที่อยากจะบอกกับเพื่อนใหม่",
                            required: false,
                        }),
                    ],
                }),
            ],
        });

        await interaction.showModal(modal);

        const modalInteraction = await interaction
            .awaitModalSubmit({
                time: 300_000,
                filter: (i) => i.customId === modalCustomId,
            })
            .then((res) => res)
            .catch(() => null);

        if (!modalInteraction) {
            await interaction.editReply({
                content: `💥 เกิดข้อผิดพลาด: (!modalInteraction) โปรดติดต่อผู้ดูแล`,
                ephemeral: true,
            });
        }

        const role = await interaction.guild.roles.fetch(process.env.ROLE_ID);
        if (!role) {
            await interaction.editReply({
                content: `💥 เกิดข้อผิดพลาด: (!role) โปรดติดต่อผู้ดูแล`,
                ephemeral: true,
            });
        }

        await interaction.member.roles.add(role);

        const nickname = modalInteraction.fields.getTextInputValue("nickname");
        const note = modalInteraction.fields.getTextInputValue("note");

        await prisma.student.update({
            where: {
                id: student.id,
            },
            data: {
                discordId: interaction.user.id,
                nickname,
                note: note.length ? note : null,
                verifiedAt: new Date(),
            },
        });

        // await interaction.member.setNickname(`IT22 | ${nickname}`, "Set new nickname");

        modalInteraction.reply({
            content:
                "✅ ยืนยันตัวตนและบันทึกข้อมูล `(Discord ID, ชื่อเล่น, ข้อความแนะนำตัว)` เรียบร้อย!",
            ephemeral: true,
        });
    },
};
