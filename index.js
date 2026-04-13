const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
const staffRoleIds = process.env.STAFF_ROLE_IDS 
  ? process.env.STAFF_ROLE_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0) 
  : [];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

const stats = new Map();

console.log('✅ Bot starting...');

const commands = [
  new SlashCommandBuilder().setName('ticketsetup').setDescription('Setup ticket panel'),
  new SlashCommandBuilder().setName('ticket').setDescription('Create support ticket'),
  new SlashCommandBuilder().setName('confess').setDescription('Send anonymous confession'),
  new SlashCommandBuilder().setName('stats').setDescription('Show server stats'),
  new SlashCommandBuilder().setName('ranking').setDescription('Show message ranking'),
  new SlashCommandBuilder().setName('say').setDescription('Bot says message').addStringOption(o => o.setName('message').setDescription('Message').setRequired(true)),
  new SlashCommandBuilder().setName('regole').setDescription('Show rules'),
  new SlashCommandBuilder().setName('renamevoc').setDescription('Rename voice channels').addStringOption(o => o.setName('emoji').setDescription('Emoji').setRequired(true)),
  new SlashCommandBuilder().setName('setwelcome').setDescription('Set welcome channel').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)),
  new SlashCommandBuilder().setName('setgoodbye').setDescription('Set goodbye channel').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)),
];

client.once('ready', async () => {
  console.log(`✅ Online: ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
    console.log('✅ Commands registered');
  } catch (error) {
    console.error('Error:', error);
  }
});

client.on('guildMemberAdd', async (member) => {
  try {
    let ch = member.guild.channels.cache.find(c => c.name.includes('welcome'));
    if (!ch) ch = member.guild.systemChannel;
    if (ch) {
      const embed = new EmbedBuilder()
        .setTitle('🎉 Welcome!')
        .setDescription(`Welcome ${member} to ${member.guild.name}!`)
        .setColor(0x00FF00)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
      await ch.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (e) {}
});

client.on('guildMemberRemove', async (member) => {
  try {
    let ch = member.guild.channels.cache.find(c => c.name.includes('goodbye'));
    if (!ch) ch = member.guild.systemChannel;
    if (ch) {
      const embed = new EmbedBuilder()
        .setTitle('👋 Member Left')
        .setDescription(`${member.user.username} left...`)
        .setColor(0xFF0000)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
      await ch.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (e) {}
});

client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;
  const uid = msg.author.id;
  if (!stats.has(uid)) stats.set(uid, { name: msg.author.username, messages: 0 });
  stats.get(uid).messages++;
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === 'create_ticket') {
        const modal = new ModalBuilder().setCustomId('ticket_modal').setTitle('Create Ticket');
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ticket_title').setLabel('Title').setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ticket_description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        await interaction.showModal(modal);
      }
      if (interaction.customId === 'confess_button') {
        const modal = new ModalBuilder().setCustomId('confession_modal').setTitle('Confession');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('confession_text').setLabel('Your confession').setStyle(TextInputStyle.Paragraph).setMaxLength(2000).setRequired(true)));
        await interaction.showModal(modal);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'ticket_modal') {
        const title = interaction.fields.getTextInputValue('ticket_title');
        const desc = interaction.fields.getTextInputValue('ticket_description');
        try {
          const ch = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
              { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
              ...staffRoleIds.map(rid => ({ id: rid, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
            ]
          });
          const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor(0x0099FF).addFields({ name: 'Author', value: interaction.user.toString() }).setTimestamp();
          await ch.send({ embeds: [embed] });
          await interaction.reply({ content: `✅ Ticket created: ${ch}`, ephemeral: true });
        } catch (e) {
          await interaction.reply({ content: '❌ Error', ephemeral: true });
        }
      }
      if (interaction.customId === 'confession_modal') {
        const text = interaction.fields.getTextInputValue('confession_text');
        try {
          let ch = interaction.guild.channels.cache.find(c => c.name.includes('confession'));
          const embed = new EmbedBuilder().setTitle('📝 Confession').setDescription(text).setColor(0x9932CC).setFooter({ text: 'Anonymous' }).setTimestamp();
          if (ch) await ch.send({ embeds: [embed] });
          else await interaction.channel.send({ embeds: [embed] });
          await interaction.reply({ content: '✅ Sent!', ephemeral: true });
        } catch (e) {}
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {
      case 'ticketsetup':
        const embed = new EmbedBuilder().setTitle('🎫 Support').setDescription('Click to create ticket').setColor(0x0099FF);
        const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('create_ticket').setLabel('Create').setStyle(ButtonStyle.Primary));
        await interaction.reply({ embeds: [embed], components: [btn] });
        break;

      case 'ticket':
        const ch = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            ...staffRoleIds.map(rid => ({ id: rid, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
          ]
        });
        await interaction.reply({ content: `✅ Ticket: ${ch}`, ephemeral: true });
        break;

      case 'confess':
        const cbtn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('confess_button').setLabel('Send').setStyle(ButtonStyle.Danger));
        await interaction.reply({ content: 'Send anonymous confession', components: [cbtn], ephemeral: true });
        break;

      case 'stats':
        const sembed = new EmbedBuilder().setTitle('📊 Stats').setColor(0x00FF00).addFields(
          { name: 'Members', value: interaction.guild.memberCount.toString(), inline: true },
          { name: 'Channels', value: interaction.guild.channels.cache.size.toString(), inline: true },
          { name: 'Roles', value: interaction.guild.roles.cache.size.toString(), inline: true }
        );
        await interaction.reply({ embeds: [sembed] });
        break;

      case 'ranking':
        const ranking = Array.from(stats.values()).sort((a, b) => b.messages - a.messages).slice(0, 10).map((u, i) => `${i + 1}. ${u.name}: ${u.messages}`).join('\n') || 'No data';
        const rembed = new EmbedBuilder().setTitle('🏆 Ranking').setDescription(ranking).setColor(0xFFD700);
        await interaction.reply({ embeds: [rembed] });
        break;

      case 'say':
        await interaction.reply(interaction.options.getString('message'));
        break;

      case 'regole':
        const remote = new EmbedBuilder().setTitle('📋 Rules').setDescription('1. Respect\n2. No Spam\n3. No Harassment').setColor(0x0099FF);
        await interaction.reply({ embeds: [remote] });
        break;

      case 'renamevoc':
        const emoji = interaction.options.getString('emoji');
        const vocs = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice);
        vocs.forEach(async (c) => { try { await c.setName(`${emoji} ${c.name}`); } catch (e) {} });
        await interaction.reply('✅ Renamed');
        break;

      case 'setwelcome':
        await interaction.reply(`✅ Welcome: ${interaction.options.getChannel('channel')}`);
        break;

      case 'setgoodbye':
        await interaction.reply(`✅ Goodbye: ${interaction.options.getChannel('channel')}`);
        break;

      default:
        await interaction.reply({ content: 'Unknown', ephemeral: true });
    }
  } catch (error) {
    console.error('Error:', error);
    try { await interaction.reply({ content: 'Error', ephemeral: true }); } catch (e) {}
  }
});

client.login(token);
console.log('🚀 Bot loading...');
