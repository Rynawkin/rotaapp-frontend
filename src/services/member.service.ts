// frontend/src/services/member.service.ts

import { api } from './api';

export interface Member {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    isDriver: boolean;
    isDispatcher: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isOnboarded: boolean;
    workspaceId: number;
    depotId?: number;
    isRegistered: boolean;
}

export interface CreateMemberRequest {
    depotId: number;
    fullName: string;
    email: string;
    roles: number[]; // 1=Admin, 10=Dispatcher, 20=Driver
}

export interface UpdateMemberRequest {
    depotId?: number;
    roles?: number[];
}

export interface UpdateMemberRoleRequest {
    roles: number[];
}

export interface CreateDispatcherRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  depotId?: number;
}


class MemberService {
    // Get all members
    async getMembers(filters?: {
        isDriver?: boolean;
        isDispatcher?: boolean;
        isAdmin?: boolean;
        searchQuery?: string;
    }): Promise<Member[]> {
        const params = new URLSearchParams();
        if (filters?.isDriver !== undefined) params.append('isDriver', filters.isDriver.toString());
        if (filters?.isDispatcher !== undefined) params.append('isDispatcher', filters.isDispatcher.toString());
        if (filters?.isAdmin !== undefined) params.append('isAdmin', filters.isAdmin.toString());
        if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery);

        const response = await api.get(`/members${params.toString() ? `?${params}` : ''}`);
        return response.data;
    }

    // Create a new member (invite)
    async createMember(data: CreateMemberRequest): Promise<string> {
        const response = await api.post('/members/invite', data);
        return response.data; // Returns invitation token
    }

    async createDispatcher(data: CreateDispatcherRequest): Promise<Member> {
        const response = await api.post('/members/create-dispatcher', data);
        return response.data;
    }
    
    // Save invited member (complete signup)
    async saveInvitedMember(token: string, password: string): Promise<any> {
        const response = await api.post(`/members/save-invited?token=${token}`, { password });
        return response.data;
    }

    // Update member
    async updateMember(userId: string, data: UpdateMemberRequest): Promise<Member> {
        const response = await api.put(`/members/${userId}`, data);
        return response.data;
    }

    // Update member roles
    async updateMemberRoles(userId: string, roles: number[]): Promise<Member> {
        const response = await api.put(`/members/${userId}/roles`, { roles });
        return response.data;
    }

    // Update member depot
    async updateMemberDepot(userId: string, depotId: number): Promise<Member> {
        const response = await api.put(`/members/${userId}/depot`, { depotId });
        return response.data;
    }

    // Delete member (soft delete)
    async deleteMember(userId: string): Promise<void> {
        await api.delete(`/members/${userId}`);
    }
}

export const memberService = new MemberService();