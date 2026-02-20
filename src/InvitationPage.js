import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Eye, EyeOff, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { MapPin, Calendar, Clock } from "lucide-react";

// FIREBASE 
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

import "./App.css";
// masukan path gambar baru disini: semua asset utama undangan
const IMAGE_PATHS = {
  cover: "/images/satu.jpeg", // masukan path gambar baru disini (hero cover)
  quote: "/images/dua.jpeg", // masukan path gambar baru disini (words of love)
  brideLeft: "/images/sabb.jpeg", // masukan path gambar baru disini (foto mempelai slot 1)
  brideRight: "/images/catunkgil.jpeg", // masukan path gambar baru disini (foto mempelai slot 2)
  ceremony: "/images/ceremony.jpg", // masukan path gambar baru disini (foto acara)
  defaultQR: "/images/default-qr.png", // masukan path gambar baru disini (fallback QR)
  momentsTop: "/images/tujuh.jpeg", // masukan path gambar baru disini (frame foto atas di section foto)
  momentsBottom: "/images/carodua.jpg" // masukan path gambar baru disini (frame foto bawah di section foto)
};

// Couple / Venue text - edit here if needed
const COUPLE = {
  groom: "Muhamad Mushab",
  bride: "Keisya Aprilia",
  venueShort: "MASJID AL-FITRAH PINDAD",
  venueAddress: "Jl. Gatot Subroto No.517 Sukapura Kec. Kiaracondong Kota Bandung",
};
// ----------------------------------------------------------------------------------

// ---------- Firebase config ----------
const firebaseConfig = {
  apiKey: "AIzaSyDBgLYSMQetSTL1r8L9Xz9zbyMH-QvRnYc",
  authDomain: "aplikasi-tamu-undangan.firebaseapp.com",
  projectId: "aplikasi-tamu-undangan",
  storageBucket: "aplikasi-tamu-undangan.firebasestorage.app",
  messagingSenderId: "918722441585",
  appId: "1:918722441585:web:859591609b99df751e86d0",
  measurementId: "G-LXVPJ5GNG0",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// -----------------------------------------------------------

export default function InvitationPage() {
  const { uniqueId } = useParams();
  const [started, setStarted] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // Backend states
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI states
  const [showECheckin, setShowECheckin] = useState(false);
  const [renderECheckin, setRenderECheckin] = useState(false);

  // Countdown
  const [countdown, setCountdown] = useState({ days: "--", hours: "--", minutes: "--", seconds: "--" });

  // Photos/pages for carousel/phone pages (4 screens total)
  const pages = [IMAGE_PATHS.cover, IMAGE_PATHS.quote, IMAGE_PATHS.brideLeft, IMAGE_PATHS.ceremony]; // simple indexes
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Screen ref for phone-like scroll (mobile)
  const screenRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);

  // RSVP states
  const [rsvpForm, setRsvpForm] = useState({ name: "", attendance: "1", message: "" });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Wish Wall states
  const [wishes, setWishes] = useState([]);
  const [wishForm, setWishForm] = useState({ name: "", message: "" });
  const [wishSubmitted, setWishSubmitted] = useState(false);
  const [showCeremonyImage, setShowCeremonyImage] = useState(true);

  // ----------------- Fetch guest (preserve original logic) -----------------
  useEffect(() => {
    async function getData() {
      try {
        if (!uniqueId) {
          setError("ID tidak valid");
          setLoading(false);
          return;
        }
        const snap = await getDoc(doc(db, "guests", uniqueId));
        if (!snap.exists()) {
          setError("Undangan tidak ditemukan");
        } else {
          const d = snap.data();
          setGuest({
            name: d.name || "Tamu Terhormat",
            qrCode: d.qrCode || IMAGE_PATHS.defaultQR,
            heroPhoto: d.heroPhoto || null,
            uniqueId: snap.id
          });
        }
      } catch (e) {
        console.error(e);
        setError("Gagal memuat data undangan");
      } finally {
        setLoading(false);
      }
    }
    getData();
  }, [uniqueId]);
  // -------------------------------------------------------------------------

  // ----------------- Countdown -----------------
  useEffect(() => {
    const target = new Date("2026-06-20T09:00:00");
    const t = setInterval(() => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown({ days: "0", hours: "00", minutes: "00", seconds: "00" });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({
        days: String(days),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0")
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  // ----------------------------------------------

  // ----------------- Carousel auto next -----------------
  useEffect(() => {
    const it = setInterval(() => setIndex((p) => (p + 1) % pages.length), 4200);
    return () => clearInterval(it);
  }, [pages.length]);

  const next = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIndex((p) => (p + 1) % pages.length);
      setIsAnimating(false);
    }, 300);
  };
  const prev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIndex((p) => (p - 1 + pages.length) % pages.length);
      setIsAnimating(false);
    }, 300);
  };
  // -------------------------------------------------------

  // ----------------- Page scroll for phone mock -----------------
  useEffect(() => {
    if (!screenRef.current) return;
    const el = screenRef.current;
    const pageHeight = el.clientHeight;
    el.scrollTo({ top: pageIndex * pageHeight, left: 0, behavior: "smooth" });
  }, [pageIndex]);

  // touch swipe for phone mock
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    let startY = 0;
    const onTouchStart = (e) => (startY = e.touches[0].clientY);
    const onTouchEnd = (e) => {
      const endY = e.changedTouches[0].clientY;
      const diff = endY - startY;
      if (diff > 40) setPageIndex((p) => Math.max(0, p - 1));
      else if (diff < -40) setPageIndex((p) => Math.min(4, p + 1)); // updated to 4 pages
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
  // --------------------------------------------------------------

  // ----------------- Fetch wishes for Wish Wall -----------------
  useEffect(() => {
    const q = query(collection(db, "wishes"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wishesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWishes(wishesData);
    });
    return unsubscribe;
  }, []);
  // --------------------------------------------------------------

  // ----------------- RSVP submit -----------------
  const submitRSVP = async (e) => {
    e.preventDefault();

    // Validasi: jika tidak hadir, pesan wajib diisi
    if (rsvpForm.attendance === "0" && !rsvpForm.message.trim()) {
      alert("Mohon isi pesan jika tidak dapat hadir");
      return;
    }

    try {
      await addDoc(collection(db, "rsvp"), {
        name: rsvpForm.name,
        attendance: rsvpForm.attendance,
        guests: rsvpForm.attendance === "0" ? 0 : parseInt(rsvpForm.attendance),
        message: rsvpForm.message,
        guestId: uniqueId,
        timestamp: new Date()
      });
      setRsvpSubmitted(true);
      setRsvpForm({ name: "", attendance: "1", message: "" });
    } catch (error) {
      console.error("Error submitting RSVP:", error);
    }
  };
  // -------------------------------------------------

  // ----------------- Wish submit -----------------
  const submitWish = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "wishes"), {
        ...wishForm,
        timestamp: new Date()
      });
      setWishSubmitted(true);
      setWishForm({ name: "", message: "" });
      setTimeout(() => setWishSubmitted(false), 3000);
    } catch (error) {
      console.error("Error submitting wish:", error);
    }
  };

  // ----------------- Delete wish -----------------
  const deleteWish = async (wishId) => {
    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "wishes", wishId));
    } catch (error) {
      console.error("Error deleting wish:", error);
    }
  };
  // -------------------------------------------------

  // ----------------- Add to Calendar -----------------
  const addToCalendar = () => {
    const eventTitle = `Pernikahan ${COUPLE.groom} & ${COUPLE.bride}`;
    const startDate = "20260620T090000Z"; // 2026-06-20 09:00 UTC
    const endDate = "20260620T140000Z"; // 2026-06-20 14:00 UTC
    const location = `${COUPLE.venueShort}, ${COUPLE.venueAddress}`;
    const details = `Akad 09.00 - 10.00 WIB, Resepsi 11.00 - 14.00 WIB`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(details)}`;
    window.open(url, "_blank");
  };
  // ---------------------------------------------------

  const mapsQuery = `${COUPLE.venueShort}, ${COUPLE.venueAddress}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const mapsEmbedSrc = `https://maps.google.com/maps?hl=id&q=${encodeURIComponent(mapsQuery)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`;

  // ----------------- E-checkin toggle & QR download -----------------
  const toggleECheckin = () => {
    if (showECheckin) {
      setShowECheckin(false);
      setTimeout(() => setRenderECheckin(false), 380);
    } else {
      setRenderECheckin(true);
      setTimeout(() => setShowECheckin(true), 20);
    }
  };

  const downloadQR = () => {
    if (!guest || !guest.qrCode) return;
    const link = document.createElement("a");
    link.href = guest.qrCode;
    link.download = `QR-${guest.name || "guest"}.png`;
    link.click();
  };

  const handleStart = () => {
    if (isOpening) return;
    setIsOpening(true);
    setTimeout(() => {
      setStarted(true);
      setIsOpening(false);
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 420);
  };
  // -------------------------------------------------------------------

  // Prevent background scroll while intro overlay is visible.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    if (!started) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [started]);

  // Scroll-triggered reveal per section.
  useEffect(() => {
    const items = Array.from(document.querySelectorAll(".scroll-react"));
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [started]);

  // ----------------- Loading / Error UI -----------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }
  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Undangan Tidak Ditemukan</h2>
          <p className="mt-2 opacity-70">{error}</p>
        </div>
      </div>
    );
  }
  // -------------------------------------------------------

    // ----------------- MAIN RENDER -----------------
  return (
    <div className="theme13">
      <div className="t13-bg" aria-hidden="true" />
      <div className="t13-container">
        <section className="t13-hero scroll-react from-left">
          <div className="t13-hero-media">
            <div className="t13-hero-photo">
              <img src={IMAGE_PATHS.cover} alt="cover" />
              <div className="t13-hero-overlay">
                <div className="t13-hero-tag">THE DAY</div>
                <div className="t13-hero-date">SABTU, 20 JUNI 2026</div>
              </div>
            </div>
          </div>
          <div className="t13-hero-script">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
          <div className="t13-hero-sub">We invite you to join our wedding</div>
          <div className="t13-hero-names">
            <div>{COUPLE.groom.toUpperCase()}</div>
            <div className="t13-hero-amp">&amp;</div>
            <div>{COUPLE.bride.toUpperCase()}</div>
          </div>
        </section>

        <section className="t13-section scroll-react from-right">
          <div className="t13-card">
            <div className="t13-couple-header">
              <div className="t13-couple-script">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
              <div className="t13-couple-sub">We invite you to join our wedding</div>
            </div>

            <div className="t13-couple-row t13-couple-row-top">
              <div className="t13-couple-text">
                <div className="t13-couple-name">{COUPLE.groom.toUpperCase()}</div>
                <div className="t13-couple-desc">
                  Putra Pertama dari
                  <br />
                  Bpk. Cholifah Holid
                  <br />
                  & Ibu Tjutrahmawti
                </div>
              </div>
              <div className="t13-couple-photo-placeholder">
                <img src={IMAGE_PATHS.brideLeft} alt={COUPLE.groom} />
              </div>
            </div>

            <div className="t13-couple-amp">&amp;</div>

            <div className="t13-couple-row t13-couple-row-bottom">
              <div className="t13-couple-photo-placeholder">
                <img src={IMAGE_PATHS.brideRight} alt={COUPLE.bride} />
              </div>
              <div className="t13-couple-text t13-couple-text-right">
                <div className="t13-couple-name">{COUPLE.bride.toUpperCase()}</div>
                <div className="t13-couple-desc">
                  Putri Pertama dari
                  <br />
                  Bpk. (Alm) Indra Rosindra
                  <br />
                  & Ibu. (Almh) Ade Tatin
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="t13-section scroll-react from-right t13-words-section">
          <div className="t13-card">
            <h2 className="t13-title t13-words-title">Words of Love</h2>
            <div className="t13-quote-wrap">
              <div className="t13-quote-photo">
                <img src={IMAGE_PATHS.quote} alt="quote" />
                <div className="t13-quote-tape" />
              </div>
              <div className="t13-quote-text">
                Di antara tanda-tanda (kebesaran)-Nya ialah bahwa Dia menciptakan pasangan-pasangan untukmu dari (jenis) dirimu sendiri agar kamu merasa tenteram kepadanya.
              </div>
              <div className="t13-quote-ref">(Q.S Ar-Rum : 21)</div>
            </div>
          </div>
        </section>

        <section id="acara" className="t13-section t13-grid scroll-react from-left">
          <div className="t13-card">
            <h2 className="t13-title">The Ceremony</h2>
            <div className="t13-date-block">
              <div className="t13-month">JUNE</div>
              <div className="t13-date-grid">
                <div className="t13-date-pill">18</div>
                <div className="t13-date-pill">19</div>
                <div className="t13-date-pill is-active">20</div>
                <div className="t13-date-pill">21</div>
                <div className="t13-date-pill">22</div>
              </div>
              <div className="t13-year">2026</div>
              <div className="t13-event-list">
                <div className="t13-event-item">
                  <div className="t13-event-title">AKAD NIKAH</div>
                  <div className="t13-event-time">09.00 - 10.00 WIB</div>
                </div>
                <div className="t13-event-item">
                  <div className="t13-event-title">RECEPTION</div>
                  <div className="t13-event-time">11.00 - 14.00 WIB</div>
                </div>
                <div className="t13-countdown t13-countdown-inline">
                  <div className="t13-countdown-grid">
                    <div><div className="num">{countdown.days}</div><div className="txt">hari</div></div>
                    <div><div className="num">{countdown.hours}</div><div className="txt">jam</div></div>
                    <div><div className="num">{countdown.minutes}</div><div className="txt">mnt</div></div>
                    <div><div className="num">{countdown.seconds}</div><div className="txt">dtk</div></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="t13-meta">
              <MapPin size={16} /> {COUPLE.venueShort}, {COUPLE.venueAddress}
            </div>
            {showCeremonyImage && (
              <div className="t13-quote-frame">
                <img
                  src={IMAGE_PATHS.ceremony}
                  alt="ceremony"
                  onError={() => setShowCeremonyImage(false)}
                />
              </div>
            )}
            <div className="t13-direction">
              <div className="t13-direction-tag">Direction to Venue</div>
              <div className="t13-direction-card">
                <div className="t13-direction-venue">{COUPLE.venueShort}</div>
                <div className="t13-direction-address">{COUPLE.venueAddress}</div>
                <div className="t13-map t13-map-plain">
                  <iframe
                    title="Map Lokasi Acara"
                    src={mapsEmbedSrc}
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="t13-direction-actions">
                  <a className="t13-btn t13-btn-ghost" href={mapsLink} target="_blank" rel="noreferrer">Lihat Lokasi</a>
                </div>
              </div>
            </div>
            <div className="t13-cta">
              <button onClick={addToCalendar} className="t13-btn t13-btn-solid">Add to Calendar</button>
            </div>
          </div>

          <div className="t13-photo-section scroll-react from-right">
            {/* masukan path gambar baru disini: section foto ini pakai path baru IMAGE_PATHS.momentsTop & IMAGE_PATHS.momentsBottom */}
            <div className="t13-photo-wide">
              <img src={IMAGE_PATHS.momentsTop} alt="moment wide" />
            </div>
            <div className="t13-photo-row">
              <div className="t13-photo-square">
                <img src={IMAGE_PATHS.momentsBottom} alt="moment square" />
              </div>
              <div className="t13-photo-verttext">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </div>
            </div>
            <div className="t13-paper-card">
              <div className="t13-paper-top">
                <span>THE</span>
                <span>WEDDING</span>
              </div>
              <div className="t13-paper-date">06.25.26</div>
              <div className="t13-paper-names">MUSHAB & KEISYA</div>
              <div className="t13-paper-title">WE ARE GETTING MARRIED</div>
            </div>
          </div>
        </section>

        <section className="t13-section t13-grid scroll-react from-left">
          <div className="t13-card">
            <h2 className="t13-title">RSVP Your Attendance</h2>
            {rsvpSubmitted ? (
              <div className="t13-success">Terima kasih atas konfirmasi kehadiran Anda!</div>
            ) : (
              <form onSubmit={submitRSVP} className="t13-form">
                <input
                  type="text"
                  placeholder="Nama Anda"
                  value={rsvpForm.name}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                  className="t13-input"
                  required
                />
                <select
                  value={rsvpForm.attendance}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, attendance: e.target.value })}
                  className="t13-input"
                  required
                >
                  <option value="1">Hadir - 1 Orang</option>
                  <option value="2">Hadir - 2 Orang</option>
                  <option value="0">Tidak Hadir</option>
                </select>
                <textarea
                  placeholder={rsvpForm.attendance === "0" ? "Pesan (wajib diisi)" : "Pesan (opsional)"}
                  value={rsvpForm.message}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                  className="t13-input"
                  rows="3"
                  required={rsvpForm.attendance === "0"}
                />
                <button type="submit" className="t13-btn t13-btn-solid w-full">Kirim RSVP</button>
              </form>
            )}
          </div>

          <div className="t13-card">
            <h2 className="t13-title">Send your wishes</h2>
            {wishSubmitted && <div className="t13-success">Ucapan Anda telah dikirim!</div>}
            <form onSubmit={submitWish} className="t13-form">
              <input
                type="text"
                placeholder="Nama Anda"
                value={wishForm.name}
                onChange={(e) => setWishForm({ ...wishForm, name: e.target.value })}
                className="t13-input"
                required
              />
              <textarea
                placeholder="Ucapan Anda"
                value={wishForm.message}
                onChange={(e) => setWishForm({ ...wishForm, message: e.target.value })}
                className="t13-input"
                rows="3"
                required
              />
              <button type="submit" className="t13-btn t13-btn-ghost w-full">Kirim Ucapan</button>
            </form>
            <div className="t13-wish-list">
              {wishes.slice(0, 10).map((wish) => (
                <div key={wish.id} className="t13-wish">
                  <div className="name">{wish.name}</div>
                  <div className="msg">{wish.message}</div>
                  <button onClick={() => deleteWish(wish.id)} className="t13-wish-delete">×</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {!started && (
        <div className={`t13-intro ${isOpening ? "is-opening" : ""}`}>
          <div className="t13-intro-frame">
            <div className="t13-intro-meta t13-intro-meta-top">
              <span>JUNE</span>
              <span>20</span>
              <span>YEAR OF</span>
              <span>2026</span>
            </div>

            <div className="t13-intro-side t13-intro-left">THE WEDDING OF</div>
            <div className="t13-intro-side t13-intro-right">MUSHAB & KEISYA</div>

            <div className="t13-intro-center">
              <div className="t13-intro-names">
                MUSHAB
                <span>&</span>
                KEISYA
              </div>
            </div>

            <div className="t13-intro-meta t13-intro-meta-mid">
              <span>JUNE</span>
              <span>20</span>
              <span>YEAR OF</span>
              <span>2026</span>
            </div>

            <div className="t13-intro-bottom">
              <div className="t13-intro-caption">Dear</div>
              <div className="t13-intro-subtitle">Penerima Undangan</div>
              <div className="t13-intro-action">
                <button onClick={handleStart} disabled={isOpening} className="t13-intro-btn">
                  <BookOpen size={16} />
                  Open Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="t13-fab">
        <button onClick={toggleECheckin} className="t13-btn t13-btn-dark">
          {showECheckin ? <EyeOff size={16} /> : <Eye size={16} />} <span>{showECheckin ? "Hide QR Code" : "Show QR Code"}</span>
        </button>
      </div>

      {renderECheckin && (
        <div className={`t13-echeckin ${showECheckin ? "is-show" : ""}`}>
          <h4>E-CHECKIN CARD</h4>
          <p>Mushab & Keisya - Resepsi Pernikahan</p>
          <div className="qr">
            <img src={guest.qrCode || IMAGE_PATHS.defaultQR} alt="qr" />
          </div>
          <button onClick={downloadQR} className="t13-btn t13-btn-ghost w-full">Download QR</button>
        </div>
      )}
    </div>
  );  
}

