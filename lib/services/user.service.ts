import { ApiError } from "@/lib/errors";
import { userRepository } from "@/lib/repositories/user.repository";
import { hashPassword } from "@/lib/auth/password";
import type { CreateUserDto, ListUsersQuery, UpdateUserDto } from "@/lib/validation/user.schema";

export const userService = {
  async list(query: ListUsersQuery) {
    const [items, totalItems] = await Promise.all([userRepository.findMany(query), userRepository.count()]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", `No user exists with id ${id}`);
    return user;
  },

  async create(dto: CreateUserDto) {
    const existing = await userRepository.findByUsernameOrEmailPair(dto.username, dto.email);
    if (existing) {
      throw new ApiError(409, "USER_ALREADY_EXISTS", "Ya existe un usuario con ese nombre de usuario o correo");
    }
    return userRepository.create({ ...dto, passwordHash: hashPassword(dto.password) });
  },

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const user = await this.getById(id);

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
      const activeCount = await userRepository.countActive();
      if (activeCount <= 1) {
        throw new ApiError(409, "LAST_ACTIVE_ADMIN", "No puedes desactivar al único administrador activo");
      }
    }

    return userRepository.update(id, dto);
  },

  async remove(id: string, currentUserId: string) {
    await this.getById(id);
    if (id === currentUserId) {
      throw new ApiError(409, "CANNOT_DELETE_SELF", "No puedes eliminar tu propia cuenta");
    }
    const total = await userRepository.count();
    if (total <= 1) {
      throw new ApiError(409, "LAST_ADMIN", "No puedes eliminar al único administrador");
    }
    await userRepository.delete(id);
  },
};
