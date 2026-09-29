import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/auth/roles";
import { ApiError, notFoundError } from "@/lib/errors";
import { resolveImageUpdate } from "@/lib/utils/images";
import type { CreateUserDto, ListUsersQuery, UpdateUserDto } from "../user.schema";
import { userRepository, type UserWriteData } from "./user.repository";

async function getUserById(id: string) {
  const user = await userRepository.findById(id);
  if (!user) throw notFoundError("USER_NOT_FOUND", "el usuario", id);
  return user;
}

export const userService = {
  async list(query: ListUsersQuery) {
    const [items, totalItems] = await Promise.all([
      userRepository.findMany(query),
      userRepository.count(query.role),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },
  getById: getUserById,
  async create(dto: CreateUserDto) {
    if (await userRepository.findByUsernameOrEmailPair(dto.username, dto.email)) {
      throw new ApiError(409, "USER_ALREADY_EXISTS", "Ya existe un usuario con ese nombre de usuario o correo");
    }

    const data: UserWriteData & { username: string; email: string; passwordHash: string; role: Role } = {
      username: dto.username,
      email: dto.email,
      phoneNumber: dto.phoneNumber || undefined,
      passwordHash: hashPassword(dto.password),
      role: dto.role,
    };
    const createPhotoUpdate = await resolveImageUpdate(dto.photo);
    if (createPhotoUpdate) {
      data.photo = createPhotoUpdate.bytes;
      data.photoType = createPhotoUpdate.type;
      data.photoUpdatedAt = createPhotoUpdate.updatedAt;
    }
    return userRepository.create(data);
  },
  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const user = await getUserById(id);

    if (dto.username || dto.email) {
      const existing = await userRepository.findByUsernameOrEmailExcluding(
        dto.username ?? user.username,
        dto.email ?? user.email,
        id
      );
      if (existing) {
        throw new ApiError(409, "USER_ALREADY_EXISTS", "Ya existe un usuario con ese nombre de usuario o correo");
      }
    }

    if (dto.status === "inactive") {
      if (id === currentUserId) {
        throw new ApiError(409, "CANNOT_DEACTIVATE_SELF", "No puedes desactivar tu propia cuenta");
      }
      if (user.role === "admin" && (await userRepository.countActive("admin")) <= 1) {
        throw new ApiError(409, "LAST_ACTIVE_ADMIN", "No puedes desactivar al único administrador activo");
      }
    }

    const data: UserWriteData = {
      username: dto.username,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      role: dto.role,
      status: dto.status,
    };
    const updatePhotoUpdate = await resolveImageUpdate(dto.photo);
    if (updatePhotoUpdate) {
      data.photo = updatePhotoUpdate.bytes;
      data.photoType = updatePhotoUpdate.type;
      data.photoUpdatedAt = updatePhotoUpdate.updatedAt;
    }
    return userRepository.update(id, data);
  },
  async remove(id: string, currentUserId: string) {
    const user = await getUserById(id);
    if (id === currentUserId) {
      throw new ApiError(409, "CANNOT_DELETE_SELF", "No puedes eliminar tu propia cuenta");
    }
    if (user.role === "admin" && (await userRepository.count("admin")) <= 1) {
      throw new ApiError(409, "LAST_ADMIN", "No puedes eliminar al único administrador");
    }
    await userRepository.delete(id);
  },
};
