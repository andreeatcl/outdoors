import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Trash2, ShieldCheck, Shield } from "lucide-react";
import api from "../../services/api";
import { formatDate } from "../../utils/formatters";
import {
  PAGE_SIZE,
  ConfirmDialog,
  SearchInput,
  Pagination,
} from "./AdminShared";

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback((pageNum, query) => {
    api
      .get("/api/admin/users", {
        params: { page: pageNum, limit: PAGE_SIZE, q: query || undefined },
      })
      .then(({ data }) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch(() => toast.error("Eroare la încărcarea utilizatorilor."));
  }, []);

  useEffect(() => {
    load(page, q);
  }, [load, page, q]);

  const handleRoleToggle = (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    api
      .patch(`/api/admin/users/${user.user_id}/role`, { role: newRole })
      .then(() => {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === user.user_id ? { ...u, role: newRole } : u,
          ),
        );
        toast.success(
          newRole === "admin" ? "Promovat la admin." : "Rol de admin eliminat.",
        );
      })
      .catch((err) =>
        toast.error(err.response?.data?.error ?? "Eroare la actualizare."),
      );
  };

  const handleDelete = (user) => {
    api
      .delete(`/api/admin/users/${user.user_id}`)
      .then(() => {
        toast.success("Utilizator șters.");
        setPendingDelete(null);
        load(page, q);
      })
      .catch((err) => {
        toast.error(err.response?.data?.error ?? "Eroare la ștergere.");
        setPendingDelete(null);
      });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <SearchInput
        value={q}
        onChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        placeholder="Caută după nume, username sau email..."
      />

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background text-text-muted text-left">
              <th className="px-3 py-2 font-medium">Nume</th>
              <th className="px-3 py-2 font-medium">Username</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Înregistrat</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 font-medium text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-text-muted"
                >
                  Niciun utilizator găsit.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="border-t border-border/60">
                  <td className="px-3 py-2 text-text-primary">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-3 py-2 text-text-muted">@{u.username}</td>
                  <td className="px-3 py-2 text-text-muted">{u.email}</td>
                  <td className="px-3 py-2 text-text-muted">
                    {formatDate(u.creation_date, "d MMM yyyy")}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleRoleToggle(u)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        u.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-border/50 text-text-muted"
                      }`}
                      title="Comută rolul de admin"
                    >
                      {u.role === "admin" ? (
                        <ShieldCheck size={12} />
                      ) : (
                        <Shield size={12} />
                      )}
                      {u.role === "admin" ? "admin" : "user"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setPendingDelete(u)}
                      className="text-text-muted hover:text-red-600 p-1"
                      title="Șterge utilizator"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        summary={`${total} utilizatori`}
        onPageChange={setPage}
      />

      {pendingDelete && (
        <ConfirmDialog
          message={`Sigur ștergi contul lui ${pendingDelete.first_name} ${pendingDelete.last_name}? Acțiunea este ireversibilă.`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
