/** Shape of every public id (survey and response): lowercase letters, digits and hyphens. */
export const ID_BODY = '[a-z0-9-]{1,40}';
export const ID_PATTERN = new RegExp(`^${ID_BODY}$`);
