import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    RiHome5Line,
    RiArrowRightSLine,
    RiArrowDownSLine,
    RiBookOpenLine,
    RiCalendarCheckLine,
    RiFileList3Line,
    RiMedalLine,
    RiSettings3Fill,
    RiUserSearchLine,
    RiDatabase2Line,
    RiImageLine,
    RiGraduationCapLine,
    RiCalendarEventLine,
    RiCoupon3Line,
    RiNewspaperLine,
    RiFlashlightFill,
} from "react-icons/ri";

// Konfigurasi warna chip icon per menu (biar mirip referensi: colorful, bukan monokrom)
const ICON_STYLE = {
    beranda: { bg: "#FFEDD5", color: "#F59E0B" },
    userManagement: { bg: "#DBEAFE", color: "#2563EB" },
    leads: { bg: "#FCE7F3", color: "#DB2777" },
    kelasLms: { bg: "#E0E7FF", color: "#4338CA" },
    presensi: { bg: "#D1FAE5", color: "#059669" },
    inputNilai: { bg: "#FEF3C7", color: "#B45309" },
    sertifikat: { bg: "#FEF9C3", color: "#CA8A04" },
    masterData: { bg: "#EDE9FE", color: "#7C3AED" },
    mainBanner: { bg: "#E0F2FE", color: "#0284C7" },
    kelas: { bg: "#FFE4E6", color: "#E11D48" },
    event: { bg: "#DCFCE7", color: "#16A34A" },
    voucher: { bg: "#FEF9C3", color: "#CA8A04" },
    blog: { bg: "#E0E7FF", color: "#4F46E5" },
};

// Badge icon kecil berwarna
const IconChip = ({ icon: Icon, style, size = 15 }) => (
    <span
        className="d-flex align-items-center justify-content-center"
        style={{
            width: "26px",
            height: "26px",
            borderRadius: "8px",
            backgroundColor: style.bg,
            color: style.color,
            flexShrink: 0,
        }}
    >
        <Icon size={size} />
    </span>
);

// Item collapsible/accordion dengan animasi max-height halus
const AccordionPanel = ({ open, children }) => {
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState(0);

    useEffect(() => {
        if (open && contentRef.current) {
            setMaxHeight(contentRef.current.scrollHeight);
        } else {
            setMaxHeight(0);
        }
    }, [open, children]);

    return (
        <div
            style={{
                maxHeight: `${maxHeight}px`,
                opacity: open ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
            }}
        >
            <div ref={contentRef} className="w-100 mt-1 px-2 pb-1">
                {children}
            </div>
        </div>
    );
};

// Link menu biasa (non-accordion)
const SidebarLink = ({ to, icon, style, label, onClick }) => (
    <NavLink to={to} onClick={onClick} className="text-decoration-none d-block w-100 px-2">
        {({ isActive }) => (
            <div
                className={`sb-link d-flex align-items-center gap-2 px-2 py-2 mb-1 ${isActive ? "sb-link-active" : ""}`}
            >
                <IconChip icon={icon} style={style} />
                <span style={{ fontSize: "14.5px", fontWeight: isActive ? 700 : 500 }}>{label}</span>
            </div>
        )}
    </NavLink>
);

// Link menu di dalam accordion (sedikit lebih kecil & indent)
const SidebarSubLink = ({ to, icon, style, label, onClick }) => (
    <NavLink to={to} onClick={onClick} className="text-decoration-none d-block">
        {({ isActive }) => (
            <div className={`sb-link d-flex align-items-center gap-2 px-2 py-2 mb-1 ${isActive ? "sb-link-active" : ""}`}>
                <IconChip icon={icon} style={style} size={13} />
                <span style={{ fontSize: "14px", fontWeight: isActive ? 700 : 500 }}>{label}</span>
            </div>
        )}
    </NavLink>
);

// Header accordion (tombol pembuka group menu)
const AccordionHeader = ({ isOpen, onClick, icon, style, label, active }) => (
    <button
        onClick={onClick}
        className={`sb-link border-0 bg-transparent d-flex align-items-center justify-content-between w-100 px-2 py-2 mt-1 ${
            active ? "sb-link-active" : ""
        }`}
    >
        <div className="d-flex align-items-center gap-2">
            <IconChip icon={icon} style={style} />
            <span style={{ fontSize: "14.5px", fontWeight: 600 }}>{label}</span>
        </div>
        <RiArrowDownSLine
            size={16}
            style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: 0.85,
            }}
        />
    </button>
);

const Sidebar = ({ open, setOpen }) => {
    const sidebarRef = useRef(null);
    const location = useLocation();
    const [masterDataOpen, setMasterDataOpen] = useState(false);

    useEffect(() => {
        const handleClick = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                if (setOpen) setOpen(false);
                setMasterDataOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [setOpen]);

    const kelasLmsActive = ["/presensi", "/input-nilai", "/sertifikat"].includes(location.pathname);
    const masterDataActive = ["/main-banner", "/kelas", "/event", "/voucher", "/blog"].includes(location.pathname);

    return (
        <div ref={sidebarRef}>
            <style>{`
                .sb-link {
                    color: #E4E6F5;
                    border-radius: 10px;
                    transition: background-color 0.2s ease, color 0.2s ease;
                    cursor: pointer;
                }
                .sb-link:hover {
                    background-color: rgba(255, 255, 255, 0.08);
                    color: #FFFFFF;
                }
                .sb-link-active {
                    background-color: rgba(255, 255, 255, 0.14);
                    color: #FFFFFF !important;
                }
                .sb-scroll::-webkit-scrollbar {
                    width: 5px;
                }
                .sb-scroll::-webkit-scrollbar-thumb {
                    background-color: rgba(255,255,255,0.15);
                    border-radius: 10px;
                }
            `}</style>

            <div
                className="position-fixed top-0 start-0 d-flex flex-column py-3 sb-scroll"
                style={{
                    width: "230px",
                    height: "100vh",
                    zIndex: 1000,
                    background: "linear-gradient(180deg, #2B2E83 0%, #23266B 100%)",
                    overflowY: "auto",
                }}
            >
                {/* Logo */}
                <div className="d-flex align-items-center gap-2 px-3 mb-4">

                    <h1
                        className="text-white mb-0 mx-auto"
                        style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "0.3px" }}
                    >
                        DASHBOARD
                    </h1>
                </div>

                {/* Menu utama */}
                <div className="px-2">
                    <SidebarLink to="/dashboard" icon={RiHome5Line} style={ICON_STYLE.beranda} label="Beranda" />
                    <SidebarLink
                        to="/user-management"
                        icon={RiSettings3Fill}
                        style={ICON_STYLE.userManagement}
                        label="User Management"
                    />
                    <SidebarLink
                        to="/leads-management"
                        icon={RiUserSearchLine}
                        style={ICON_STYLE.leads}
                        label="Leads Management"
                    />
                </div>

                {/* Group: Kelas LMS */}
                <div className="px-2">
                    <AccordionHeader
                        isOpen={open}
                        active={kelasLmsActive}
                        onClick={() => setOpen && setOpen(!open)}
                        icon={RiBookOpenLine}
                        style={ICON_STYLE.kelasLms}
                        label="Kelas LMS"
                    />
                    <AccordionPanel open={open}>
                        <SidebarSubLink
                            to="/presensi"
                            icon={RiCalendarCheckLine}
                            style={ICON_STYLE.presensi}
                            label="Presensi Peserta"
                            onClick={() => setOpen && setOpen(false)}
                        />
                        <SidebarSubLink
                            to="/input-nilai"
                            icon={RiFileList3Line}
                            style={ICON_STYLE.inputNilai}
                            label="Input Nilai"
                            onClick={() => setOpen && setOpen(false)}
                        />
                        <SidebarSubLink
                            to="/sertifikat"
                            icon={RiMedalLine}
                            style={ICON_STYLE.sertifikat}
                            label="Sertifikat"
                            onClick={() => setOpen && setOpen(false)}
                        />
                    </AccordionPanel>
                </div>

                {/* Group: Master Data */}
                <div className="px-2">
                    <AccordionHeader
                        isOpen={masterDataOpen}
                        active={masterDataActive}
                        onClick={() => setMasterDataOpen((prev) => !prev)}
                        icon={RiDatabase2Line}
                        style={ICON_STYLE.masterData}
                        label="Master Data"
                    />
                    <AccordionPanel open={masterDataOpen}>
                        <SidebarSubLink
                            to="/main-banner"
                            icon={RiImageLine}
                            style={ICON_STYLE.mainBanner}
                            label="Main Banner"
                            onClick={() => setMasterDataOpen(false)}
                        />
                        <SidebarSubLink
                            to="/kelas"
                            icon={RiGraduationCapLine}
                            style={ICON_STYLE.kelas}
                            label="Kelas"
                            onClick={() => setMasterDataOpen(false)}
                        />
                        <SidebarSubLink
                            to="/event"
                            icon={RiCalendarEventLine}
                            style={ICON_STYLE.event}
                            label="Event"
                            onClick={() => setMasterDataOpen(false)}
                        />
                        <SidebarSubLink
                            to="/voucher"
                            icon={RiCoupon3Line}
                            style={ICON_STYLE.voucher}
                            label="Voucher"
                            onClick={() => setMasterDataOpen(false)}
                        />
                        <SidebarSubLink
                            to="/blog"
                            icon={RiNewspaperLine}
                            style={ICON_STYLE.blog}
                            label="Blog"
                            onClick={() => setMasterDataOpen(false)}
                        />
                    </AccordionPanel>
                </div>

                {/* Profil */}
                <div className="mt-auto w-100">
                    <hr className="border-light opacity-25 mx-3" />
                    <NavLink
                        to="/profil"
                        className="sb-link text-decoration-none d-flex align-items-center px-3 py-2 mx-2"
                        style={{ gap: "10px", borderRadius: "10px" }}
                    >
                        <img
                            src="https://i.pinimg.com/736x/57/10/ea/5710ea1dd0bd2df66179f55355bbecc6.jpg"
                            alt="Profile"
                            className="rounded-circle"
                            style={{ width: "36px", height: "36px", objectFit: "cover" }}
                        />
                        <span style={{ fontSize: "14.5px", fontWeight: 600 }}>Asep</span>
                        <RiArrowRightSLine size={16} className="ms-auto" style={{ opacity: 0.8 }} />
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;