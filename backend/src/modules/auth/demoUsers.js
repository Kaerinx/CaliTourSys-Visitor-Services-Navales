import bcrypt from 'bcryptjs'

import { ROLES } from '../../middleware/auth.js'

const demoPasswordHash = bcrypt.hashSync('password123', 10)

export const demoUsers = Object.freeze([
  {
    id: 'USR-STAFF',
    fullName: 'Tourism Staff Demo',
    username: 'staff',
    passwordHash: demoPasswordHash,
    role: ROLES.TOURISM_STAFF,
    accountStatus: 'Active',
  },
  {
    id: 'USR-OFFICER',
    fullName: 'Tourism Officer Demo',
    username: 'officer',
    passwordHash: demoPasswordHash,
    role: ROLES.TOURISM_OFFICER,
    accountStatus: 'Active',
  },
  {
    id: 'USR-LGU',
    fullName: 'LGU Official Demo',
    username: 'lgu',
    passwordHash: demoPasswordHash,
    role: ROLES.LGU_OFFICIAL,
    accountStatus: 'Active',
  },
  {
    id: 'USR-ADMIN',
    fullName: 'System Administrator Demo',
    username: 'admin',
    passwordHash: demoPasswordHash,
    role: ROLES.SYSTEM_ADMINISTRATOR,
    accountStatus: 'Active',
  },
])
