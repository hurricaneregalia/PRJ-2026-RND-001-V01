import { ACCOUNT_STATUSES, USER_ROLES } from '@/lib/domain-constants';
import { validateFields } from '@/lib/field-validation';
import { createTableRepository } from '@/repositories/sheet-table-repository';

const fields = {
  auth_user_id: { type: 'string', required: true, maxLength: 200 },
  email: { type: 'email', required: true },
  name: { type: 'string', required: true, maxLength: 200 },
  role: { type: 'enum', required: true, allowedValues: USER_ROLES },
  account_status: {
    type: 'enum',
    required: true,
    allowedValues: ACCOUNT_STATUSES,
  },
  photo_url: { type: 'string', maxLength: 1000 },
  no_hp: { type: 'string', maxLength: 30 },
  limit_kelas: { type: 'integer', min: 0, max: 10000 },
};

const repository = createTableRepository({
  tableName: 'users',
  idColumn: 'user_id',
  fields,
  uniqueKeys: [['auth_user_id'], ['email']],
  deleteMode: { type: 'soft', field: 'account_status', value: 'inactive' },
  validateCreate: (data) =>
    validateFields(
      data.account_status === undefined
        ? { account_status: 'active', ...data }
        : data,
      fields,
      { label: 'users' },
    ),
  validateUpdate: (data) =>
    validateFields(data, fields, { partial: true, label: 'users' }),
});

export const listUsers = () => repository.list();
export const getUserById = (userId) => repository.findById(userId);
export const findUserByEmail = (email) =>
  repository.findOne(
    (record) => record.email === String(email ?? '').trim().toLowerCase(),
  );
export const createUser = (data) => repository.create(data);
export const updateUser = (userId, data) => repository.update(userId, data);
export const deactivateUser = (userId) => repository.remove(userId);

// Kept for the existing NextAuth integration contract.
export async function findUserByAuthId(authUserId) {
  const id = String(authUserId ?? '').trim();

  if (!id) {
    return null;
  }

  return repository.findOne((record) => record.auth_user_id === id);
}

export async function isUserBootstrapAvailable() {
  return (await repository.count()) === 0;
}
