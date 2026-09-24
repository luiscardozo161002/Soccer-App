import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/auth/roles";
import { ApiError, notFoundError } from "@/lib/errors";
import { optimizeImageFromDataUrl } from "@/lib/utils/images";
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
    if (dto.photo) {
      const { buffer, type } = await optimizeImageFromDataUrl(dto.photo);
      data.photo = Uint8Array.from(buffer);
      data.photoType = type;
      data.photoUpdatedAt = new Date();
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
    if (dto.photo) {
      const { buffer, type } = await optimizeImageFromDataUrl(dto.photo);
      data.photo = Uint8Array.from(buffer);
      data.photoType = type;
      data.photoUpdatedAt = new Date();
    } else if (dto.photo === null) {
      data.photo = null;
      data.photoType = null;
      data.photoUpdatedAt = new Date();
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
