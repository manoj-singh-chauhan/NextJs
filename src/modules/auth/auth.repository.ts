import { UserModel } from "./auth.model";
import { SignupInput } from "./auth.types";

export const authRepository = {
  async findUserByEmail(email: string) {
    return await UserModel.findOne({ email });
  },

  async createUser(
   data: SignupInput
  ) {
    return await UserModel.create({
      ...data,
      isVerified: data.isVerified ?? false,
    });
  },

  async updateUser(email: string, updateData: Record<string, unknown>) {
    return await UserModel.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true },
    );
  },

  async findUserWithPassword(email: string) {
    return await UserModel.findOne({ email }).select("+password");
  },
};
