import { useState, useCallback, useRef } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─── Icons ────────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);

const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9.09 9.09 2 12l7.09 2.91L12 22l2.91-7.09L22 12l-7.09-2.91L12 2z" />
  </svg>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="spinner">
    <div className="spinner-ring" />
  </div>
);

// ─── Progress Steps ───────────────────────────────────────────────────────────
const steps = [
  { label: "Uploading file", desc: "Securely transferring your data" },
  { label: "Parsing data", desc: "Reading rows and columns" },
  { label: "Generating AI summary", desc: "Gemini is analyzing your sales" },
  { label: "Sending email", desc: "Delivering to your inbox" },
];

const ProgressSteps = ({ currentStep }) => (
  <div className="progress-steps">
    {steps.map((step, i) => (
      <div key={i} className={`step ${i < currentStep ? "done" : i === currentStep ? "active" : "pending"}`}>
        <div className="step-dot">
          {i < currentStep ? "✓" : i + 1}
        </div>
        <div className="step-text">
          <span className="step-label">{step.label}</span>
          <span className="step-desc">{step.desc}</span>
        </div>
      </div>
    ))}
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");
  const fileInputRef = useRef();

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setErrorMsg("Only CSV and XLSX files are supported.");
      setStatus("error");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg("File must be under 10MB.");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) { setErrorMsg("Please upload a file."); setStatus("error"); return; }
    if (!validateEmail(email)) { setEmailError("Enter a valid email address."); return; }

    setEmailError("");
    setErrorMsg("");
    setStatus("loading");
    setCurrentStep(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", email);

    // Simulate step progression
    const stepTimers = [
      setTimeout(() => setCurrentStep(1), 800),
      setTimeout(() => setCurrentStep(2), 1600),
      setTimeout(() => setCurrentStep(3), 3000),
    ];

    try {
      const res = await axios.post(`${API_URL}/api/summarize`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      stepTimers.forEach(clearTimeout);
      setCurrentStep(4);
      setResult(res.data);
      setTimeout(() => setStatus("success"), 400);
    } catch (err) {
      stepTimers.forEach(clearTimeout);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0] ||
        "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setEmail("");
    setStatus("idle");
    setCurrentStep(0);
    setResult(null);
    setErrorMsg("");
    setEmailError("");
  };

  return (
    <div className="app">
      {/* Background elements */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-grid" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">
              <SparkleIcon />
            </div>
            <span>SalesSummarizer</span>
          </div>
          <a
            href={`${API_URL}/api-docs`}
            target="_blank"
            rel="noreferrer"
            className="docs-link"
          >
            API Docs
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="hero">
          <div className="tag">
            <SparkleIcon /> Powered by Google Gemini
          </div>
          <h1 className="title">
            Turn Raw Sales Data<br />Into Executive Insights
          </h1>
          <p className="subtitle">
            Upload a CSV or Excel file. Receive a professional AI-generated
            summary directly in your inbox — in under 60 seconds.
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {status === "idle" && (
            <form onSubmit={handleSubmit} noValidate>
              {/* Drop zone */}
              <div
                className={`dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
                {file ? (
                  <div className="file-preview">
                    <div className="file-icon-wrap">
                      <FileIcon />
                    </div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon-wrap">
                      <UploadIcon />
                    </div>
                    <p className="drop-text">
                      <strong>Drop your file here</strong> or click to browse
                    </p>
                    <p className="drop-hint">Supports CSV, XLSX, XLS · Max 10MB</p>
                  </>
                )}
              </div>

              {/* Email input */}
              <div className="field">
                <label className="field-label" htmlFor="email">
                  Recipient Email
                </label>
                <div className={`input-wrap ${emailError ? "has-error" : ""}`}>
                  <span className="input-icon"><EmailIcon /></span>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="analyst@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    required
                  />
                </div>
                {emailError && <span className="field-error">{emailError}</span>}
              </div>

              <button type="submit" className="submit-btn" disabled={!file || !email}>
                <SparkleIcon />
                Generate & Send Summary
              </button>

              <p className="disclaimer">
                Your data is processed in memory and never stored on our servers.
              </p>
            </form>
          )}

          {/* Loading State */}
          {status === "loading" && (
            <div className="loading-state">
              <Spinner />
              <h2 className="loading-title">Analyzing Your Data</h2>
              <p className="loading-sub">This usually takes 15–30 seconds</p>
              <ProgressSteps currentStep={currentStep} />
            </div>
          )}

          {/* Success State */}
          {status === "success" && result && (
            <div className="success-state">
              <div className="success-icon">
                <CheckIcon />
              </div>
              <h2 className="success-title">Summary Sent!</h2>
              <p className="success-sub">
                Check <strong>{email}</strong> — your AI-generated report is on its way.
              </p>

              <div className="result-meta">
                <div className="meta-item">
                  <span className="meta-label">File</span>
                  <span className="meta-value">{result.meta?.filename}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Rows analyzed</span>
                  <span className="meta-value">{result.meta?.rowCount?.toLocaleString()}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Request ID</span>
                  <span className="meta-value mono">{result.requestId?.slice(0, 8)}...</span>
                </div>
              </div>

              {result.summary && (
                <div className="summary-preview">
                  <p className="summary-preview-label">Preview</p>
                  <p className="summary-preview-text">{result.summary}</p>
                </div>
              )}

              <button className="reset-btn" onClick={handleReset}>
                Analyze Another File
              </button>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="error-state">
              <div className="error-icon">
                <ErrorIcon />
              </div>
              <h2 className="error-title">Something went wrong</h2>
              <p className="error-msg">{errorMsg}</p>
              <button className="reset-btn" onClick={handleReset}>
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="features">
          {[
            { icon: "🔒", title: "Secure Upload", desc: "Files processed in memory, never stored" },
            { icon: "🤖", title: "Gemini AI", desc: "Executive-grade narrative analysis" },
            { icon: "📧", title: "Instant Delivery", desc: "Formatted HTML report to your inbox" },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>Sales Summarizer · MERN Stack · Gemini AI · Built for production</p>
      </footer>
    </div>
  );
}
