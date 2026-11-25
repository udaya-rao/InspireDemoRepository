import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Box,
  Typography,
  Divider,
  IconButton,
  TextField,
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import PrintIcon from "@mui/icons-material/Print";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import "@react-pdf-viewer/core/lib/styles/index.css";

// Resolve the worker URL inline for Vite compatibility
const workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).href;

// Helper to extract ONLY the Item Code for each tab
const getTabLabel = (item, index) => {
  if (!item) return `Item ${index + 1}`;

  // 1. Direct Item Code properties from backend (if present)
  const directCode =
    item.ItemCode ||
    item.Item_Code ||
    item.itemCode ||
    item.item_code ||
    item.item_id ||
    item.itemId;
  if (directCode && String(directCode).trim() !== "") return String(directCode).trim();

  // 2. Extract from filename: e.g. "PurchaseOrderGRNPDF_664_2_0000IN2 - 11.Pdf"
  const fileName =
    item.PurchaseOrderOrWorkOrderGRNPDFFileName ||
    item.PurchaseOrderGRNPDFFileName ||
    item.WorkOrderGRNPDFFileName ||
    item.PurchaseGRNPDFFileName ||
    item.GRNPDFFileName ||
    item.fileName ||
    item.PDFFileName ||
    "";

  if (fileName) {
    const cleaned = fileName.replace(/\.pdf$/i, "");
    // Pattern: PurchaseOrderGRNPDF_<grnid>_<seq>_<ItemCode - Description>
    const match =
      cleaned.match(/PurchaseOrderOrWorkOrderGRNPDF_\d+_\d+_(.+)$/i) ||
      cleaned.match(/PurchaseOrderGRNPDF_\d+_\d+_(.+)$/i) ||
      cleaned.match(/WorkOrderGRNPDF_\d+_\d+_(.+)$/i) ||
      cleaned.match(/GRNPDF_\d+_\d+_(.+)$/i);

    let extracted = match && match[1] ? match[1].trim() : "";

    if (!extracted) {
      const parts = cleaned.split("_");
      if (parts.length >= 4) {
        extracted = parts.slice(3).join("_").trim();
      } else {
        extracted = cleaned;
      }
    }

    // Isolate ONLY the Item Code (strip description after " - " or "-")
    if (extracted.includes(" - ")) {
      return extracted.split(" - ")[0].trim();
    }
    if (extracted.includes("-")) {
      return extracted.split("-")[0].trim();
    }
    return extracted;
  }

  return `Item ${index + 1}`;
};

const getPdfBase64 = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return (
    item.PurchaseOrderOrWorkOrderGRNPDFBase64 ||
    item.PurchaseOrderGRNPDFBase64 ||
    item.WorkOrderGRNPDFBase64 ||
    item.PurchaseGRNPDFBase64 ||
    item.GRNPDFBase64 ||
    item.PDFBase64 ||
    item.pdfUrl ||
    item.Base64 ||
    item.base64 ||
    ""
  );
};

const getPdfFileName = (item, index) => {
  if (!item) return `document_${index + 1}.pdf`;
  if (typeof item === "object") {
    return (
      item.PurchaseOrderOrWorkOrderGRNPDFFileName ||
      item.PurchaseOrderGRNPDFFileName ||
      item.WorkOrderGRNPDFFileName ||
      item.PurchaseGRNPDFFileName ||
      item.GRNPDFFileName ||
      item.fileName ||
      item.PDFFileName ||
      `document_${index + 1}.pdf`
    );
  }
  return `document_${index + 1}.pdf`;
};

const MultiTabPDFViewerModal = ({
  isOpen,
  onClose,
  title,
  pdfList = [],
  pdfUrl,
  fileName = "document.pdf",
  hideActions = false,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [pdfData, setPdfData] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);

  // Plugins
  const zoomPluginInstance = zoomPlugin();
  const { zoomTo } = zoomPluginInstance;
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  // Normalize input: accepts either pdfList array or single pdfUrl
  const normalizedList = useMemo(() => {
    if (Array.isArray(pdfList) && pdfList.length > 0) {
      return pdfList.map((item, idx) => ({
        raw: item,
        label: getTabLabel(item, idx),
        base64: getPdfBase64(item),
        fileName: getPdfFileName(item, idx),
      }));
    }
    if (pdfUrl) {
      return [
        {
          raw: null,
          label: title || fileName || "Document",
          base64: pdfUrl,
          fileName: fileName || "document.pdf",
        },
      ];
    }
    return [];
  }, [pdfList, pdfUrl, title, fileName]);

  const activeItem = normalizedList[activeTabIndex] || normalizedList[0];
  const displayTitle = activeItem?.fileName || title || fileName;

  // Reset all state when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTabIndex(0);
      setZoomLevel(1.5);
      setCurrentPage(0);
      setPageInput("1");
      setIsPdfLoaded(false);
      setTotalPages(0);
      setPdfData("");
    }
  }, [isOpen]);

  // Load active tab's PDF data
  useEffect(() => {
    if (!isOpen || normalizedList.length === 0) {
      setPdfData("");
      setIsPdfLoaded(false);
      setTotalPages(0);
      return;
    }

    const current = normalizedList[activeTabIndex] || normalizedList[0];
    const rawBase64 = current?.base64 || "";

    if (!rawBase64) {
      setPdfData("");
      setIsPdfLoaded(false);
      setTotalPages(0);
      return;
    }

    const base64 = rawBase64.includes("base64,")
      ? rawBase64.split("base64,")[1]
      : rawBase64;

    try {
      setPdfData(`data:application/pdf;base64,${base64}`);
      setIsPdfLoaded(false);
      setTotalPages(0);
      setCurrentPage(0);
      setPageInput("1");
    } catch (err) {
      console.error("MultiTabPDFViewerModal: Invalid Base64 PDF data", err);
      setPdfData("");
    }
  }, [normalizedList, activeTabIndex, isOpen]);

  // ── Toolbar handlers ───────────────────────────────────────────────────────
  const handleZoomIn = () => {
    const next = Math.min(zoomLevel + 0.25, 3);
    setZoomLevel(next);
    zoomTo(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(zoomLevel - 0.25, 0.5);
    setZoomLevel(next);
    zoomTo(next);
  };

  const handleDocumentLoad = (e) => {
    setTotalPages(e.doc.numPages);
    setIsPdfLoaded(true);
  };

  const handlePageChange = (e) => {
    setCurrentPage(e.currentPage);
    setPageInput(String(e.currentPage + 1));
  };

  const handlePageInputChange = (e) => setPageInput(e.target.value);

  const handlePageInputKeyPress = (e) => {
    if (e.key === "Enter") {
      const page = parseInt(pageInput, 10);
      if (page >= 1 && page <= totalPages) {
        jumpToPage(page - 1);
      } else {
        setPageInput(String(currentPage + 1));
      }
    }
  };

  const handleDownload = () => {
    if (!pdfData) return;
    const a = document.createElement("a");
    a.href = pdfData;
    a.download = activeItem?.fileName || fileName || "document.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const rawBase64 = activeItem?.base64 || "";
    if (!rawBase64) return;
    const base64 = rawBase64.includes("base64,")
      ? rawBase64.split("base64,")[1]
      : rawBase64;

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url);
    if (win) {
      win.focus();
      win.print();
    }
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleOpenNewTab = () => {
    const rawBase64 = activeItem?.base64 || "";
    if (!rawBase64) return;
    const base64 = rawBase64.includes("base64,")
      ? rawBase64.split("base64,")[1]
      : rawBase64;
    try {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("MultiTabPDFViewerModal: Error opening PDF in new tab", err);
    }
  };

  if (!isOpen) return null;

  const modalNode = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
      onClick={onClose}
    >
      {/* Modal Window — stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "85vw",
          height: "90vh",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "linear-gradient(180deg, #f8fafc, #eef2f7)",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#0f172a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "calc(100% - 60px)",
            }}
          >
            {displayTitle}
          </span>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            title="Close"
            style={{ marginTop: 0, marginRight: 4 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Multi-Tab Strip (shown only when multiple PDFs exist) ─────────── */}
        {normalizedList.length > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              overflowX: "auto",
              flexShrink: 0,
              scrollbarWidth: "thin",
            }}
          >
            <style>{`
              .pdf-modal-tab-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                padding: 5px 16px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease-in-out;
                white-space: nowrap;
                outline: none;
                user-select: none;
                text-decoration: none;
                min-height: 28px;
                border: 1px solid #cbd5e1;
                background-color: #eef2f6;
                color: #1677ff;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
              }
              .pdf-modal-tab-btn:hover {
                background-color: #e2e8f0;
                color: #0958d9;
                border-color: #94a3b8;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
              }
              .pdf-modal-tab-btn.active {
                background: linear-gradient(357deg, rgba(99,55,97,1), rgba(70,35,68,1));
                color: #ffffff;
                border-color: transparent;
                box-shadow: 0 2px 6px rgba(70, 35, 68, 0.35);
              }
              .pdf-modal-tab-btn.active:hover {
                background: linear-gradient(357deg, rgba(110,62,108,1), rgba(78,39,76,1));
                color: #ffffff;
                box-shadow: 0 3px 8px rgba(70, 35, 68, 0.45);
              }
            `}</style>
            {normalizedList.map((item, index) => {
              const isActive = index === activeTabIndex;
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (activeTabIndex !== index) {
                      setActiveTabIndex(index);
                      setIsPdfLoaded(false);
                    }
                  }}
                  type="button"
                  className={`pdf-modal-tab-btn ${isActive ? "active" : ""}`}
                  title={item.label}
                >
                  <span
                    style={{
                      maxWidth: "260px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── PDF Content Area ─────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "#525659",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Loading Spinner */}
          {!isPdfLoaded && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 200,
                backgroundColor: "#525659",
              }}
            >
              <Box
                sx={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid rgba(255,255,255,0.2)",
                  borderTop: "4px solid #ffffff",
                  borderRadius: "50%",
                  animation: "pdf-spin 1s linear infinite",
                  "@keyframes pdf-spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 500,
                  fontSize: "15px",
                  mt: 2,
                }}
              >
                Preparing PDF Document...
              </Typography>
            </Box>
          )}

          {/* PDF Viewer */}
          {pdfData ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                padding: "10px",
                overflow: "hidden",
                opacity: isPdfLoaded ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            >
              <div
                className="pdf-modal-scroll-container"
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#fff",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                  borderRadius: "4px",
                  overflow: "auto",
                  position: "relative",
                }}
              >
                <style>{`
                  .pdf-modal-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #888 #525659;
                  }
                  .pdf-modal-scroll-container::-webkit-scrollbar { width: 8px; height: 8px; }
                  .pdf-modal-scroll-container::-webkit-scrollbar-track { background: #3e4044; }
                  .pdf-modal-scroll-container::-webkit-scrollbar-thumb { 
                    background: #888; 
                    border-radius: 8px; 
                    border: 2px solid #525659;
                  }
                  .pdf-modal-scroll-container::-webkit-scrollbar-thumb:hover { background: #bbb; }
                `}</style>
                <Worker workerUrl={workerSrc}>
                  <Viewer
                    fileUrl={pdfData}
                    plugins={[zoomPluginInstance, pageNavigationPluginInstance]}
                    onDocumentLoad={handleDocumentLoad}
                    onPageChange={handlePageChange}
                    defaultScale={1.5}
                  />
                </Worker>
              </div>
            </div>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                No PDF data provided
              </span>
            </Box>
          )}

          {/* ── Floating Toolbar ─────────────────────────────────────────── */}
          {isPdfLoaded && (
            <Box
              sx={{
                position: "absolute",
                bottom: 28,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                backgroundColor: "rgba(32, 33, 36, 0.85)",
                backdropFilter: "blur(16px) saturate(180%)",
                borderRadius: "40px",
                padding: "8px 20px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
                zIndex: 100,
                border: "1px solid rgba(255,255,255,0.12)",
                transition:
                  "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
                "&:hover": { transform: "translateX(-50%) scale(1.03)" },
              }}
            >
              {/* Page Navigation */}
              {totalPages > 0 && (
                <>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Page
                    </Typography>
                    <TextField
                      value={pageInput}
                      onChange={handlePageInputChange}
                      onKeyPress={handlePageInputKeyPress}
                      variant="standard"
                      sx={{
                        width: "36px",
                        "& .MuiInput-root": {
                          color: "#fff",
                          fontSize: "14px",
                          fontWeight: 600,
                          "&:before, &:after": { display: "none" },
                        },
                        "& input": { textAlign: "center", padding: 0 },
                      }}
                    />
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}
                    >
                      / {totalPages}
                    </Typography>
                  </Box>
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ bgcolor: "rgba(255,255,255,0.22)", mx: 1 }}
                  />
                </>
              )}

              {/* Zoom Controls */}
              <Box display="flex" alignItems="center" gap={0.5}>
                <IconButton
                  title="Zoom Out"
                  onClick={handleZoomOut}
                  size="small"
                  disabled={zoomLevel <= 0.5}
                  sx={{
                    color: "#fff",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                    "&.Mui-disabled": { opacity: 0.3 },
                  }}
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>

                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    minWidth: "44px",
                    textAlign: "center",
                  }}
                >
                  {Math.round(zoomLevel * 100)}%
                </Typography>

                <IconButton
                  title="Zoom In"
                  onClick={handleZoomIn}
                  size="small"
                  disabled={zoomLevel >= 3}
                  sx={{
                    color: "#fff",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                    "&.Mui-disabled": { opacity: 0.3 },
                  }}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Box>

              {!hideActions && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: "rgba(255,255,255,0.22)", mx: 1 }}
                />
              )}

              {/* Action Buttons */}
              {!hideActions && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <IconButton
                    title="Download"
                    onClick={handleDownload}
                    size="small"
                    sx={{
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                    }}
                  >
                    <GetAppIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    title="Print"
                    onClick={handlePrint}
                    size="small"
                    sx={{
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                    }}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    title="Open in New Tab"
                    onClick={handleOpenNewTab}
                    size="small"
                    sx={{
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                    }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

export default MultiTabPDFViewerModal;

