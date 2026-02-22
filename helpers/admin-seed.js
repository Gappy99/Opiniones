import {
  User,
  UserProfile,
  UserEmail,
  UserPasswordReset,
} from '../src/users/user.model.js';
import { ADMIN_ROLE } from './role-constants.js';
import { Role, UserRole } from '../src/auth/role.model.js';
import { hashPassword } from '../utils/password-utils.js';
import { generateJWT } from './generate-jwt.js';
import { sequelize } from '../configs/db.js';
import { getDefaultAvatarPath } from './cloudinary-service.js';
import { findUserById } from './user-db.js';
import { setUserSingleRole } from './role-db.js';

const getAdminConfig = () => {
  return {
    name: process.env.ADMIN_NAME || 'Admin',
    surname: process.env.ADMIN_SURNAME || 'User',
    username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
    email: (process.env.ADMIN_EMAIL || 'admin@local.test').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin1234',
    phone: process.env.ADMIN_PHONE || '00000000',
  };
};

const findAdminUser = async (email, username) => {
  let user = await User.findOne({ where: { Email: email } });
  if (!user) {
    user = await User.findOne({ where: { Username: username } });
  }
  return user;
};

const ensureUserRecords = async (userId, phone, profilePicture, transaction) => {
  const profile = await UserProfile.findOne({
    where: { UserId: userId },
    transaction,
  });
  if (!profile) {
    await UserProfile.create(
      {
        UserId: userId,
        Phone: phone,
        ProfilePicture: profilePicture,
      },
      { transaction }
    );
  }

  const email = await UserEmail.findOne({
    where: { UserId: userId },
    transaction,
  });
  if (!email) {
    await UserEmail.create(
      {
        UserId: userId,
        EmailVerified: true,
        EmailVerificationToken: null,
        EmailVerificationTokenExpiry: null,
      },
      { transaction }
    );
  }

  const reset = await UserPasswordReset.findOne({
    where: { UserId: userId },
    transaction,
  });
  if (!reset) {
    await UserPasswordReset.create(
      {
        UserId: userId,
      },
      { transaction }
    );
  }
};

export const ensureAdminUser = async () => {
  const admin = getAdminConfig();
  const defaultAvatar = getDefaultAvatarPath();

  const existing = await findAdminUser(admin.email, admin.username);

  if (!existing) {
    await sequelize.transaction(async (t) => {
      const passwordHash = await hashPassword(admin.password);

      const created = await User.create(
        {
          Name: admin.name,
          Surname: admin.surname,
          Username: admin.username,
          Email: admin.email,
          Password: passwordHash,
          Status: true,
        },
        { transaction: t }
      );

      await ensureUserRecords(
        created.Id,
        admin.phone,
        defaultAvatar,
        t
      );

      const role = await Role.findOne(
        { where: { Name: ADMIN_ROLE } },
        { transaction: t }
      );
      if (role) {
        await UserRole.create(
          {
            UserId: created.Id,
            RoleId: role.Id,
          },
          { transaction: t }
        );
      }
    });
  } else {
    await sequelize.transaction(async (t) => {
      await User.update(
        { Status: true },
        { where: { Id: existing.Id }, transaction: t }
      );
      await UserEmail.update(
        {
          EmailVerified: true,
          EmailVerificationToken: null,
          EmailVerificationTokenExpiry: null,
        },
        { where: { UserId: existing.Id }, transaction: t }
      );

      await ensureUserRecords(existing.Id, admin.phone, defaultAvatar, t);
    });
  }

  const adminUser = existing || (await findAdminUser(admin.email, admin.username));
  if (!adminUser) {
    throw new Error('Default admin user could not be created');
  }

  const fullUser = await findUserById(adminUser.Id);
  await setUserSingleRole(fullUser, ADMIN_ROLE, sequelize);

  const token = await generateJWT(fullUser.Id.toString(), {
    role: ADMIN_ROLE,
  });

  return {
    id: fullUser.Id,
    email: fullUser.Email,
    username: fullUser.Username,
    token,
  };
};