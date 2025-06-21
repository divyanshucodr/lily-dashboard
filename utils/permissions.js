const roles = require('../config/roles');

function checkPermissions(member, command) {
    // Get user's permission level
    const userLevel = getUserPermissionLevel(member);
    
    // Get required permission level for command
    const requiredLevel = roles.COMMAND_PERMISSIONS[command] || 1;
    
    return userLevel >= requiredLevel;
}

function getUserPermissionLevel(member) {
    // Check roles in order of priority
    if (member.roles.cache.has(roles.OWNER)) return roles.PERMISSIONS.OWNER;
    if (member.roles.cache.has(roles.CO_OWNER)) return roles.PERMISSIONS.CO_OWNER;
    if (member.roles.cache.has(roles.MODERATOR)) return roles.PERMISSIONS.MODERATOR;
    if (member.roles.cache.has(roles.JR_MODERATOR)) return roles.PERMISSIONS.JR_MODERATOR;
    if (member.roles.cache.has(roles.NIVAAN_STAFF)) return roles.PERMISSIONS.NIVAAN_STAFF;
    
    // Check if user has administrator permission
    if (member.permissions.has('Administrator')) return roles.PERMISSIONS.MODERATOR;
    
    return 0; // No permissions
}

function hasRole(member, roleName) {
    const roleId = roles[roleName.toUpperCase()];
    return member.roles.cache.has(roleId);
}

module.exports = {
    checkPermissions,
    getUserPermissionLevel,
    hasRole
};
