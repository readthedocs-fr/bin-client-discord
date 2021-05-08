import { GuildMemberManager, PartialUser, PermissionResolvable, User } from "discord.js";

export async function hasPermissions(
	memberManager: GuildMemberManager,
	user: User | PartialUser,
	permissions: PermissionResolvable,
): Promise<boolean> {
	try {
		const member = await memberManager.fetch(user.id);
		return member.permissions.has(permissions);
	} catch {
		return false;
	}
}
