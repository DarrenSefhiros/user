import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Sidebar from "../Sidebar";
import api from "../../src/utils/api";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatIndoDate(date) {
  if (!date) return "";
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

// ---- Helper: parse berbagai format tanggal lahir yang mungkin tersimpan ----
// Mendukung: yyyy-mm-dd (input type="date"), dd/mm/yyyy, dd-mm-yyyy,
// dan format teks "2 Juni 2020". Kalau tidak ada yang cocok, coba fallback ke Date bawaan.
function parseTanggalLahir(str) {
  if (!str) return null;

  // Format ISO: yyyy-mm-dd
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // Format dd/mm/yyyy atau dd-mm-yyyy
  const numMatch = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(str);
  if (numMatch) {
    const [, d, m, y] = numMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // Format teks: "2 Juni 2020"
  const textMatch = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(str);
  if (textMatch) {
    const [, d, monthName, y] = textMatch;
    const monthIndex = MONTH_NAMES.findIndex(
      (m) => m.toLowerCase() === monthName.toLowerCase()
    );
    if (monthIndex !== -1) {
      return new Date(Number(y), monthIndex, Number(d));
    }
  }

  // Fallback terakhir
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// ---- Helper: cek apakah sebuah tanggal berada dalam rentang [from, to] (inklusif) ----
function isDateInRange(date, from, to) {
  if (!date || !from || !to) return false;
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const t = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return d >= f && d <= t;
}

// ---- Helper: tanggal N hari yang lalu dari sekarang ----
function getDateNDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ---- Helper: parse createdAt (ISO string) jadi Date ----
function parseCreatedAt(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function getCalendarMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startWeekday; i > 0; i--) {
    const day = daysInPrevMonth - i + 1;
    cells.push({ day, current: false, date: new Date(year, month - 1, day) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ day: nextDay, current: false, date: new Date(year, month + 1, nextDay) });
    nextDay++;
  }
  return cells;
}

// ---- Date Range Picker (mengikuti tampilan gambar: 2 kalender berdampingan) ----
function DateRangePicker({ initialFrom, initialTo, onApply }) {
  const [tempFrom, setTempFrom] = useState(initialFrom || null);
  const [tempTo, setTempTo] = useState(initialTo || null);
  const [leftView, setLeftView] = useState(initialFrom || new Date());
  const [rightView, setRightView] = useState(initialTo || new Date());

  const handleDayClick = (date) => {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(date);
      setTempTo(null);
    } else if (date < tempFrom) {
      setTempFrom(date);
      setTempTo(null);
    } else {
      setTempTo(date);
    }
  };

  const renderMonth = (viewDate, setView) => {
    const cells = getCalendarMatrix(viewDate.getFullYear(), viewDate.getMonth());
    return (
      <div style={{ width: "260px" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button
            type="button"
            className="btn btn-sm btn-light border-0"
            onClick={() => setView(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="fw-semibold" style={{ color: "#1D2939" }}>
            {MONTH_NAMES[viewDate.getMonth()]}, {viewDate.getFullYear()}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-light border-0"
            onClick={() => setView(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: "4px" }}>
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-muted small fw-semibold">
              {d}
            </div>
          ))}
          {cells.map((cell, idx) => {
            const isFrom = tempFrom && isSameDay(cell.date, tempFrom);
            const isTo = tempTo && isSameDay(cell.date, tempTo);
            const inRange =
              tempFrom && tempTo && cell.date > tempFrom && cell.date < tempTo;
            return (
              <div key={idx} className="text-center" style={{ padding: "2px 0" }}>
                <button
                  type="button"
                  onClick={() => handleDayClick(cell.date)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "none",
                    fontSize: "0.85rem",
                    backgroundColor: isFrom || isTo ? "#0B2B8E" : inRange ? "#E6F0FF" : "transparent",
                    color: isFrom || isTo ? "#fff" : cell.current ? "#1D2939" : "#C0C5D0",
                    fontWeight: isFrom || isTo ? 700 : 400,
                  }}
                >
                  {cell.day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white p-4"
      style={{
        borderRadius: "16px",
        boxShadow: "0 8px 30px rgba(16,24,40,0.2)",
        position: "absolute",
        zIndex: 1100,
        top: "48px",
        left: 0,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="d-flex gap-4">
        {renderMonth(leftView, setLeftView)}
        {renderMonth(rightView, setRightView)}
      </div>
      <div className="row g-2 mt-3">
        <div className="col-6">
          <label className="text-muted small mb-1 d-block">Dari</label>
          <div className="input-group">
            <input
              className="form-control"
              style={{ borderRadius: "8px 0 0 8px" }}
              readOnly
              value={tempFrom ? formatIndoDate(tempFrom) : ""}
            />
            <span className="input-group-text bg-white" style={{ borderRadius: "0 8px 8px 0" }}>
              <i className="bi bi-calendar text-muted"></i>
            </span>
          </div>
        </div>
        <div className="col-6">
          <label className="text-muted small mb-1 d-block">Sampai</label>
          <div className="input-group">
            <input
              className="form-control"
              style={{ borderRadius: "8px 0 0 8px" }}
              readOnly
              value={tempTo ? formatIndoDate(tempTo) : ""}
            />
            <span className="input-group-text bg-white" style={{ borderRadius: "0 8px 8px 0" }}>
              <i className="bi bi-calendar text-muted"></i>
            </span>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-3">
        <button
          type="button"
          className="btn btn-link text-muted text-decoration-none p-0"
          onClick={() => {
            setTempFrom(null);
            setTempTo(null);
          }}
        >
          Hapus Filter
        </button>
        <button
          type="button"
          className="btn fw-semibold px-4"
          style={{ backgroundColor: "#0B2B8E", color: "#fff", borderRadius: "8px" }}
          disabled={!tempFrom || !tempTo}
          onClick={() => onApply(tempFrom, tempTo)}
        >
          TERAPKAN
        </button>
      </div>
    </div>
  );
}

export default function User() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [slideDir, setSlideDir] = useState("left");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal detail
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Modal nonaktifkan (hapus + alasan)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateTargetId, setDeactivateTargetId] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");

  // Modal aktifkan kembali
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateTargetId, setActivateTargetId] = useState(null);

  // Modal hapus permanen (khusus data di tab Non Active)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Date range filter -> memfilter tabel berdasarkan TANGGAL BERGABUNG (createdAt) user.
  // Default null artinya belum ada filter tanggal yang aktif (semua data tampil).
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- INTEGRASI KE BACKEND FALCON (GET /users) ----
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      if (response.data.status) {
        setUsers(response.data.data);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Tidak dapat terhubung ke server backend.",
        confirmButtonColor: "#0B2B8E",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Ambil data saat komponen pertama kali dimuat, dan sinkronkan ulang
  // setiap kali halaman ini difokuskan lagi (misalnya setelah kembali
  // dari halaman /buatuser atau /editdata)
  useEffect(() => {
    fetchUsers();
    window.addEventListener("focus", fetchUsers);
    return () => window.removeEventListener("focus", fetchUsers);
  }, []);

  // Reset ke halaman 1 setiap kali pencarian / tab / filter tanggal berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, dateRange]);

  // Buka modal konfirmasi nonaktifkan (ganti pengganti handleDelete lama)
  const openDeactivateModal = (id) => {
    setDeactivateTargetId(id);
    setDeactivateReason("");
    setShowDeactivateModal(true);
  };

  const closeDeactivateModal = () => {
    setShowDeactivateModal(false);
    setDeactivateTargetId(null);
    setDeactivateReason("");
  };

  // Konfirmasi nonaktifkan data -> PATCH /users/{id}/deactivate
  const confirmDeactivate = async () => {
    if (!deactivateReason.trim()) return;
    try {
      const response = await api.patch(`/users/${deactivateTargetId}/deactivate`, {
        alasan: deactivateReason.trim(),
      });

      if (response.data.status) {
        setUsers((prev) =>
          prev.map((user) => (user.id === deactivateTargetId ? response.data.data : user))
        );
        closeDeactivateModal();
        Swal.fire({
          title: "Berhasil!",
          text: response.data.message || "Data berhasil dinonaktifkan.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#0B2B8E",
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      closeDeactivateModal();
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.response?.data?.message || "Tidak dapat terhubung ke server backend.",
        confirmButtonColor: "#0B2B8E",
      });
    }
  };

  // Buka modal konfirmasi aktifkan kembali
  const openActivateModal = (id) => {
    setActivateTargetId(id);
    setShowActivateModal(true);
  };

  const closeActivateModal = () => {
    setShowActivateModal(false);
    setActivateTargetId(null);
  };

  // Konfirmasi aktifkan kembali data -> PATCH /users/{id}/activate
  const confirmActivate = async () => {
    try {
      const response = await api.patch(`/users/${activateTargetId}/activate`);

      if (response.data.status) {
        setUsers((prev) =>
          prev.map((user) => (user.id === activateTargetId ? response.data.data : user))
        );
        closeActivateModal();
        Swal.fire({
          title: "Berhasil!",
          text: response.data.message || "Data berhasil diaktifkan kembali.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#0B2B8E",
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      closeActivateModal();
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.response?.data?.message || "Tidak dapat terhubung ke server backend.",
        confirmButtonColor: "#0B2B8E",
      });
    }
  };

  // Buka modal konfirmasi hapus permanen
  const openDeleteModal = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  // Konfirmasi hapus permanen -> DELETE /users/{id}
  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/users/${deleteTargetId}`);

      if (response.data.status) {
        setUsers((prev) => prev.filter((user) => user.id !== deleteTargetId));
        closeDeleteModal();
        Swal.fire({
          title: "Berhasil!",
          text: response.data.message || "Data berhasil dihapus permanen.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#0B2B8E",
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      closeDeleteModal();
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.response?.data?.message || "Tidak dapat terhubung ke server backend.",
        confirmButtonColor: "#0B2B8E",
      });
    }
  };

  // Tampilkan detail user
  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const fullTitle = {
    Tn: "Tuan",
    Ny: "Nyonya",
    Nn: "Nona",
  };

  // Data yang sudah difilter berdasarkan tab (active/non-active) saja,
  // dipakai untuk menentukan pesan kosong yang tepat (belum ada data sama sekali
  // vs. tidak ada yang cocok dengan pencarian/filter tanggal).
  const usersInTab = users.filter((user) => {
    const status = user.status || "active";
    return activeTab === "active" ? status !== "non-active" : status === "non-active";
  });

  const filteredUsers = usersInTab.filter((user) => {
    const matchesSearch = user.nama?.toLowerCase().includes(search.toLowerCase());

    // Filter berdasarkan rentang tanggal BERGABUNG / createdAt
    // (hanya aktif kalau from & to sudah dipilih)
    let matchesDate = true;
    if (dateRange.from && dateRange.to) {
      const createdDate = parseCreatedAt(user.createdAt);
      matchesDate = isDateInRange(createdDate, dateRange.from, dateRange.to);
    }

    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const titleColor = {
    Tn: { bg: "#E6F0FF", color: "#0B2B8E" },
    Ny: { bg: "#FDEBF3", color: "#B32E7A" },
    Nn: { bg: "#EAFBF0", color: "#0F9D58" },
  };

  const detailFields = selectedUser
    ? [
        { label: "Title", value: fullTitle[selectedUser.title] || selectedUser.title },
        { label: "Nama", value: selectedUser.nama },
        { label: "No. Handphone", value: selectedUser.noHandphone },
        { label: "Email", value: selectedUser.email },
        {
          label: "Tanggal Lahir",
          value: formatIndoDate(parseTanggalLahir(selectedUser.tanggalLahir)) || selectedUser.tanggalLahir,
        },
        { label: "Roles", value: selectedUser.role },
        ...(selectedUser.alasanNonActive
          ? [{ label: "Alasan Non Active", value: selectedUser.alasanNonActive }]
          : []),
      ]
    : [];

  // Pesan yang tampil saat tabel kosong:
  // - Kalau masih memuat data dari server -> tampilkan indikator memuat
  // - Kalau memang belum ada data user sama sekali di tab ini -> ajakan buat user baru
  // - Kalau ada data tapi tidak ada yang cocok dengan pencarian/filter tanggal -> "tidak ada data yang sesuai"
  const emptyMessage = loadingUsers ? (
    "Memuat data..."
  ) : usersInTab.length === 0 ? (
    activeTab === "active" ? (
      <>
        Belum ada data user. Klik tombol <strong>+ Buat User Baru</strong> untuk menambahkan data.
      </>
    ) : (
      "Belum ada data user non aktif."
    )
  ) : (
    "Tidak ada data yang sesuai dengan pencarian atau filter tanggal bergabung."
  );

  // ---- Perhitungan kartu "Member Baru" (30 hari terakhir, berdasarkan createdAt) ----
  const MEMBER_BARU_DAYS = 30;
  const memberBaruFrom = getDateNDaysAgo(MEMBER_BARU_DAYS);
  const memberBaruTo = new Date();

  const memberBaruCount = users.filter((u) => {
    const created = parseCreatedAt(u.createdAt);
    return created && created >= memberBaruFrom && created <= memberBaruTo;
  }).length;

 return (
  <>
    <style>{`
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(24px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-24px); }
        to   { opacity: 1; transform: translateX(0); }
      }
    `}</style>
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#F8F9FB", width: "100%" }}>
      <Sidebar open={open} setOpen={setOpen} />
      <div className="p-4 flex-grow-1" style={{ marginLeft: "240px" }}>
        <div className="row mb-4 g-3">
          <div className="col-md-4">
            <div
              className="card border-0 p-4"
              style={{
                background: "linear-gradient(135deg, #EAF2FF 0%, #DCEBFF 100%)",
                borderRadius: "16px",
                boxShadow: "0 4px 16px rgba(11,43,142,0.06)",
              }}
            >
              <div className="d-flex align-items-center mb-2">
                <span className="text-uppercase fw-semibold small me-1" style={{ color: "#4C6FCF", letterSpacing: "0.5px" }}>
                  Total Member
                </span>
                <i className="bi bi-info-circle small" style={{ color: "#4C6FCF" }}></i>
              </div>
              <h2 className="fw-bold mb-0" style={{ color: "#0B2B8E" }}>
                {users.length.toLocaleString("id-ID")}
              </h2>
            </div>
          </div>
          <div className="col-md-5">
            <div
              className="card border-0 p-4"
              style={{
                background: "linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%)",
                borderRadius: "16px",
                boxShadow: "0 4px 16px rgba(154,120,0,0.06)",
              }}
            >
              <div className="d-flex align-items-center mb-2">
                <span className="text-uppercase fw-semibold small me-1" style={{ color: "#9A7800", letterSpacing: "0.5px" }}>
                  Member Baru
                </span>
                <i className="bi bi-info-circle small" style={{ color: "#9A7800" }}></i>
              </div>
              <h2 className="fw-bold mb-1" style={{ color: "#1D2939" }}>
                {memberBaruCount.toLocaleString("id-ID")}
              </h2>
              <span className="text-muted small">
                {MEMBER_BARU_DAYS} hari terakhir ({formatIndoDate(memberBaruFrom)} - {formatIndoDate(memberBaruTo)})
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4" style={{ borderRadius: "16px", boxShadow: "0 2px 12px rgba(16,24,40,0.05)" }}>
          <div className="border-bottom mb-3">
 <button
  className={`btn btn-link text-decoration-none fw-semibold pb-2 me-4 ${
    activeTab === "active" ? "text-primary border-bottom border-2 border-primary" : "text-muted"
  }`}
  onClick={() => {
    setSlideDir("left");
    setActiveTab("active");
  }}
  style={{ borderRadius: 0 }}
>
  Active
</button>
<button
  className={`btn btn-link text-decoration-none fw-semibold pb-2 ${
    activeTab === "non-active" ? "text-primary border-bottom border-2 border-primary" : "text-muted"
  }`}
  onClick={() => {
    setSlideDir("right");
    setActiveTab("non-active");
  }}
  style={{ borderRadius: 0 }}
>
  Non Active
</button>
          </div>
          <div className="row g-2 align-items-center mb-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderRadius: "8px 0 0 8px" }}>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Cari nama member"
                  style={{ borderRadius: "0 8px 8px 0" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-5 position-relative" ref={datePickerRef}>
              <div className="input-group" style={{ cursor: "pointer" }} onClick={() => setShowDatePicker((v) => !v)}>
                <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderRadius: "8px 0 0 8px" }}>
                  <i className="bi bi-calendar"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 text-muted"
                  style={{ borderRadius: dateRange.from && dateRange.to ? "0" : "0 8px 8px 0", cursor: "pointer" }}
                  placeholder="Filter tanggal bergabung"
                  value={
                    dateRange.from && dateRange.to
                      ? `${formatIndoDate(dateRange.from)} - ${formatIndoDate(dateRange.to)}`
                      : ""
                  }
                  readOnly
                />
                {dateRange.from && dateRange.to && (
                  <button
                    type="button"
                    className="input-group-text bg-white text-muted"
                    style={{ borderRadius: "0 8px 8px 0", border: "1px solid #ced4da", borderLeft: "none" }}
                    title="Hapus filter tanggal"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateRange({ from: null, to: null });
                    }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
              {showDatePicker && (
                <DateRangePicker
                  initialFrom={dateRange.from}
                  initialTo={dateRange.to}
                  onApply={(from, to) => {
                    setDateRange({ from, to });
                    setShowDatePicker(false);
                  }}
                />
              )}
            </div>
            <div className="col-md-3 text-end">
              <button
                className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: "#0B2B8E", borderColor: "#0B2B8E", borderRadius: "8px", padding: "10px 0" }}
                onClick={() => navigate("/buatuser")}
              >
                <i className="bi bi-plus-lg"></i>
                Buat User Baru
              </button>
            </div>
          </div>

          {/* Tabel User */}
          <div
  className="table-responsive"
  key={activeTab}
  style={{
    animation: `${slideDir === "left" ? "slideInLeft" : "slideInRight"} 0.28s ease-out`,
  }}
>
            <table className="table align-middle text-nowrap mb-0" style={{ color: "#475467" }}>
              <thead>
                <tr className="text-uppercase small text-muted" style={{ backgroundColor: "#F9FAFB" }}>
                  <th className="py-3 ps-3" style={{ borderRadius: "8px 0 0 8px" }}>NO.</th>
                  <th className="py-3">TITLE</th>
                  <th className="py-3">NAMA</th>
                  <th className="py-3">NO. HANDPHONE</th>
                  <th className="py-3">EMAIL</th>
                  <th className="py-3">TANGGAL LAHIR</th>
                  <th className="py-3">ROLES</th>
                  <th className="py-3 text-center" style={{ borderRadius: "0 8px 8px 0" }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => {
                    const tc = titleColor[user.title] || { bg: "#F2F4F7", color: "#475467" };
                    return (
                      <tr key={user.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                        <td className="ps-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>
                          <span
                            className="fw-semibold px-2 py-1"
                            style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: "6px", fontSize: "0.8rem" }}
                          >
                            {user.title}
                          </span>
                        </td>
                        <td className="fw-medium text-dark">{user.nama}</td>
                        <td>{user.noHandphone}</td>
                        <td>{user.email}</td>
                        <td>{formatIndoDate(parseTanggalLahir(user.tanggalLahir)) || user.tanggalLahir}</td>
                        <td>
                          <span
                            className="fw-semibold px-2 py-1"
                            style={{
                              backgroundColor: user.role === "Admin" ? "#FFF1E6" : "#EEF2FF",
                              color: user.role === "Admin" ? "#B54708" : "#3538CD",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                            }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="text-center">
                          {activeTab === "active" ? (
                            <>
                              <button
                                className="btn btn-link text-secondary p-1 me-1"
                                title="Lihat Detail"
                                onClick={() => handleViewDetail(user)}
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="btn btn-link text-secondary p-1 me-1"
                                title="Edit"
                                onClick={() => navigate("/editdata", { state: { user } })}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-link text-danger p-1"
                                title="Hapus"
                                onClick={() => openDeactivateModal(user.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-link text-success p-1 me-1"
                                title="Aktifkan Kembali"
                                onClick={() => openActivateModal(user.id)}
                              >
                                <i className="bi bi-check2-circle"></i>
                              </button>
                                 <button
                                className="btn btn-link text-secondary p-1 me-1"
                                title="Edit"
                                onClick={() => navigate("/editdata", { state: { user } })}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-link text-danger p-1"
                                title="Hapus Permanen"
                                onClick={() => openDeleteModal(user.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="d-flex justify-content-center align-items-center gap-1 pt-4">
              <button
                className="btn btn-light border-0 px-2"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-double-left"></i>
              </button>
              <button
                className="btn btn-light border-0 px-2"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .reduce((acc, page, i, arr) => {
                  if (i > 0 && page - arr[i - 1] > 1) acc.push("...");
                  acc.push(page);
                  return acc;
                }, [])
                .map((page, idx) =>
                  page === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-muted">…</span>
                  ) : (
                    <button
                      key={page}
                      className="btn border-0 px-3"
                      onClick={() => goToPage(page)}
                      style={{
                        backgroundColor: page === currentPage ? "#0B2B8E" : "transparent",
                        color: page === currentPage ? "#fff" : "#475467",
                        borderRadius: "8px",
                        fontWeight: 600,
                      }}
                    >
                      {page}
                    </button>
                  )
                )}

              <button
                className="btn btn-light border-0 px-2"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
              <button
                className="btn btn-light border-0 px-2"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <i className="bi bi-chevron-double-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail User */}
      {showDetailModal && selectedUser && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(16,24,40,0.45)", zIndex: 1050 }}
          onClick={closeDetailModal}
        >
          <div
            className="bg-white p-4"
            style={{ borderRadius: "16px", width: "420px", maxWidth: "90%", boxShadow: "0 8px 30px rgba(16,24,40,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0" style={{ color: "#1D2939" }}>Detail Data User</h5>
              <button
                className="btn btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
                onClick={closeDetailModal}
              >
                <i className="bi bi-x-lg small"></i>
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {detailFields.map((item) => (
                <div className="d-flex" key={item.label}>
                  <span className="text-muted" style={{ width: "140px", flexShrink: 0 }}>{item.label}</span>
                  <span className="fw-semibold" style={{ color: "#1D2939" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Nonaktifkan/Hapus (dengan alasan) */}
      {showDeactivateModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(16,24,40,0.45)", zIndex: 1050 }}
          onClick={closeDeactivateModal}
        >
          <div
            className="bg-white p-4"
            style={{ borderRadius: "16px", width: "460px", maxWidth: "90%", boxShadow: "0 8px 30px rgba(16,24,40,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h5 className="fw-bold mb-0 flex-grow-1 text-center" style={{ color: "#1D2939" }}>
                Konfirmasi
              </h5>
              <button
                className="btn btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
                onClick={closeDeactivateModal}
              >
                <i className="bi bi-x-lg small"></i>
              </button>
            </div>
            <p className="text-center text-muted mb-3">
              Apakah kamu yakin ingin menghapus data ini? Berikan alasan!
            </p>

            <div
              className="mb-1"
              style={{ border: "1px solid #E4E7EC", borderRadius: "10px", padding: "10px 12px" }}
            >
              <textarea
                className="form-control border-0 p-0"
                style={{ resize: "none", boxShadow: "none" }}
                rows={2}
                maxLength={100}
                placeholder="Tulis alasan di sini..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
              />
              <div className="text-end text-muted" style={{ fontSize: "0.75rem" }}>
                {deactivateReason.length}/100
              </div>
            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn fw-semibold flex-grow-1"
                style={{ backgroundColor: "#0B2B8E", color: "#fff", borderRadius: "8px", padding: "10px 0" }}
                disabled={!deactivateReason.trim()}
                onClick={confirmDeactivate}
              >
                YA, HAPUS DATA
              </button>
              <button
                className="btn btn-outline-secondary fw-semibold flex-grow-1"
                style={{ borderRadius: "8px", padding: "10px 0" }}
                onClick={closeDeactivateModal}
              >
                TIDAK, KEMBALI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Aktifkan Kembali */}
      {showActivateModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(16,24,40,0.45)", zIndex: 1050 }}
          onClick={closeActivateModal}
        >
          <div
            className="bg-white p-4"
            style={{ borderRadius: "16px", width: "460px", maxWidth: "90%", boxShadow: "0 8px 30px rgba(16,24,40,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h5 className="fw-bold mb-0 flex-grow-1 text-center" style={{ color: "#1D2939" }}>
                Konfirmasi
              </h5>
              <button
                className="btn btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
                onClick={closeActivateModal}
              >
                <i className="bi bi-x-lg small"></i>
              </button>
            </div>
            <p className="text-center text-muted mb-4">
              Apakah kamu yakin ingin mengaktifkan kembali data ini?
            </p>

            <div className="d-flex gap-2">
              <button
                className="btn fw-semibold flex-grow-1"
                style={{ backgroundColor: "#0B2B8E", color: "#fff", borderRadius: "8px", padding: "10px 0" }}
                onClick={confirmActivate}
              >
                YA, AKTIFKAN DATA
              </button>
              <button
                className="btn btn-outline-secondary fw-semibold flex-grow-1"
                style={{ borderRadius: "8px", padding: "10px 0" }}
                onClick={closeActivateModal}
              >
                TIDAK, KEMBALI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Permanen */}
      {showDeleteModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(16,24,40,0.45)", zIndex: 1050 }}
          onClick={closeDeleteModal}
        >
          <div
            className="bg-white p-4"
            style={{ borderRadius: "16px", width: "460px", maxWidth: "90%", boxShadow: "0 8px 30px rgba(16,24,40,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h5 className="fw-bold mb-0 flex-grow-1 text-center" style={{ color: "#1D2939" }}>
                Konfirmasi
              </h5>
              <button
                className="btn btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
                onClick={closeDeleteModal}
              >
                <i className="bi bi-x-lg small"></i>
              </button>
            </div>
            <p className="text-center text-muted mb-4">
              Apakah kamu yakin ingin menghapus data ini secara permanen? Tindakan ini
              tidak dapat dibatalkan dan data tidak dapat dikembalikan.
            </p>

            <div className="d-flex gap-2">
              <button
                className="btn fw-semibold flex-grow-1"
                style={{ backgroundColor: "#D92D20", color: "#fff", borderRadius: "8px", padding: "10px 0" }}
                onClick={confirmDelete}
              >
                YA, HAPUS PERMANEN
              </button>
              <button
                className="btn btn-outline-secondary fw-semibold flex-grow-1"
                style={{ borderRadius: "8px", padding: "10px 0" }}
                onClick={closeDeleteModal}
              >
                TIDAK, KEMBALI
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
  </>
  );
}