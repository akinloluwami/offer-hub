import { supabase } from "@/lib/supabase/supabase";
import { AppError, BadRequestError, ConflictError, InternalServerError } from "@/utils/AppError";
import { CreateUserDTO } from "@/types/user.types";

class UserService {
    async createUser(data: CreateUserDTO) {
    // Verify unique wallet_address
    const { data: walletUser } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", data.wallet_address)
        .single();

    if (walletUser) throw new ConflictError("Wallet_address_already_registered");

    // Verify unique username
    const { data: usernameUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", data.username)
        .single();

    if (usernameUser) throw new ConflictError("Username_already_taken");

    const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{
        wallet_address: data.wallet_address,
        username: data.username,
        name: data.name,
        bio: data.bio,
        email: data.email,
        is_freelancer: data.is_freelancer ?? false,
        }])
        .select()
        .single();

        if (insertError) throw new InternalServerError("Error_creating_user");
        
        return newUser;
    }

    async getUserById(id: string) {
        const { data, error } = await supabase
            .from("users")
            .select("id, wallet_address, username, name, bio, is_freelancer")
            .eq("id", id)
            .single();

        if (error) return null;

        return data;
    }

    async updateUser(id: string, updates: Partial<CreateUserDTO>) {
        // Do not allow changes to wallet_address or is_freelancer
        if ('wallet_address' in updates || 'is_freelancer' in updates) {
        throw new BadRequestError("Cannot_update_restricted_fields");
        }

        // Validate unique username
        if (updates.username) {
        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("username", updates.username)
            .neq("id", id)
            .single();

        if (existing) throw new ConflictError("Username_already_taken");
        }

        const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

        if (error) throw new InternalServerError("Error_updating_user");
        return data;
    }
}

export const userService = new UserService();