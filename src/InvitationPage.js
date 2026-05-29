import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Eye, EyeOff, BookOpen, MapPin, Gift, Volume2, VolumeX, CalendarCheck, ArrowRight } from "lucide-react";

// FIREBASE 
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

import "./App.css";
// masukan path gambar baru disini: semua asset utama undangan
const IMAGE_PATHS = {
  cover: "/images/fixsatu.png", // masukan path gambar baru disini (hero cover)
  quote: "/images/fixdua.png", // masukan path gambar baru disini (words of love)
  brideLeft: "/images/mushabhbfix.png", // masukan path gambar baru disini (foto mempelai slot 1)
  brideRight: "/images/catunkfixhb.png", // masukan path gambar baru disini (foto mempelai slot 2)
  ceremony: "", // masukan path gambar baru disini (foto acara), kosongkan kalau belum ada
  defaultQR: "", // masukan path gambar baru disini (fallback QR), kosongkan kalau belum ada
  momentsTop: "/images/fixtiga.png", // masukan path gambar baru disini (frame foto atas di section foto)
  momentsBottom: "/images/gantipotobox.png" // masukan path gambar baru disini (frame foto bawah di section foto)
};

// Couple / Venue text - edit here if needed
const COUPLE = {
  groom: "Muhamad Mushab",
  bride: "Keisya Aprilia",
  venueShort: "MASJID AL-FITRAH PINDAD",
  venueAddress: "Jl. Gatot Subroto No.517 Sukapura Kec. Kiaracondong Kota Bandung",
};

const GIFT_INFO = {
  bankName: "BCA",
  accountNumber: "6631131619",
  accountHolder: "Muhamad Mushab"
};

const MUSIC_CONFIG = {
  src: "/audio/swsundangan.mp3",
  subtitle: "Sleeping With Sirens - Scene One: James Dean & Audrey Hepburn (Acoustic Version)"
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
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [renderGiftPopup, setRenderGiftPopup] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [isMusicControlHidden, setIsMusicControlHidden] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferNotice, setTransferNotice] = useState({ type: "", message: "" });
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [musicNotice, setMusicNotice] = useState("");
  const [isMusicAvailable, setIsMusicAvailable] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Countdown
  const [countdown, setCountdown] = useState({ days: "--", hours: "--", minutes: "--", seconds: "--" });

  const audioRef = useRef(null);

  // RSVP states
  const [rsvpForm, setRsvpForm] = useState({ name: "", attendance: "1", message: "" });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Wish Wall states
  const [wishes, setWishes] = useState([]);
  const [wishForm, setWishForm] = useState({ name: "", message: "" });
  const [wishSubmitted, setWishSubmitted] = useState(false);
  const [showCeremonyImage, setShowCeremonyImage] = useState(true);
  const [transferForm, setTransferForm] = useState({
    name: "",
    amount: "",
    proofFile: "",
    message: ""
  });

  // Default nama pengisi form mengikuti nama penerima undangan.
  useEffect(() => {
    if (!guest?.name) return;
    setRsvpForm((prev) => (prev.name ? prev : { ...prev, name: guest.name }));
    setWishForm((prev) => (prev.name ? prev : { ...prev, name: guest.name }));
    setTransferForm((prev) => ({ ...prev, name: guest.name }));
  }, [guest]);

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
            qrCode: d.qrCode || IMAGE_PATHS.defaultQR
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
        name: guest?.name || rsvpForm.name,
        attendance: rsvpForm.attendance,
        guests: rsvpForm.attendance === "0" ? 0 : parseInt(rsvpForm.attendance),
        message: rsvpForm.message,
        guestId: uniqueId,
        timestamp: new Date()
      });
      setRsvpSubmitted(true);
      setRsvpForm({ name: guest?.name || "", attendance: "1", message: "" });
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
        name: guest?.name || wishForm.name,
        message: wishForm.message,
        timestamp: new Date()
      });
      setWishSubmitted(true);
      setWishForm({ name: guest?.name || "", message: "" });
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

  const scrollToRsvp = () => {
    document.getElementById("rsvp")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  // ----------------- E-checkin toggle & QR download -----------------
  const toggleECheckin = () => {
    if (showECheckin) {
      setShowECheckin(false);
      setTimeout(() => setRenderECheckin(false), 380);
    } else {
      if (showGiftPopup) {
        setShowGiftPopup(false);
        setTimeout(() => setRenderGiftPopup(false), 380);
      }
      setRenderECheckin(true);
      setTimeout(() => setShowECheckin(true), 20);
    }
  };

  const toggleGiftPopup = () => {
    if (showGiftPopup) {
      setShowGiftPopup(false);
      setTimeout(() => setRenderGiftPopup(false), 380);
      setShowTransferForm(false);
      return;
    }
    if (showECheckin) {
      setShowECheckin(false);
      setTimeout(() => setRenderECheckin(false), 380);
    }
    setRenderGiftPopup(true);
    setTimeout(() => setShowGiftPopup(true), 20);
  };

  const closeGiftPopup = () => {
    setShowGiftPopup(false);
    setTimeout(() => setRenderGiftPopup(false), 380);
    setShowTransferForm(false);
    setTransferNotice({ type: "", message: "" });
  };

  const downloadQR = () => {
    if (!guest || !guest.qrCode) return;
    const link = document.createElement("a");
    link.href = guest.qrCode;
    link.download = `QR-${guest.name || "guest"}.png`;
    link.click();
  };

  const playWeddingMusic = async ({ restart = false } = {}) => {
    const audio = audioRef.current;
    if (!audio || !isMusicAvailable) return;
    try {
      audio.volume = 0.55;
      if (restart) audio.currentTime = 0;
      await audio.play();
      setIsMusicOn(true);
      setIsMusicPlaying(true);
      setMusicNotice("");
    } catch (error) {
      console.warn("Music playback was blocked or unavailable:", error);
      setIsMusicOn(false);
      setIsMusicPlaying(false);
      setMusicNotice("Tap untuk memutar musik");
    }
  };

  const stopWeddingMusic = ({ fromBackground = false } = {}) => {
    const audio = audioRef.current;
    audio?.pause();
    setIsMusicOn(false);
    setIsMusicPlaying(false);
    setMusicNotice(fromBackground ? "Musik dijeda saat aplikasi ditutup" : "");
  };

  const handleStart = () => {
    if (isOpening) return;
    setIsOpening(true);
    if (isMusicOn) {
      playWeddingMusic({ restart: true });
    }
    setTimeout(() => {
      setStarted(true);
      setIsOpening(false);
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 420);
  };

  const toggleMusic = () => {
    if (isMusicOn && isMusicPlaying) {
      stopWeddingMusic();
      return;
    }

    if (!isMusicAvailable) {
      setMusicNotice("File musik belum tersedia");
      return;
    }

    setIsMusicOn(true);
    playWeddingMusic();
  };

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(GIFT_INFO.accountNumber);
      setTransferNotice({ type: "success", message: "Nomor rekening berhasil disalin" });
    } catch (error) {
      console.error("Failed to copy account number:", error);
      setTransferNotice({ type: "error", message: "Gagal menyalin nomor rekening" });
    }
  };

  const formatRupiah = (digits) => {
    if (!digits) return "";
    const numeric = parseInt(String(digits).replace(/[^\d]/g, ""), 10);
    if (!numeric) return "";
    return `Rp ${new Intl.NumberFormat("id-ID").format(numeric)}`;
  };

  const submitTransferConfirmation = async (e) => {
    e.preventDefault();
    const parsedAmount = parseInt(String(transferForm.amount).replace(/[^\d]/g, ""), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setTransferNotice({ type: "error", message: "Mohon isi jumlah transfer yang valid" });
      return;
    }

    try {
      setIsSubmittingTransfer(true);
      setTransferNotice({ type: "loading", message: "Mengirim konfirmasi transfer..." });
      await addDoc(collection(db, "gifts"), {
        guestId: uniqueId,
        name: guest?.name || transferForm.name,
        amount: parsedAmount,
        proofFileName: transferForm.proofFile || "",
        message: transferForm.message || "",
        timestamp: new Date()
      });
      setTransferForm({
        name: guest?.name || "",
        amount: "",
        proofFile: "",
        message: ""
      });
      setShowTransferForm(false);
      setTransferNotice({ type: "success", message: "Konfirmasi transfer berhasil dikirim" });
    } catch (error) {
      console.error("Error submitting transfer confirmation:", error);
      const errCode = error?.code || "unknown";
      if (errCode === "permission-denied") {
        setTransferNotice({ type: "error", message: "Gagal kirim konfirmasi: Firestore rules menolak akses ke collection gifts" });
      } else {
        setTransferNotice({ type: "error", message: `Gagal kirim konfirmasi transfer (${errCode})` });
      }
    } finally {
      setIsSubmittingTransfer(false);
    }
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

  useEffect(() => {
    if (!transferNotice.message || transferNotice.type === "loading") return;
    const timer = setTimeout(() => setTransferNotice({ type: "", message: "" }), 3200);
    return () => clearTimeout(timer);
  }, [transferNotice]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.55;
    if (!isMusicOn) {
      audio.pause();
      setIsMusicPlaying(false);
    }
  }, [isMusicOn]);

  useEffect(() => {
    const stopForBackground = () => {
      const audio = audioRef.current;
      const shouldShowPausedState = started || (audio && !audio.paused);
      audio?.pause();
      if (!shouldShowPausedState) return;
      setIsMusicOn(false);
      setIsMusicPlaying(false);
      setMusicNotice("Musik dijeda saat aplikasi ditutup");
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState !== "visible") {
        stopForBackground();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("freeze", stopForBackground);
    window.addEventListener("pagehide", stopForBackground);
    window.addEventListener("beforeunload", stopForBackground);
    window.addEventListener("blur", stopForBackground);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("freeze", stopForBackground);
      window.removeEventListener("pagehide", stopForBackground);
      window.removeEventListener("beforeunload", stopForBackground);
      window.removeEventListener("blur", stopForBackground);
    };
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

  const isMusicActive = isMusicOn && isMusicPlaying;
  const hasQrCode = Boolean(guest?.qrCode);

    // ----------------- MAIN RENDER -----------------
  return (
    <div className="theme13">
      <audio
        ref={audioRef}
        src={MUSIC_CONFIG.src}
        loop
        preload="auto"
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
        onError={() => {
          setIsMusicAvailable(false);
          setIsMusicOn(false);
          setMusicNotice("File musik belum tersedia");
        }}
      />
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
          <div className="t13-hero-rsvp">
            <button type="button" onClick={scrollToRsvp} className="t13-rsvp-jump t13-hero-rsvp-button">
              <span className="t13-rsvp-icon" aria-hidden="true">
                <CalendarCheck size={17} />
              </span>
              <span className="t13-rsvp-button-copy">
                <span className="t13-rsvp-button-kicker">RSVP HERE</span>
                <span className="t13-rsvp-button-label">Save My Seat</span>
              </span>
              <ArrowRight className="t13-rsvp-arrow" size={17} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="t13-section t13-couple-section t13-couple-modern scroll-react from-right">
          <div className="t13-card t13-couple-card">
            <div className="t13-couple-header">
              <div className="t13-couple-eyebrow">Wedding Couple</div>
              <div className="t13-couple-title-wrap" aria-label="Bride and Groom">
                <span className="t13-couple-title-rule" aria-hidden="true" />
                <h2 className="t13-couple-section-title">Bride <span>&amp;</span> Groom</h2>
                <span className="t13-couple-title-rule" aria-hidden="true" />
              </div>
              <div className="t13-couple-modern-sub">Together with our families, we invite you to celebrate our wedding day.</div>
              <div className="t13-couple-script">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
              <div className="t13-couple-sub">We invite you to join our wedding</div>
            </div>

            <div className="t13-couple-pair">
              <article className="t13-couple-profile t13-groom-profile">
                <div className="t13-profile-label">Groom</div>
                <div className="t13-couple-photo-placeholder t13-couple-portrait t13-groom-art">
                  <img src={IMAGE_PATHS.brideLeft} alt={COUPLE.groom} />
                </div>
                <div className="t13-couple-text">
                  <div className="t13-couple-name">{COUPLE.groom.toUpperCase()}</div>
                  <div className="t13-couple-desc">
                    Putra Pertama dari
                    <br />
                    Bpk. Cholifah Holid
                    <br />
                    & Ibu Tjut Rahmawati
                  </div>
                </div>
              </article>

              <div className="t13-couple-amp" aria-hidden="true">&amp;</div>

              <article className="t13-couple-profile t13-bride-profile">
                <div className="t13-profile-label">Bride</div>
                <div className="t13-couple-photo-placeholder t13-couple-portrait t13-bride-art">
                  <img src={IMAGE_PATHS.brideRight} alt={COUPLE.bride} />
                </div>
                <div className="t13-couple-text t13-couple-text-right">
                  <div className="t13-couple-name">{COUPLE.bride.toUpperCase()}</div>
                  <div className="t13-couple-desc">
                    Putri Tunggal dari
                    <br />
                    Bpk. (Alm) Indra Rosindra
                    <br />
                    & Ibu. (Almh) Ade Tatin
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="t13-section scroll-react from-right t13-words-section">
          <div className="t13-words-panel">
            <div className="t13-words-copy">
              <div className="t13-section-kicker">A NOTE ON LOVE</div>
              <h2 className="t13-title t13-words-title">Words of Love</h2>
              <div className="t13-quote-text">
                Di antara tanda-tanda (kebesaran)-Nya ialah bahwa Dia menciptakan pasangan-pasangan untukmu dari (jenis) dirimu sendiri agar kamu merasa tenteram kepadanya.
              </div>
              <div className="t13-quote-ref">(Q.S Ar-Rum : 21)</div>
            </div>

            <div className="t13-quote-art">
              <div className="t13-quote-photo">
                <img src={IMAGE_PATHS.quote} alt="quote" />
              </div>
              <div className="t13-art-caption">Together, in calm and grace</div>
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
                  <div className="t13-event-title">AKAD NIKAH (Private Session)</div>
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
            {showCeremonyImage && IMAGE_PATHS.ceremony && (
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
            <div className="t13-story-header">
              <div className="t13-section-kicker">THE TWO OF US</div>
            </div>
            <div className="t13-moments-frame">
              <div className="t13-story-spotlight">
                <div className="t13-photo-wide">
                  <img src={IMAGE_PATHS.momentsTop} alt="moment wide" />
                </div>
              </div>
              <div className="t13-photo-row">
                <div className="t13-photo-square">
                  <img src={IMAGE_PATHS.momentsBottom} alt="moment square" />
                </div>
                <div className="t13-photo-verttext">
                  Setiap langkah kecil membawa kami pada hari yang kami syukuri bersama keluarga dan sahabat.
                </div>
              </div>
            </div>
            <div className="t13-paper-card">
              <div className="t13-paper-top">
                <span>THE</span>
                <span>WEDDING</span>
              </div>
              <div className="t13-paper-date">06.20.26</div>
              <div className="t13-paper-names">MUSHAB & KEISYA</div>
              <div className="t13-paper-title">WE ARE GETTING MARRIED</div>
            </div>
          </div>
        </section>

        <section id="rsvp" className="t13-section t13-grid scroll-react from-left">
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
                readOnly
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
                readOnly
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
              <div className="t13-intro-subtitle">{guest?.name || "Penerima Undangan"}</div>
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
        <button
          onClick={toggleGiftPopup}
          className={`t13-btn t13-btn-dark t13-fab-action ${showGiftPopup ? "is-active" : ""}`}
          aria-label={showGiftPopup ? "Sembunyikan gift section" : "Tampilkan gift section"}
          title={showGiftPopup ? "Hide Gift Section" : "Gift Section"}
        >
          <Gift size={16} /> <span>Gift</span>
        </button>
        <button
          onClick={toggleECheckin}
          className={`t13-btn t13-btn-dark t13-fab-action ${showECheckin ? "is-active" : ""}`}
          aria-label={showECheckin ? "Sembunyikan QR code" : "Tampilkan QR code"}
          title={showECheckin ? "Hide QR Code" : "Show QR Code"}
        >
          {showECheckin ? <EyeOff size={16} /> : <Eye size={16} />} <span>QR Code</span>
        </button>
        {isMusicControlHidden ? (
          <button type="button" onClick={() => setIsMusicControlHidden(false)} className="t13-btn t13-btn-dark t13-music-reveal">
            <Eye size={16} /> <span>Show Music</span>
          </button>
        ) : (
          <div className={`t13-music-control ${isMusicActive ? "is-playing is-on" : "is-off"}`}>
            <button
              type="button"
              onClick={toggleMusic}
              className="t13-music-btn"
              aria-label={isMusicActive ? "Matikan musik" : "Nyalakan musik"}
              aria-pressed={isMusicActive}
              title={musicNotice || MUSIC_CONFIG.subtitle}
            >
              <span className="t13-music-disc" aria-hidden="true">
                {isMusicActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </span>
              <span className="t13-music-copy">
                <span className="t13-music-label">Musik</span>
                <span className="t13-music-title">{musicNotice || MUSIC_CONFIG.subtitle}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsMusicControlHidden(true)}
              className="t13-music-hide-btn"
              aria-label="Sembunyikan kontrol musik"
              title="Sembunyikan kontrol musik"
            >
              <EyeOff size={17} />
            </button>
          </div>
        )}
      </div>

      {renderECheckin && (
        <div className={`t13-echeckin ${showECheckin ? "is-show" : ""}`}>
          <h4>E-CHECKIN CARD</h4>
          <p>Mushab & Keisya - Resepsi Pernikahan</p>
          <div className="qr">
            {hasQrCode ? (
              <img src={guest.qrCode} alt="qr" />
            ) : (
              <div className="t13-qr-empty">QR belum tersedia</div>
            )}
          </div>
          <button onClick={downloadQR} className="t13-btn t13-btn-ghost w-full" disabled={!hasQrCode}>Download QR</button>
        </div>
      )}

      {renderGiftPopup && (
        <div className={`t13-echeckin t13-gift-popup ${showGiftPopup ? "is-show" : ""}`}>
          <h4>GIFT SECTION</h4>
          {transferNotice.message && (
            <div className={`t13-transfer-notice is-${transferNotice.type}`}>
              {transferNotice.message}
            </div>
          )}
          {!showTransferForm ? (
            <>
              <p>Silakan kirim hadiah ke rekening berikut</p>
              <div className="t13-form">
                <div className="t13-input">
                  <strong>Bank</strong>
                  <div>{GIFT_INFO.bankName}</div>
                </div>
                <div className="t13-input">
                  <strong>Nomor Rekening</strong>
                  <div>{GIFT_INFO.accountNumber}</div>
                </div>
                <div className="t13-input">
                  <strong>A/N Rekening</strong>
                  <div>{GIFT_INFO.accountHolder}</div>
                </div>
                <button type="button" onClick={copyAccountNumber} className="t13-btn t13-btn-solid w-full">
                  Copy Nomor Rekening
                </button>
                <button type="button" onClick={() => setShowTransferForm(true)} className="t13-btn t13-btn-ghost w-full">
                  Konfirmasi Transfer
                </button>
                <button type="button" onClick={closeGiftPopup} className="t13-btn t13-btn-dark w-full">
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <p>Isi konfirmasi transfer</p>
              <form onSubmit={submitTransferConfirmation} className="t13-form">
                <input
                  type="text"
                  value={transferForm.name}
                  readOnly
                  className="t13-input"
                  required
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Jumlah Transfer (Rp)"
                  value={formatRupiah(transferForm.amount)}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
                    setTransferForm({ ...transferForm, amount: digitsOnly });
                  }}
                  className="t13-input"
                  required
                />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const fileName = e.target.files?.[0]?.name || "";
                    setTransferForm({ ...transferForm, proofFile: fileName });
                  }}
                  className="t13-input t13-file-input"
                />
                <textarea
                  placeholder="Ucapan (opsional)"
                  value={transferForm.message}
                  onChange={(e) => setTransferForm({ ...transferForm, message: e.target.value })}
                  className="t13-input"
                  rows="3"
                />
                <button type="submit" disabled={isSubmittingTransfer} className="t13-btn t13-btn-solid w-full">
                  {isSubmittingTransfer ? "Mengirim..." : "Kirim Konfirmasi"}
                </button>
                <button type="button" disabled={isSubmittingTransfer} onClick={() => setShowTransferForm(false)} className="t13-btn t13-btn-ghost w-full">
                  Kembali
                </button>
                <button type="button" disabled={isSubmittingTransfer} onClick={closeGiftPopup} className="t13-btn t13-btn-dark w-full">
                  Close
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );  
}
