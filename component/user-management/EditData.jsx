import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../src/utils/api";

// NOTE: pastikan package "sweetalert2" sudah terpasang di project:
//   npm install sweetalert2

const TITLE_OPTIONS = [
  { value: "Tn", label: "Tuan" },
  { value: "Ny", label: "Nyonya" },
  { value: "Nn", label: "Nona" },
];

const EMAIL_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@gmail\.com$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// ---- Helper untuk konversi data dari User.jsx ----

// noHandphone tersimpan sebagai "(+62) 812xxxxxxx" -> kembalikan hanya digitnya
function extractPhoneDigits(stored) {
  if (!stored) return "";
  return stored.replace("(+62)", "").replace(/\D/g, "");
}

export default function EditData() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loadedUser, setLoadedUser] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    title: "Tn",
    nama: "",
    noHandphone: "",
    email: "",
    tanggalLahir: "",
    role: "",
    alasanNonActive: "",
  });

  const [errors, setErrors] = useState({
    noHandphone: "",
    email: "",
    password: "",
    confirmPassword: "",
    alasanNonActive: "",
  });

  // Bagian "Kata Sandi" (collapsible)
  const [kataSandiOpen, setKataSandiOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Banner error di atas form ("Ups, Data User gagal diperbarui...")
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  const isNonActive = (loadedUser?.status || "active") === "non-active";

  // ---- Ambil data user: WAJIB dikirim lewat state saat navigate ke "/editdata" ----
  // Contoh di User.jsx:
  //   navigate("/editdata", { state: { user } })
  useEffect(() => {
    const userFromState = location.state?.user;

    if (!userFromState) {
      setNotFound(true);
      return;
    }

    setLoadedUser(userFromState);
    setFormData({
      title: userFromState.title || "Tn",
      nama: userFromState.nama || "",
      noHandphone: extractPhoneDigits(userFromState.noHandphone),
      email: userFromState.email || "",
      // Data dari backend sudah format yyyy-mm-dd (dari <input type="date">
      // di BuatUser.jsx), jadi langsung dipakai tanpa konversi.
      tanggalLahir: userFromState.tanggalLahir || "",
      role: userFromState.role || "",
      alasanNonActive: userFromState.alasanNonActive || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // ---- Validators (sama seperti BuatUser.jsx) ----
  const validatePhone = (value) => {
    const digitsOnly = value.replace(/\D/g, "");
    const totalWithCountryCode = `62${digitsOnly}`;
    if (digitsOnly === "") return "";
    if (totalWithCountryCode.length > 15) {
      return "Maksimum terdiri dari 15 angka termasuk kode negara";
    }
    return "";
  };

  const validateEmail = (value) => {
    if (value === "") return "";
    if (!EMAIL_REGEX.test(value)) {
      return "Masukkan email yang valid";
    }
    return "";
  };

  const validatePassword = (value) => {
    if (value === "") return "";
    if (!PASSWORD_REGEX.test(value)) {
      return "Min 8 karakter, kombinasi huruf besar-kecil, angka & karakter khusus";
    }
    return "";
  };

  const validateConfirmPassword = (value, password) => {
    if (value === "") return "";
    if (value !== password) {
      return "Kata sandi tidak cocok";
    }
    return "";
  };

  // ---- Handlers field biasa ----
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "noHandphone") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, noHandphone: digitsOnly }));
      setErrors((prev) => ({ ...prev, noHandphone: validatePhone(digitsOnly) }));
      return;
    }

    if (name === "email") {
      setFormData((prev) => ({ ...prev, email: value }));
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
      return;
    }

    if (name === "alasanNonActive") {
      if (value.length > 100) return;
      setFormData((prev) => ({ ...prev, alasanNonActive: value }));
      setErrors((prev) => ({ ...prev, alasanNonActive: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearField = (name) => {
    setFormData((prev) => ({ ...prev, [name]: "" }));
    if (errors[name] !== undefined) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ---- Handlers Kata Sandi ----
  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(value),
      confirmPassword: validateConfirmPassword(confirmNewPassword, value),
    }));
  };

  const handleConfirmNewPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmNewPassword(value);
    setErrors((prev) => ({
      ...prev,
      confirmPassword: validateConfirmPassword(value, newPassword),
    }));
  };

  const toggleResetPassword = () => {
    const next = !resetPassword;
    setResetPassword(next);
    if (!next) {
      setNewPassword("");
      setConfirmNewPassword("");
      setErrors((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    }
  };

  // ---- Validasi keseluruhan form ----
  const isFormValid = () => {
    const baseValid =
      formData.nama.trim() !== "" &&
      formData.noHandphone.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.tanggalLahir.trim() !== "" &&
      formData.role.trim() !== "" &&
      !errors.noHandphone &&
      !errors.email;

    const nonActiveValid = isNonActive ? formData.alasanNonActive.trim() !== "" : true;

    const passwordValid = resetPassword
      ? newPassword.trim() !== "" &&
        confirmNewPassword.trim() !== "" &&
        !errors.password &&
        !errors.confirmPassword
      : true;

    return baseValid && nonActiveValid && passwordValid;
  };

  // ---- INTEGRASI KE BACKEND FALCON (PUT /users/{id}) ----
  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneError =
      validatePhone(formData.noHandphone) ||
      (formData.noHandphone === "" ? "No. Handphone wajib diisi" : "");
    const emailError =
      validateEmail(formData.email) || (formData.email === "" ? "Email wajib diisi" : "");
    const alasanError =
      isNonActive && formData.alasanNonActive.trim() === "" ? "Alasan Non Active wajib diisi" : "";

    let passwordError = "";
    let confirmPasswordError = "";
    if (resetPassword) {
      passwordError =
        validatePassword(newPassword) || (newPassword === "" ? "Kata sandi wajib diisi" : "");
      confirmPasswordError =
        validateConfirmPassword(confirmNewPassword, newPassword) ||
        (confirmNewPassword === "" ? "Konfirmasi kata sandi wajib diisi" : "");
    }

    const hasError =
      phoneError ||
      emailError ||
      alasanError ||
      passwordError ||
      confirmPasswordError ||
      !formData.nama.trim() ||
      !formData.tanggalLahir ||
      !formData.role;

    if (hasError) {
      setErrors({
        noHandphone: phoneError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
        alasanNonActive: alasanError,
      });
      setShowErrorBanner(true);
      return;
    }

    setShowErrorBanner(false);

    const payload = {
      title: formData.title,
      nama: formData.nama,
      noHandphone: formData.noHandphone,
      email: formData.email,
      tanggalLahir: formData.tanggalLahir,
      role: formData.role,
      alasanNonActive: isNonActive
        ? formData.alasanNonActive.trim()
        : loadedUser.alasanNonActive || "",
    };

    if (resetPassword) {
      payload.password = newPassword;
      payload.confirmPassword = confirmNewPassword;
    }

    try {
      const response = await api.put(`/users/${loadedUser.id}`, payload);

      if (response.data.status) {
        Swal.fire({
          icon: "success",
          title: "Data berhasil diperbarui",
          text: response.data.message || "Data berhasil diperbarui",
          confirmButtonColor: "#0B2B8E",
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          navigate("/user-management");
        });
      }
    } catch (error) {
      // Menangani error validasi yang dikirim dari backend Falcon (HTTP 400),
      // mis. email sudah terdaftar (user lain), atau kata sandi tidak memenuhi syarat.
      if (error.response && error.response.data) {
        const resData = error.response.data;

        if (resData.errors) {
          setErrors((prev) => ({
            ...prev,
            ...resData.errors,
          }));
        }
        setShowErrorBanner(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Tidak dapat terhubung ke server backend.",
          confirmButtonColor: "#0B2B8E",
        });
      }
    }
  };

  if (notFound) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh", backgroundColor: "#F8F9FB" }}
      >
        <div className="text-center">
          <p className="text-muted mb-3">Data user tidak ditemukan.</p>
          <button
            className="btn"
            style={{ backgroundColor: "#0B2B8E", color: "#fff", borderRadius: "8px" }}
            onClick={() => navigate("/user-management")}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!loadedUser) {
    // sedang memuat data
    return null;
  }

  return (
    <div
      className="d-flex align-items-start justify-content-center position-relative"
      style={{ minHeight: "100vh", backgroundColor: "#F8F9FB", paddingTop: "48px", paddingBottom: "48px" }}
    >
      {/* Toast / Banner Error di atas form */}
      {showErrorBanner && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x d-flex align-items-start gap-2 p-3"
          style={{
            marginTop: "16px",
            backgroundColor: "#FEF3F2",
            border: "1px solid #FDA29B",
            borderRadius: "10px",
            width: "480px",
            maxWidth: "92%",
            zIndex: 1200,
            boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
          }}
        >
          <i className="bi bi-exclamation-triangle-fill" style={{ color: "#D92D20", marginTop: "2px" }}></i>
          <div className="flex-grow-1 small" style={{ color: "#912018" }}>
            Ups, Data User gagal diperbarui. Pastikan memasukkan data yang benar. Coba lagi
          </div>
          <button
            className="btn btn-sm p-0"
            style={{ color: "#912018", background: "none", border: "none" }}
            onClick={() => setShowErrorBanner(false)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      <div
        className="bg-white p-4"
        style={{ width: "100%", maxWidth: "480px", borderRadius: "20px", boxShadow: "0 8px 30px rgba(16,24,40,0.08)" }}
      >
        <h5 className="fw-bold text-center mb-4">Edit Data User</h5>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Title</label>
            <div className="d-flex gap-4">
              {TITLE_OPTIONS.map((opt) => (
                <div className="form-check" key={opt.value}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="title"
                    id={`title-${opt.value}`}
                    value={opt.value}
                    checked={formData.title === opt.value}
                    onChange={handleChange}
                  />
                  <label className="form-check-label small" htmlFor={`title-${opt.value}`}>
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Nama Lengkap */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Nama Lengkap</label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: "8px", paddingRight: "32px" }}
                name="nama"
                placeholder="Masukkan Nama Lengkap"
                value={formData.nama}
                onChange={handleChange}
              />
              {formData.nama && (
                <button
                  type="button"
                  className="btn btn-sm position-absolute top-50 end-0 translate-middle-y text-muted"
                  style={{ border: "none", background: "none" }}
                  onClick={() => clearField("nama")}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>

          {/* No. Handphone */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">No. Handphone</label>
            <div className="d-flex" style={{ gap: "8px" }}>
              <div
                className="d-flex flex-column align-items-start px-2"
                style={{
                  border: "1px solid #D0D5DD",
                  borderRadius: "8px",
                  backgroundColor: "#F9FAFB",
                  minWidth: "78px",
                  justifyContent: "center",
                }}
              >
                <span className="text-muted" style={{ fontSize: "0.65rem" }}>Kode Negara</span>
                <div className="d-flex align-items-center">
                  <span
                    className="me-1"
                    style={{
                      display: "inline-block",
                      width: "18px",
                      height: "13px",
                      background: "linear-gradient(to bottom, #CE1126 50%, #FFFFFF 50%)",
                      border: "1px solid #E4E7EC",
                      borderRadius: "2px",
                    }}
                  ></span>
                  <span className="small text-muted">+ 62</span>
                </div>
              </div>
              <div className="position-relative flex-grow-1">
                <input
                  type="text"
                  inputMode="numeric"
                  className={`form-control ${errors.noHandphone ? "is-invalid" : ""}`}
                  style={{ borderRadius: "8px", paddingRight: "32px" }}
                  name="noHandphone"
                  placeholder="Cth : 812-xxx-xxx"
                  value={formData.noHandphone}
                  onChange={handleChange}
                />
                {formData.noHandphone && (
                  <button
                    type="button"
                    className="btn btn-sm position-absolute top-50 end-0 translate-middle-y text-muted"
                    style={{ border: "none", background: "none" }}
                    onClick={() => clearField("noHandphone")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>
            {errors.noHandphone && <div className="text-danger small mt-1">{errors.noHandphone}</div>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Email</label>
            <div className="position-relative">
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                style={{ borderRadius: "8px", paddingRight: "32px" }}
                name="email"
                placeholder="Misal : hicolleagues@gmail.com"
                value={formData.email}
                onChange={handleChange}
              />
              {formData.email && (
                <button
                  type="button"
                  className="btn btn-sm position-absolute top-50 end-0 translate-middle-y text-muted"
                  style={{ border: "none", background: "none" }}
                  onClick={() => clearField("email")}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
            {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
          </div>

          {/* Tanggal Lahir */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Tanggal Lahir</label>
            <input
              type="date"
              className="form-control"
              style={{ borderRadius: "8px" }}
              name="tanggalLahir"
              value={formData.tanggalLahir}
              onChange={handleChange}
            />
          </div>

          {/* Roles */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Roles</label>
            <select
              className="form-select"
              style={{ borderRadius: "8px" }}
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="" disabled>
                Pilih Role
              </option>
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
            </select>
          </div>
          {isNonActive && (
            <div className="mb-3">
              <label className="form-label fw-semibold small">Alasan Non Active</label>
              <div className="position-relative">
                <textarea
                  className="form-control"
                  style={{ borderRadius: "8px", paddingRight: "32px", resize: "none" }}
                  rows={2}
                  maxLength={100}
                  name="alasanNonActive"
                  placeholder="Tulis alasan di sini..."
                  value={formData.alasanNonActive}
                  onChange={handleChange}
                />
                {formData.alasanNonActive && (
                  <button
                    type="button"
                    className="btn btn-sm position-absolute top-0 end-0 text-muted"
                    style={{ border: "none", background: "none" }}
                    onClick={() => clearField("alasanNonActive")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
              <div className="text-end text-muted" style={{ fontSize: "0.75rem" }}>
                {formData.alasanNonActive.length}/100
              </div>
              {errors.alasanNonActive && (
                <div className="text-danger small mt-1">{errors.alasanNonActive}</div>
              )}
            </div>
          )}

          <hr className="my-4" />

          {/* Kata Sandi (collapsible) */}
          <div className="mb-2">
            <button
              type="button"
              className="btn d-flex align-items-center justify-content-between w-100 p-0 fw-semibold small"
              style={{ border: "none", background: "none", color: "#1D2939" }}
              onClick={() => setKataSandiOpen((v) => !v)}
            >
              Kata Sandi
              <i className={`bi bi-chevron-${kataSandiOpen ? "up" : "down"}`}></i>
            </button>
          </div>

          {kataSandiOpen && (
            <div className="mb-3">
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="resetKataSandi"
                  checked={resetPassword}
                  onChange={toggleResetPassword}
                />
                <label className="form-check-label small" htmlFor="resetKataSandi">
                  Reset Kata Sandi
                </label>
              </div>

              {resetPassword && (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Kata Sandi Baru</label>
                    <div className="position-relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        style={{ borderRadius: "8px", paddingRight: "32px" }}
                        placeholder="Masukkan Kata Sandi Baru"
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                      />
                      <button
                        type="button"
                        className="btn btn-sm position-absolute top-50 end-0 translate-middle-y text-muted"
                        style={{ border: "none", background: "none" }}
                        onClick={() => setShowNewPassword((v) => !v)}
                      >
                        <i className={`bi bi-eye${showNewPassword ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                    {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                  </div>

                  <div className="mb-1">
                    <label className="form-label fw-semibold small">Konfirmasi Kata Sandi Baru</label>
                    <div className="position-relative">
                      <input
                        type={showConfirmNewPassword ? "text" : "password"}
                        className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                        style={{ borderRadius: "8px", paddingRight: "32px" }}
                        placeholder="Masukkan Ulang Kata Sandi Baru"
                        value={confirmNewPassword}
                        onChange={handleConfirmNewPasswordChange}
                      />
                      <button
                        type="button"
                        className="btn btn-sm position-absolute top-50 end-0 translate-middle-y text-muted"
                        style={{ border: "none", background: "none" }}
                        onClick={() => setShowConfirmNewPassword((v) => !v)}
                      >
                        <i className={`bi bi-eye${showConfirmNewPassword ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="text-danger small mt-1">{errors.confirmPassword}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn w-100 fw-semibold text-white text-uppercase mt-3"
            style={{
              backgroundColor: isFormValid() ? "#0B2B8E" : "#A0A3BD",
              borderRadius: "8px",
              padding: "12px 0",
              letterSpacing: "0.5px",
              border: "none",
              transition: "background-color 0.2s ease",
            }}
          >
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
}