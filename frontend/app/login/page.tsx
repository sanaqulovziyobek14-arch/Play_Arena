"use client";

import {Suspense, useEffect, useState} from "react";
import Link from "next/link";
import {motion} from "framer-motion";
import {useRouter} from "next/navigation";
import {authAPI, setTokens, statsAPI} from "@/services/api";

function LoginContent() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [venuesCount, setVenuesCount] = useState<number | null>(null);

    useEffect(() => {
        statsAPI.get().then(s => setVenuesCount(s.total_venues)).catch(() => setVenuesCount(null));
    }, []);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");  // ✅ Parolni tasdiqlash
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showPass2, setShowPass2] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const reset = () => {
        setError("");
        setFieldErrors({});
        setUsername("");
        setPassword("");
        setPassword2("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
    };

    // ── Real-time parol kuchini tekshirish
    const passwordStrength = (): { score: number; label: string; color: string } => {
        if (!password) return {score: 0, label: "", color: ""};
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return {score: 1, label: "Zaif", color: "#ef4444"};
        if (score <= 2) return {score: 2, label: "O'rtacha", color: "#fbbf24"};
        if (score <= 3) return {score: 3, label: "Yaxshi", color: "#39FF14"};
        return {score: 4, label: "Kuchli", color: "#00D26A"};
    };
    const strength = passwordStrength();

    // ── Parollar mosligini real-time tekshirish
    const passwordsMatch = password2 === "" || password === password2;

    // ── Validatsiya
    const validate = (): boolean => {
        const errs: Record<string, string> = {};

        if (!username.trim()) {
            errs.username = "Login (username) ni kiriting";
        } else if (username.length < 4) {
            errs.username = "Username kamida 4 belgidan iborat bo'lishi kerak";
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errs.username = "Faqat lotin harflari, raqam va pastki chiziq (_)";
        }

        if (!password) {
            errs.password = "Parolni kiriting";
        } else if (!isLogin && password.length < 8) {
            errs.password = "Parol kamida 8 belgidan iborat bo'lishi kerak";
        }

        if (!isLogin) {
            // Faqat ro'yxatdan o'tishda qo'shimcha tekshiruv
            if (!password2) {
                errs.password2 = "Parolni qayta kiriting";
            } else if (password !== password2) {
                errs.password2 = "Parollar bir-biriga mos kelmadi";
            }
            if (!firstName.trim()) errs.firstName = "Ismni kiriting";
            if (!lastName.trim()) errs.lastName = "Familiyani kiriting";
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errs.email = "Email formati noto'g'ri";
            }
            if (phone && !/^\+?\d{9,15}$/.test(phone.replace(/\s/g, ""))) {
                errs.phone = "Telefon formati noto'g'ri (masalan +998901234567)";
            }
        }

        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        setError("");
        if (!validate()) return;

        setLoading(true);
        try {
            if (isLogin) {
                // ── KIRISH — faqat username + password
                const res = await authAPI.login({username: username.trim(), password});
                setTokens(res.access, res.refresh);
                router.push("/");
            } else {
                // ── RO'YXATDAN O'TISH
                await authAPI.register({
                    username: username.trim(),
                    password,
                    email: email.trim() || undefined,
                    phone: phone.trim() || undefined,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                });
                // Muvaffaqiyatli ro'yxatdan o'tgandan keyin avtomatik login
                const res = await authAPI.login({username: username.trim(), password});
                setTokens(res.access, res.refresh);
                router.push("/");
            }
        } catch (e: any) {
            let msg = e.message || "Xatolik yuz berdi";
            try {
                const parsed = JSON.parse(msg);
                // Backend dan kelgan field-specific xatolarni ko'rsatish
                const newFieldErrors: Record<string, string> = {};
                for (const key of Object.keys(parsed)) {
                    const val = Array.isArray(parsed[key]) ? parsed[key][0] : parsed[key];
                    if (key === "username") newFieldErrors.username = String(val);
                    else if (key === "password") newFieldErrors.password = String(val);
                    else if (key === "email") newFieldErrors.email = String(val);
                    else if (key === "phone") newFieldErrors.phone = String(val);
                    else if (key === "detail" || key === "non_field_errors") msg = String(val);
                }
                if (Object.keys(newFieldErrors).length > 0) {
                    setFieldErrors(prev => ({...prev, ...newFieldErrors}));
                    msg = "";
                } else if (!msg || msg === "{}") {
                    msg = isLogin
                        ? "Login yoki parol noto'g'ri"
                        : "Ro'yxatdan o'tishda xatolik yuz berdi";
                }
            } catch {
                // JSON emas — umumiy xato
                if (msg.toLowerCase().includes("no active account")) {
                    msg = "Login yoki parol noto'g'ri";
                }
            }
            if (msg) setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (hasError: boolean, isValid?: boolean) => ({
        width: "100%", padding: "11px 14px", borderRadius: "10px",
        background: "rgba(255,255,255,0.04)",
        border: hasError ? "1px solid rgba(239,68,68,0.5)"
            : isValid ? "1px solid rgba(57,255,20,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
        color: "#fff", fontSize: "13px", outline: "none", transition: "border .15s",
    });

    return (
        <main style={{
            minHeight: "100vh", background: "#050505",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px 16px", position: "relative", overflow: "hidden",
        }}>
            <div style={{
                position: "absolute", top: "20%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: "600px", height: "600px", borderRadius: "50%",
                background: "radial-gradient(circle,rgba(57,255,20,0.07) 0%,transparent 70%)",
                pointerEvents: "none",
            }}/>
            <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "linear-gradient(rgba(57,255,20,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(57,255,20,0.03) 1px,transparent 1px)",
                backgroundSize: "48px 48px", pointerEvents: "none",
            }}/>

            <div style={{width: "100%", maxWidth: "420px", position: "relative", zIndex: 1}}>

                {/* Logo */}
                <Link href="/" style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "10px", textDecoration: "none", marginBottom: "32px",
                }}>
                    <div style={{
                        width: "38px", height: "38px", borderRadius: "11px",
                        background: "linear-gradient(135deg,#39FF14,#00D26A)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 24px rgba(57,255,20,0.35)",
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                        </svg>
                    </div>
                    <span style={{fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em"}}>
            Play<span style={{color: "#39FF14"}}>Arena</span>
          </span>
                </Link>

                {/* Card */}
                <motion.div
                    initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}
                    style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px", padding: "32px",
                    backdropFilter: "blur(12px)",
                }}>

                    {/* Toggle */}
                    <div style={{
                        display: "flex", background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px", padding: "4px", marginBottom: "24px",
                    }}>
                        {["Kirish", "Ro'yxatdan o'tish"].map((label, i) => (
                            <button key={label} onClick={() => {
                                setIsLogin(i === 0);
                                reset();
                            }}
                                    style={{
                                        flex: 1, padding: "9px 12px", borderRadius: "9px",
                                        border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700,
                                        transition: "all .2s",
                                        background: (i === 0) === isLogin ? "linear-gradient(135deg,#39FF14,#00D26A)" : "transparent",
                                        color: (i === 0) === isLogin ? "#fff" : "rgba(255,255,255,0.4)",
                                        boxShadow: (i === 0) === isLogin ? "0 2px 12px rgba(57,255,20,0.25)" : "none",
                                    }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <div style={{marginBottom: "22px"}}>
                        <h1 style={{
                            fontSize: "22px",
                            fontWeight: 800,
                            color: "#fff",
                            letterSpacing: "-0.02em",
                            marginBottom: "6px"
                        }}>
                            {isLogin ? "Xush kelibsiz 👋" : "Hisob yarating"}
                        </h1>
                        <p style={{fontSize: "13px", color: "rgba(255,255,255,0.35)", lineHeight: 1.6}}>
                            {isLogin
                                ? "Avval ro'yxatdan o'tgan username va parolingizni kiriting"
                                : `Ro'yxatdan o'ting va ${venuesCount != null ? `${venuesCount}+` : ""} maydondan foydalaning`}
                        </p>
                    </div>

                    {/* Fields */}
                    <div style={{display: "flex", flexDirection: "column", gap: "14px"}}>

                        {!isLogin && (
                            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px"}}>
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "rgba(255,255,255,0.4)",
                                        marginBottom: "6px",
                                        textTransform: "uppercase",
                                        letterSpacing: ".05em"
                                    }}>
                                        Ism *
                                    </label>
                                    <input value={firstName} onChange={e => setFirstName(e.target.value)}
                                           placeholder="Ziyobek" style={inputStyle(!!fieldErrors.firstName)}
                                    />
                                    {fieldErrors.firstName && <p style={{
                                        fontSize: "11px",
                                        color: "#ef4444",
                                        marginTop: "4px"
                                    }}>{fieldErrors.firstName}</p>}
                                </div>
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "rgba(255,255,255,0.4)",
                                        marginBottom: "6px",
                                        textTransform: "uppercase",
                                        letterSpacing: ".05em"
                                    }}>
                                        Familiya *
                                    </label>
                                    <input value={lastName} onChange={e => setLastName(e.target.value)}
                                           placeholder="Sanaqulov" style={inputStyle(!!fieldErrors.lastName)}
                                    />
                                    {fieldErrors.lastName && <p style={{
                                        fontSize: "11px",
                                        color: "#ef4444",
                                        marginTop: "4px"
                                    }}>{fieldErrors.lastName}</p>}
                                </div>
                            </div>
                        )}

                        {/* Username */}
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.4)",
                                marginBottom: "6px",
                                textTransform: "uppercase",
                                letterSpacing: ".05em"
                            }}>
                                Login (username) *
                            </label>
                            <div style={{position: "relative"}}>
                                <span style={{
                                    position: "absolute",
                                    left: "13px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "15px",
                                    opacity: 0.35
                                }}>👤</span>
                                <input value={username}
                                       onChange={e => {
                                           setUsername(e.target.value);
                                           setFieldErrors(f => ({...f, username: ""}));
                                       }}
                                       placeholder={isLogin ? "Ro'yxatdan o'tgan username" : "username123"}
                                       style={{...inputStyle(!!fieldErrors.username), paddingLeft: "38px"}}
                                       autoComplete="username"
                                />
                            </div>
                            {fieldErrors.username && <p style={{
                                fontSize: "11px",
                                color: "#ef4444",
                                marginTop: "4px"
                            }}>{fieldErrors.username}</p>}
                        </div>

                        {!isLogin && (
                            <>
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "rgba(255,255,255,0.4)",
                                        marginBottom: "6px",
                                        textTransform: "uppercase",
                                        letterSpacing: ".05em"
                                    }}>
                                        Email <span style={{
                                        color: "rgba(255,255,255,0.2)",
                                        fontWeight: 400,
                                        textTransform: "none"
                                    }}>(ixtiyoriy)</span>
                                    </label>
                                    <div style={{position: "relative"}}>
                                        <span style={{
                                            position: "absolute",
                                            left: "13px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            fontSize: "15px",
                                            opacity: 0.35
                                        }}>✉️</span>
                                        <input type="email" value={email}
                                               onChange={e => {
                                                   setEmail(e.target.value);
                                                   setFieldErrors(f => ({...f, email: ""}));
                                               }}
                                               placeholder="email@example.com"
                                               style={{...inputStyle(!!fieldErrors.email), paddingLeft: "38px"}}
                                               autoComplete="email"
                                        />
                                    </div>
                                    {fieldErrors.email && <p style={{
                                        fontSize: "11px",
                                        color: "#ef4444",
                                        marginTop: "4px"
                                    }}>{fieldErrors.email}</p>}
                                </div>
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        color: "rgba(255,255,255,0.4)",
                                        marginBottom: "6px",
                                        textTransform: "uppercase",
                                        letterSpacing: ".05em"
                                    }}>
                                        Telefon <span style={{
                                        color: "rgba(255,255,255,0.2)",
                                        fontWeight: 400,
                                        textTransform: "none"
                                    }}>(ixtiyoriy)</span>
                                    </label>
                                    <div style={{position: "relative"}}>
                                        <span style={{
                                            position: "absolute",
                                            left: "13px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            fontSize: "15px",
                                            opacity: 0.35
                                        }}>📱</span>
                                        <input type="tel" value={phone}
                                               onChange={e => {
                                                   setPhone(e.target.value);
                                                   setFieldErrors(f => ({...f, phone: ""}));
                                               }}
                                               placeholder="+998901234567"
                                               style={{...inputStyle(!!fieldErrors.phone), paddingLeft: "38px"}}
                                               autoComplete="tel"
                                        />
                                    </div>
                                    {fieldErrors.phone && <p style={{
                                        fontSize: "11px",
                                        color: "#ef4444",
                                        marginTop: "4px"
                                    }}>{fieldErrors.phone}</p>}
                                </div>
                            </>
                        )}

                        {/* Password */}
                        <div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "6px"
                            }}>
                                <label style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "rgba(255,255,255,0.4)",
                                    textTransform: "uppercase",
                                    letterSpacing: ".05em"
                                }}>
                                    Parol *
                                </label>
                                {isLogin && (
                                    <span style={{fontSize: "12px", color: "#39FF14", cursor: "pointer"}}>
                    Unutdingizmi?
                  </span>
                                )}
                            </div>
                            <div style={{position: "relative"}}>
                                <span style={{
                                    position: "absolute",
                                    left: "13px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "15px",
                                    opacity: 0.35
                                }}>🔒</span>
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={e => {
                                        setPassword(e.target.value);
                                        setFieldErrors(f => ({...f, password: ""}));
                                    }}
                                    placeholder="••••••••"
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && isLogin) handleSubmit();
                                    }}
                                    style={{
                                        ...inputStyle(!!fieldErrors.password),
                                        paddingLeft: "38px",
                                        paddingRight: "40px"
                                    }}
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                                <button onClick={() => setShowPass(!showPass)} style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    opacity: 0.4,
                                }}>
                                    {showPass ? "🙈" : "👁️"}
                                </button>
                            </div>
                            {fieldErrors.password && <p style={{
                                fontSize: "11px",
                                color: "#ef4444",
                                marginTop: "4px"
                            }}>{fieldErrors.password}</p>}

                            {/* Parol kuchini ko'rsatish — faqat register da */}
                            {!isLogin && password && (
                                <div style={{marginTop: "8px"}}>
                                    <div style={{display: "flex", gap: "4px", marginBottom: "5px"}}>
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} style={{
                                                flex: 1, height: "3px", borderRadius: "2px",
                                                background: i <= strength.score ? strength.color : "rgba(255,255,255,0.08)",
                                                transition: "background .2s",
                                            }}/>
                                        ))}
                                    </div>
                                    <p style={{fontSize: "11px", color: strength.color}}>
                                        Parol kuchi: {strength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ✅ Parolni qayta kiritish — faqat ro'yxatdan o'tishda */}
                        {!isLogin && (
                            <div>
                                <label style={{
                                    display: "block",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "rgba(255,255,255,0.4)",
                                    marginBottom: "6px",
                                    textTransform: "uppercase",
                                    letterSpacing: ".05em"
                                }}>
                                    Parolni tasdiqlang *
                                </label>
                                <div style={{position: "relative"}}>
                                    <span style={{
                                        position: "absolute",
                                        left: "13px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        fontSize: "15px",
                                        opacity: 0.35
                                    }}>🔒</span>
                                    <input
                                        type={showPass2 ? "text" : "password"}
                                        value={password2}
                                        onChange={e => {
                                            setPassword2(e.target.value);
                                            setFieldErrors(f => ({...f, password2: ""}));
                                        }}
                                        placeholder="Parolni qayta kiriting"
                                        onKeyDown={e => {
                                            if (e.key === "Enter") handleSubmit();
                                        }}
                                        style={{
                                            ...inputStyle(!!fieldErrors.password2, password2.length > 0 && passwordsMatch),
                                            paddingLeft: "38px", paddingRight: "40px",
                                        }}
                                        autoComplete="new-password"
                                    />
                                    <button onClick={() => setShowPass2(!showPass2)} style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        opacity: 0.4,
                                    }}>
                                        {showPass2 ? "🙈" : "👁️"}
                                    </button>
                                    {/* Real-time mos kelish belgisi */}
                                    {password2.length > 0 && (
                                        <span style={{
                                            position: "absolute",
                                            right: "40px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            fontSize: "14px",
                                        }}>
                      {passwordsMatch ? "✅" : "❌"}
                    </span>
                                    )}
                                </div>
                                {fieldErrors.password2 ? (
                                    <p style={{
                                        fontSize: "11px",
                                        color: "#ef4444",
                                        marginTop: "4px"
                                    }}>{fieldErrors.password2}</p>
                                ) : password2.length > 0 && !passwordsMatch ? (
                                    <p style={{fontSize: "11px", color: "#ef4444", marginTop: "4px"}}>Parollar mos
                                        kelmadi</p>
                                ) : password2.length > 0 && passwordsMatch ? (
                                    <p style={{fontSize: "11px", color: "#39FF14", marginTop: "4px"}}>✓ Parollar mos
                                        keldi</p>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* General error */}
                    {error && (
                        <div style={{
                            marginTop: "16px", padding: "11px 14px", borderRadius: "10px",
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                            color: "#ef4444", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px",
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            width: "100%",
                            marginTop: "20px",
                            padding: "13px",
                            borderRadius: "12px",
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            background: loading ? "rgba(57,255,20,0.4)" : "linear-gradient(135deg,#39FF14,#00D26A)",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 700,
                            letterSpacing: ".01em",
                            boxShadow: loading ? "none" : "0 4px 20px rgba(57,255,20,0.3)",
                            transition: "all .2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}>
                        {loading ? (
                            <>
                <span style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                    display: "inline-block", animation: "spin 0.8s linear infinite",
                }}/>
                                Yuklanmoqda...
                            </>
                        ) : (
                            isLogin ? "Kirish →" : "Hisob yaratish →"
                        )}
                    </button>

                    {/* Divider */}
                    <div style={{display: "flex", alignItems: "center", gap: "12px", margin: "20px 0"}}>
                        <div style={{flex: 1, height: "1px", background: "rgba(255,255,255,0.07)"}}/>
                        <span style={{fontSize: "12px", color: "rgba(255,255,255,0.2)"}}>yoki</span>
                        <div style={{flex: 1, height: "1px", background: "rgba(255,255,255,0.07)"}}/>
                    </div>

                    {/* Switch mode */}
                    <p style={{textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.3)"}}>
                        {isLogin ? "Hisobingiz yo'qmi? " : "Allaqachon hisobingiz bormi? "}
                        <button onClick={() => {
                            setIsLogin(!isLogin);
                            reset();
                        }} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#39FF14", fontSize: "13px", fontWeight: 700,
                        }}>
                            {isLogin ? "Ro'yxatdan o'ting" : "Kiring"}
                        </button>
                    </p>
                </motion.div>

                <p style={{textAlign: "center", marginTop: "20px"}}>
                    <Link href="/" style={{
                        fontSize: "13px", color: "rgba(255,255,255,0.25)",
                        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px",
                    }}>
                        ← Bosh sahifaga qaytish
                    </Link>
                </p>
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #050505 inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div style={{
                background: "#050505",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    border: "2px solid rgba(57,255,20,0.2)", borderTopColor: "#39FF14",
                    animation: "spin 0.8s linear infinite",
                }}/>
            </div>
        }>
            <LoginContent/>
        </Suspense>
    );
}