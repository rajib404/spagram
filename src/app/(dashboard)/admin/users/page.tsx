"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  lastActiveAt: string | null;
  therapistProfile: { id: string; displayName: string; isActive: boolean; isVerified: boolean } | null;
  bookingCount: number;
  reviewCount: number;
}

const ROLE_COLORS: Record<string, string> = {
  CLIENT: "bg-blue-50 text-blue-700 border-blue-200",
  THERAPIST: "bg-purple-50 text-purple-700 border-purple-200",
  ADMIN: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleRoleChange(userId: string, role: string) {
    setActionId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Role updated");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionId(null);
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    setActionId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(isActive ? "User activated" : "User deactivated");
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
        <p className="text-neutral-500 mt-1">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input max-w-xs"
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input max-w-[140px]">
          <option value="">All roles</option>
          <option value="CLIENT">Client</option>
          <option value="THERAPIST">Therapist</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 font-medium text-neutral-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden lg:table-cell">Activity</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-neutral-100 rounded animate-pulse" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-neutral-900">{u.name || "—"}</p>
                        <p className="text-xs text-neutral-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", ROLE_COLORS[u.role])}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.therapistProfile ? (
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", u.therapistProfile.isActive ? "bg-green-500" : "bg-neutral-300")} />
                          <span className="text-xs text-neutral-600">
                            {u.therapistProfile.isActive ? "Active" : "Inactive"}
                            {u.therapistProfile.isVerified && " / Verified"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-xs text-neutral-500">
                        <p>{u.bookingCount} bookings, {u.reviewCount} reviews</p>
                        <p className="text-neutral-400">Joined {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={actionId === u.id}
                          className="text-xs border border-neutral-200 rounded-md px-2 py-1 bg-white disabled:opacity-50"
                        >
                          <option value="CLIENT">Client</option>
                          <option value="THERAPIST">Therapist</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        {u.therapistProfile && (
                          <button
                            onClick={() => handleToggleActive(u.id, !u.therapistProfile!.isActive)}
                            disabled={actionId === u.id}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-md font-medium disabled:opacity-50 transition-colors",
                              u.therapistProfile.isActive
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            )}
                          >
                            {u.therapistProfile.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-neutral-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-neutral-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="text-xs px-3 py-1 border border-neutral-200 rounded-md disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="text-xs px-3 py-1 border border-neutral-200 rounded-md disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
