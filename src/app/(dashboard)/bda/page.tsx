"use client";

import { useState, useEffect, useCallback } from "react";

interface BDAEntry {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  joinedAt: string;
  status: string;
  handledBy: string | null;
  handledAt: string | null;
  waitTime: number | null;
  leftAt: string | null;
}

interface Stats {
  today: number;
  week: number;
  month: number;
  avgWaitTime: string;
  avgHandleTime: string;
  staffRanking: { name: string; count: number }[];
  totalHandled: number;
}

function formatWait(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `il y a ${h}h ${m}m`;
  if (m > 0) return `il y a ${m}m`;
  return `il y a ${diff}s`;
}

export default function BDAPage() {
  const [entries, setEntries] = useState<BDAEntry[]>([]);
  const [allEntries, setAllEntries] = useState<BDAEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"waiting" | "history" | "stats">("waiting");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStaff, setFilterStaff] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchEntries = useCallback(async () => {
    try {
      const [activeRes, allRes] = await Promise.all([
        fetch("/api/bda?status=waiting"),
        fetch("/api/bda?status=handled"),
      ]);
      const [activeData, allData] = await Promise.all([
        activeRes.json(),
        allRes.json(),
      ]);
      if (activeData.entries) setEntries(activeData.entries);
      if (allData.entries) setAllEntries(allData.entries);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/bda/stats");
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchStats();
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, [fetchEntries, fetchStats]);

  const handleTake = async (id: string) => {
    try {
      await fetch("/api/bda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchEntries();
      fetchStats();
    } catch {
      // silently fail
    }
  };

  const filteredHistory = allEntries.filter((e) => {
    if (search && !e.username.toLowerCase().includes(search.toLowerCase()) && !(e.handledBy || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDate && !e.handledAt?.startsWith(filterDate) && !e.joinedAt.startsWith(filterDate)) return false;
    if (filterStaff && e.handledBy !== filterStaff) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    return true;
  });

  const uniqueStaff = [...new Set(allEntries.map((e) => e.handledBy).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion BDA</h1>
        <div className="flex gap-2">
          {(["waiting", "history", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {tab === "waiting" && `En attente (${entries.length})`}
              {tab === "history" && "Historique"}
              {tab === "stats" && "Statistiques"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "waiting" && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Chargement...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🟢</div>
              <p className="text-gray-500 text-lg">Aucune personne en attente</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Personne</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Discord ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Arrivée</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Attente</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 flex items-center gap-2">
                        {e.avatar ? (
                          <img src={e.avatar} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm text-blue-600 font-medium">
                            {e.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{e.username}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{e.discordId}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(e.joinedAt).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-orange-600">
                          {formatWait(Math.floor((Date.now() - new Date(e.joinedAt).getTime()) / 1000))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTake(e.id)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          Prendre en charge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Rechercher par pseudo ou staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tous les staffs</option>
                {uniqueStaff.map((s) => (
                  <option key={s} value={s!}>{s}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="handled">Pris en charge</option>
                <option value="waiting">En attente</option>
                <option value="left">Parti</option>
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucun historique trouvé</div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Personne</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Staff</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Arrivée</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Prise en charge</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Attente</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((e) => (
                    <tr key={e.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 flex items-center gap-2">
                        {e.avatar ? (
                          <img src={e.avatar} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm text-blue-600 font-medium">
                            {e.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{e.username}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{e.handledBy || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(e.joinedAt).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {e.handledAt ? new Date(e.handledAt).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" }) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-orange-600">
                        {e.waitTime != null ? formatWait(e.waitTime) : e.status === "waiting" ? formatWait(Math.floor((Date.now() - new Date(e.joinedAt).getTime()) / 1000)) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(e.joinedAt).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          e.status === "handled" ? "bg-green-100 text-green-700" :
                          e.status === "waiting" ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {e.status === "handled" ? "Pris en charge" : e.status === "waiting" ? "En attente" : "Parti"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-4">
          {stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border p-5">
                  <div className="text-sm text-gray-500 mb-1">Aujourd&apos;hui</div>
                  <div className="text-3xl font-bold">{stats.today}</div>
                </div>
                <div className="bg-white rounded-xl border p-5">
                  <div className="text-sm text-gray-500 mb-1">Cette semaine</div>
                  <div className="text-3xl font-bold">{stats.week}</div>
                </div>
                <div className="bg-white rounded-xl border p-5">
                  <div className="text-sm text-gray-500 mb-1">Ce mois-ci</div>
                  <div className="text-3xl font-bold">{stats.month}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border p-5">
                  <div className="text-sm text-gray-500 mb-1">Temps moyen d&apos;attente</div>
                  <div className="text-2xl font-bold text-orange-600">{stats.avgWaitTime}</div>
                </div>
                <div className="bg-white rounded-xl border p-5">
                  <div className="text-sm text-gray-500 mb-1">Temps moyen de prise en charge</div>
                  <div className="text-2xl font-bold text-green-600">{stats.avgHandleTime}</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold mb-4">Classement des staffs</h3>
                {stats.staffRanking.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune donnée</p>
                ) : (
                  <div className="space-y-2">
                    {stats.staffRanking.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                            i === 0 ? "bg-yellow-100 text-yellow-700" :
                            i === 1 ? "bg-gray-100 text-gray-600" :
                            i === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-gray-50 text-gray-500"
                          }`}>
                            {i + 1}
                          </span>
                          <span className="font-medium">{s.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{s.count} prise{s.count > 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">Chargement des statistiques...</div>
          )}
        </div>
      )}
    </div>
  );
}
