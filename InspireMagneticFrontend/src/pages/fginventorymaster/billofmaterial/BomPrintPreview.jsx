// ===================== Imports =====================
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DraggableModal from "../../../components/DraggableModal";
import { Print as PrintIcon } from '@mui/icons-material';
import axios from "axios";
import "./BomPrintPreview.css";
import bomPrintStyles from "./BomPrintPreview.css?inline";
import Loader from "../../../components/Loader";
import { formatDateTimeWithSeconds, formatDate } from "../../../utils/dateUtils";
import html2pdf from "html2pdf.js";
import CopyButton from "../../../components/CopyButton";
import { SUCCESS_STATUS } from "../../../utils/ConstVariables";


// ===================== Helper Functions =====================
const buildInitialExpansionState = (data) => {
  const next = { main: true };
  data.options?.forEach((option) => {
    next[`option-${option.key}`] = true;
    option.sections?.forEach((section) => {
      next[`section-${option.key}-${section.key}`] = true;
    });
  });
  return next;
};

const IconChip = ({ label, variant, onClick, title }) => (
  <button
    type="button"
    className={`btn btn-outline-secondary btn-sm icon icon-${variant}`}
    title={title || `${label} icon`}
    onClick={onClick}
    style={{ marginRight: '5px', width: '20px', height: '20px' }}
  >
    {label}
  </button>
);

const PendingCells = ({ pending }) => {
  const keys = ["oa", "purchase", "production", "grn"];
  return keys.map((key) => (
    <td key={key} className="pending-col">
      {pending?.[key] ?? " "}
    </td>
  ));
};

const formatQty = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  return Number.isNaN(num) ? value : num.toFixed(6);
};

function getFirstItemFromOptions(optionGroups) {
  if (!optionGroups || !Array.isArray(optionGroups)) return null;
  for (const optionObj of optionGroups) {
    const sections = Object.values(optionObj)[0];
    if (!sections) continue;
    for (const section of sections) {
      if (Array.isArray(section?.items) && section.items.length > 0) {
        return section.items[0];
      }
    }
  }
  return null;
}

function extractOptionLockRemark(sectionsArray) {
  if (!Array.isArray(sectionsArray)) return null;
  for (const section of sectionsArray) {
    const found = section.items?.find(
      (item) =>
        typeof item?.option_lock_remarks === "string" &&
        item.option_lock_remarks.trim()
    );
    if (found) return found.option_lock_remarks.trim();
  }
  return null;
}

function mapOptions(options, statusLabel, typeTag) {
  if (!options || !Array.isArray(options)) return [];
  return options.flatMap((optionObj) =>
    Object.entries(optionObj).map(([optionKey, sectionsArray]) => ({
      key: optionKey.toLowerCase().replace("option_", "option-"),
      label: `Option : ${optionKey.replace("Option_", "")}`,
      type: typeTag,
      totalItems: sectionsArray.reduce((sum, section) => sum + (section.items?.length || 0), 0),
      statusRemarks: typeTag === "locked" ? extractOptionLockRemark(sectionsArray) : null,
      sections: sectionsArray.map((section) => ({
        key: section.item_type_text?.toLowerCase().replace(/\s+/g, "-"),
        label: section.item_type_text,
        totalItems: section.items?.length || 0,
        rows: (section.items || []).map((row) => ({
          code: row.item_code_child,
          description: row.item_description_child,
          dwgStatus: row.dwg_status_child,
          qty: formatQty(row.qty),
          stock: row.current_stock_child,
          reserved: row.qty_res_child,
          unit: row.unit_child,
          remark: row.remarks ?? row.rate_remarks ?? "",
          pending: {
            oa: row.oa_pending ?? null,
            purchase: row.p_qty_child,
            production: row.pro_qty_child,
            grn: row.grn_qty_child,
          },
        })),
      })),
    }))
  );
}

function getCurrentOptions({ validOptions, lockedOptions }, showAllOptionNames) {
  if (showAllOptionNames) {
    return [...(validOptions || []), ...(lockedOptions || [])];
  }
  if (validOptions?.length) return validOptions;
  if (lockedOptions?.length) return lockedOptions;
  return [];
}

// ===================== API Functions =====================
const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

const getBomList = async (itemCode) => {
  const token = localStorage.getItem('accessToken');
  const res = await axios.post(`${baseUrl}/api/Master/GetAllBOMList`, {
    itemCode,
    paramType: 'GetAllBOMMasterList',
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

async function checkDrawingExists(drawingMappedItemCode, itemCode, drawingStatusChild) {
  const token = localStorage.getItem('accessToken');
  const res = await axios.post(
    `${baseUrl}/api/Master/ViewBOMDrawingFiles`,
    {
      drawingMappedItemCode: drawingMappedItemCode,
      itemCode: itemCode,
      drawingStatusChild: drawingStatusChild || 'NA',
      fileName: ''
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
}

function mapApiToBomData(api) {
  if (!api) return [];
  const validOptions = mapOptions(api.VALID_OPTIONS, 'Valid', 'valid');
  const lockedOptions = mapOptions(api.LOCKED_OPTIONS, 'Locked', 'locked');
  const firstItem =
    getFirstItemFromOptions(api.VALID_OPTIONS) ||
    getFirstItemFromOptions(api.LOCKED_OPTIONS);
  return {
    finishedProduct: {
      code: api.item_code,
      name: api.item_description,
      dwgStatus: api.dwg_status,
      qty: "-", // Adapt if you have this field
      stock: api.current_stock,
      reserved: api.qty_res,
      unit: api.unit,
      remark: "", // Adapt if you want remarks
      pending: {
        oa: api.oa_pending,
        purchase: api.p_qty,
        production: api.pro_qty,
        grn: api.grn_qty,
      },
      meta: {
        status:
          (typeof api.doc_status_text === "string" && api.doc_status_text.trim()) ?
            api.doc_status_text.trim() :
            (api.doc_status ?? "-"),
        approvedBy: firstItem?.app_by ?? api.app_by ?? "-",
        approvedDate:
          formatDateTimeWithSeconds(firstItem?.app_date) ||
          formatDateTimeWithSeconds(api.app_date) ||
          "-",
        preparedBy: firstItem?.prep_by ?? api.prep_by ?? "-",
        preparedDate:
          formatDate(firstItem?.prep_date) ||
          formatDate(api.prep_date) ||
          "-",
        revisedBy: firstItem?.rev_by ?? api.rev_by ?? "-",
        revisedDate:
          formatDate(firstItem?.rev_date) ||
          formatDate(api.rev_date) ||
          "-",
        revision: firstItem?.revision ?? api.revision ?? "-",
      },
    },
    validOptions,
    lockedOptions,
  };
}

// ===================== Main Component =====================
const BomPrintPreview = ({
  open,
  onClose,
  itemCode = "COTTONSWAB",
  modalTitle = "Bill Of Material",
}) => {
  // ----------------- State and Refs -----------------
  const contentRef = useRef(null);
  const [bomData, setBomData] = useState({
    finishedProduct: [],
    validOptions: [],
    lockedOptions: [],
  });
  // console.log(itemCode);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(() => buildInitialExpansionState([]));
  const [showPendingInfo, setShowPendingInfo] = useState(false);
  const [showAllOptionNames, setShowAllOptionNames] = useState(false);
  const [, setSupplierModalOpen] = useState(false);
  const [, setSupplierPartCode] = useState(null);
  const [, setSupplierDescription] = useState("");
  const [, setDrawingModalOpen] = useState(false);
  const [, setDrawingItemCode] = useState(null);
  const [, setDrawingMappedItemCode] = useState(null);
  const [checkingDrawing, setCheckingDrawing] = useState(false);
  const [, setMailModalOpen] = useState(false);
  const [, setMailInitialData] = useState({
    to: "",
    cc: "",
    subject: "",
    message: "",
  });
  const [mailModalLoading, setMailModalLoading] = useState(false);

  // ----------------- Derived/Memoized -----------------
  const footerMeta = useMemo(() => bomData.finishedProduct?.meta ?? {}, [bomData.finishedProduct?.meta]);
  const footerPrintText = useMemo(() => {
    const preparedBy = footerMeta.preparedBy ?? footerMeta.approvedBy ?? "-";
    const preparedDate = footerMeta.preparedDate ?? footerMeta.approvedDate ?? "-";
    const revisedBy = footerMeta.revisedBy ?? "-";
    const revisedDate = footerMeta.revisedDate ?? "-";
    const revision = footerMeta.revision ?? "-";
    return `Prep. By : ${preparedBy} , Date : ${preparedDate}\nRevised By : ${revisedBy} , Date : ${revisedDate}, Rev : ${revision}`;
  }, [
    footerMeta.preparedBy, footerMeta.approvedBy, footerMeta.preparedDate,
    footerMeta.approvedDate, footerMeta.revisedBy, footerMeta.revisedDate, footerMeta.revision,
  ]);

  // ----------------- Handlers/Callbacks -----------------
  const getSubjectDate = useCallback(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const defaultMailRecipients = useMemo(() => ({
    to: [
      "ppcgroup@protecotron.in",
      "sanjayvp@protecotron.in",
      "ppc-asst@protecotron.in"
    ],
    cc: [
      "design@protecotron.in",
      "engg@protecotron.in"
    ]
  }), []);

  const handleOpenMailModal = useCallback(async () => {
    setMailModalLoading(true);
    const finishedCode = bomData.finishedProduct?.code || itemCode || "";
    const subjectDate = getSubjectDate();
    const subject = `BOM created/modified for the item ${finishedCode || "N/A"} Dt: ${subjectDate}`;
    const preparedBy = footerMeta.preparedBy && footerMeta.preparedBy !== "-" ? footerMeta.preparedBy : "Test Name";
    const message = `Dear Sir / Madam,\n\nBOM for the item ${finishedCode || "N/A"} has created/modified.\n\nPlease find the attachment for details.\n\nRegards,\n${preparedBy}`;
    let pdfFile = null;
    try {
      const printElement = contentRef.current?.cloneNode(true);
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.width = "1800px";
      printElement.style.overflow = "visible";
      printElement.style.width = "1700px";
      printElement.style.minWidth = "1200px";
      printElement.querySelectorAll('table').forEach(table => {
        table.style.width = '100%';
        table.style.minWidth = '1200px';
        table.style.overflow = 'visible';
      });
      printElement.querySelectorAll('.toggle-btn, .icon, button').forEach(el => {
        el.style.display = 'none';
      });
      const pdfWhiteStyle = document.createElement('style');
      pdfWhiteStyle.textContent = `
        .bom-print-preview th,
        .bom-print-preview .option-header,
        .bom-print-preview .main-product-row,
        .bom-print-preview .sub-header {
          background: #fff !important;
          background-color: #fff !important;
          border-color: #9ca3af !important;
          color: #222 !important;
        }
      `;
      printElement.prepend(pdfWhiteStyle);
      const style = document.createElement('style');
      style.textContent = bomPrintStyles;
      printElement.prepend(style);
      container.appendChild(printElement);
      document.body.appendChild(container);
      const opt = {
        margin: 0.28,
        filename: `BOM_${finishedCode || 'N_A'}_${subjectDate.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#fff',
          width: 1700,
          scrollX: 0, scrollY: 0
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      const worker = html2pdf().set(opt).from(printElement).toPdf();
      const pdfBlob = await worker.get('pdf').then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const footerLines = (footerPrintText || '').split('\n');
        pdf.setFontSize(8);
        for (let i = 1; i <= totalPages; i += 1) {
          pdf.setPage(i);
          const startY = pageHeight - 0.45;
          footerLines.forEach((line, idx) => {
            if (!line) return;
            pdf.text(line, 0.4, startY + idx * 0.14);
          });
        }
        pdf.setFontSize(9);
        for (let i = 1; i <= totalPages; i += 1) {
          pdf.setPage(i);
          pdf.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 0.25,
            { align: 'center' }
          );
        }
        return pdf.output('blob');
      });
      pdfFile = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
      document.body.removeChild(container);
    } catch {
      pdfFile = null;
      if (window && window.showToast) window.showToast('Failed to generate PDF for mail', 'error');
      else window?.alert?.('Failed to generate PDF for mail');
      setMailModalOpen(true); // <= always open modal if error
      setMailModalLoading(false);
      // The rest will not run on error
      setMailInitialData({
        to: defaultMailRecipients.to.join(", "),
        cc: defaultMailRecipients.cc.join(", "),
        subject,
        message,
        attachments: [],
      });
      return;
    } finally {
      setMailModalLoading(false);
    }
    setMailInitialData({
      to: defaultMailRecipients.to.join(", "),
      cc: defaultMailRecipients.cc.join(", "),
      subject,
      message,
      attachments: pdfFile ? [pdfFile] : [],
    });
    setMailModalOpen(true);
  }, [bomData.finishedProduct?.code, footerMeta, footerPrintText, getSubjectDate, itemCode, defaultMailRecipients]);

  // Group & drawing handlers
  const toggleGroup = useCallback((key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleViewDrawing = useCallback(async (row) => {
    const mappedItemCode = row.code;
    const finishedProductCode = bomData.finishedProduct?.code || itemCode;
    const dwgStatus = row.dwgStatus || 'NA';
    try {
      setCheckingDrawing(true);
      setLoading(true);
      const response = await checkDrawingExists(mappedItemCode, finishedProductCode, dwgStatus);
      if (response.Status === 'Error') {
        const errorMessage = response?.data?.VIEW_BOM_DRAWING_FILE_RESPONSE?.[0]?.Message || 'Files Not Found !!!';
        if (window.showToast) window.showToast(errorMessage, 'error');
        return;
      }
      if (response.Status === 'Success' && response?.data?.VIEW_BOM_DRAWING_FILE_RESPONSE?.[0]?.Base64) {
        setDrawingMappedItemCode(mappedItemCode);
        setDrawingItemCode(finishedProductCode);
        setDrawingModalOpen(true);
      } else {
        const errorMessage = 'No drawing file found';
        if (window.showToast) window.showToast(errorMessage, 'error');
      }
    } catch (err) {
      console.error('Error checking drawing:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to check drawing';
      if (window.showToast) window.showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setCheckingDrawing(false);
    }
  }, [bomData.finishedProduct?.code, itemCode]);

  const handleRefreshStock = useCallback(() => {
    if (!itemCode) return;
    setLoading(true);
    setError(null);
    getBomList(itemCode)
      .then((raw) => {
        if (raw.Status !== SUCCESS_STATUS || !raw.data || !raw.data.BOM_LIST_RESPONSE || !raw.data.BOM_LIST_RESPONSE[0]) {
          throw new Error(raw.message || "Invalid BOM response");
        }
        const mapped = mapApiToBomData(raw.data.BOM_LIST_RESPONSE[0]);
        setBomData(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError((err && err.message) || 'API Error');
        setBomData({ finishedProduct: [], validOptions: [], lockedOptions: [] });
        setLoading(false);
      });
  }, [itemCode]);

  const handlePrint = useCallback(() => {
    if (!contentRef.current || typeof document === "undefined") return;
    const printableContent = contentRef.current.outerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      window.alert("Unable to access print preview.");
      return;
    }
    const escapeForCssContent = (value) =>
      (value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\A ");
    const footerLeftContent = escapeForCssContent(footerPrintText);
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${modalTitle}</title>
          <style>
            ${bomPrintStyles}
            body { margin: 0; padding: 0; background: #fff; font-family: Arial, sans-serif; }
            @page {
              margin: 10mm;
              counter-increment: page;
              @bottom-left { content: "${footerLeftContent}"; font-size: 9px; white-space: pre; }
              @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 10px; font-weight: bold; }
            }
          </style>
        </head>
        <body>
          ${printableContent}
        </body>
      </html>
    `);
    iframeDoc.close();
    const triggerPrint = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => { iframe.remove(); }, 500);
    };
    if (iframe.contentWindow?.document?.readyState === "complete") {
      setTimeout(triggerPrint, 250);
    } else {
      iframe.onload = triggerPrint;
    }
  }, [modalTitle, footerPrintText]);

  // ----------------- Effects -----------------
  useEffect(() => {
    if (!open || !itemCode) return;
    let alive = true;
    setLoading(true);
    setError(null);
    getBomList(itemCode)
      .then((raw) => {
        if (!alive) return;
        if (raw.Status !== SUCCESS_STATUS || !raw.data || !raw.data.BOM_LIST_RESPONSE || !raw.data.BOM_LIST_RESPONSE[0]) {
          throw new Error(raw.message || "Invalid BOM response");
        }
        const mapped = mapApiToBomData(raw.data.BOM_LIST_RESPONSE[0]);
        setBomData(mapped);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError((err && err.message) || 'API Error');
        setBomData({ finishedProduct: [], validOptions: [], lockedOptions: [] });
        setLoading(false);
      });
    return () => { alive = false };
  }, [itemCode, open]);

  useEffect(() => {
    if (!open) return;
    setExpandedGroups(
      buildInitialExpansionState({
        options: getCurrentOptions(bomData, showAllOptionNames),
      })
    );
  }, [bomData, open, showAllOptionNames]);

  // Instead, reset toggles ONLY when modal is freshly opened:
  useEffect(() => {
    if (open) {
      setShowPendingInfo(false);
      setShowAllOptionNames(false);
    }
  }, [open]);

  // ----------------- Option Headers Memo -----------------
  const optionHeaders = useMemo(() => {
    if (showAllOptionNames) {
      return [...(bomData.validOptions ?? []), ...(bomData.lockedOptions ?? [])];
    }
    if (bomData.validOptions?.length) return bomData.validOptions;
    if (bomData.lockedOptions?.length) return bomData.lockedOptions;
    return [];
  }, [bomData.validOptions, bomData.lockedOptions, showAllOptionNames]);

  // ----------------- Render -----------------
  return (
    <>
      <DraggableModal
        open={open}
        onClose={onClose}
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {modalTitle}
          <button
            className="btn btn-sm"
            type="button"
            title="Print"
            onClick={handlePrint}
            style={{ background: '#fff', color: 'rgb(22,119,255)', borderRadius: 8, width: 33, height: 33, padding: 0, marginLeft: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none', border: '1px solid rgb(208, 215, 222)' }}
          >
            <PrintIcon />
          </button>
        </span>}
        width={"90%"}
        height={"90%"}
        maxWidth={"100%"}
        maxHeight={"100%"}
        left="5%"
        top="5%"
        resizable
        headerActions={
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginRight: '10px' }}>
              <button className="btn btn-sm" title='Refresh Stock' onClick={handleRefreshStock} style={{ backgroundColor: 'rgb(122, 75, 120)', color: 'white' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style={{ marginRight: 6 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>Refresh Stock
              </button>
              <button className="btn btn-sm" title='EMail' onClick={handleOpenMailModal} disabled={mailModalLoading} style={{ backgroundColor: 'rgb(122, 75, 120)', color: 'white' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style={{ marginRight: 6 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>EMail
              </button>
              <button className="btn btn-sm" title={showAllOptionNames ? "Show Valid Option" : "Show All Option Names"} onClick={() => setShowAllOptionNames(!showAllOptionNames)} style={{ backgroundColor: 'rgb(122, 75, 120)', color: 'white' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-circle-dashed-check"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8.56 3.69a9 9 0 0 0 -2.92 1.95" /><path d="M3.69 8.56a9 9 0 0 0 -.69 3.44" /><path d="M3.69 15.44a9 9 0 0 0 1.95 2.92" /><path d="M8.56 20.31a9 9 0 0 0 3.44 .69" /><path d="M15.44 20.31a9 9 0 0 0 2.92 -1.95" /><path d="M20.31 15.44a9 9 0 0 0 .69 -3.44" /><path d="M20.31 8.56a9 9 0 0 0 -1.95 -2.92" /><path d="M15.44 3.69a9 9 0 0 0 -3.44 -.69" /><path d="M9 12l2 2l4 -4" /></svg>
                {showAllOptionNames ? "Valid Options" : "All Options"}
              </button>
              <button className="btn btn-sm" title="Pending Info" onClick={() => { if (!showPendingInfo) setShowPendingInfo(true); }} disabled={showPendingInfo} style={{ backgroundColor: 'rgb(122, 75, 120)', color: 'white' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-info-circle"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>
                Pending Info
              </button>
            </div>
          </>
        }
        allowMinimize={false}
        maskClosable={false}
      >
        <div className="bom-print-preview" ref={contentRef}>
          {loading && (<Loader />)}
          <div className="bom-container">
            <div className="header">
              <div className="header-left">
                ( Qty / Assembly Information is for 1.0000 Nos. of{" "}
                {bomData.finishedProduct?.code ?? "-"} )
              </div>
              <div className="header-center">
                <h1>Bill Of Material</h1>
              </div>
              <div className="header-right">
                <div className="header-meta">
                  <div>Status : {bomData.finishedProduct?.meta?.status ?? "-"}</div>
                  <div>App By : {bomData.finishedProduct?.meta?.approvedBy ?? "-"}</div>
                  <div>
                    App Date : {bomData.finishedProduct?.meta?.approvedDate ?? "-"}
                  </div>
                </div>
              </div>
            </div>
            <div className="content">
              <div className="table-wrapper">
                <table>
                  <colgroup>
                    <col className="col-finished" />
                    <col className="col-dwg" />
                    <col className="col-qty" />
                    <col className="col-stock" />
                    <col className="col-reserved" />
                    <col className="col-unit" />
                    <col className="col-remark" />
                    <col className="col-oa" />
                    <col className="col-purchase" />
                    <col className="col-production" />
                    <col className="col-grn" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th rowSpan={2} className="pending-header" style={{ width: '30%' }}>
                        Finished Product
                      </th>
                      <th rowSpan={2}>Dwg. Status</th>
                      <th rowSpan={2} style={{ width: '100px' }}>Qty/Assembly</th>
                      <th rowSpan={2}>Current Stock</th>
                      <th rowSpan={2}>Reserved</th>
                      <th rowSpan={2}>Unit</th>
                      <th rowSpan={2}></th>
                      <th colSpan={4} className="pending-header">
                        Pending
                      </th>
                    </tr>
                    <tr>
                      <th className="pending-sub-header">O.A.</th>
                      <th className="pending-sub-header">Purchase</th>
                      <th className="pending-sub-header">Production</th>
                      <th className="pending-sub-header">GRN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="main-product-row">
                      <td className="subpart-col">
                        {bomData.finishedProduct?.code}
                        <div className="subpart-indent subpart-toggle">
                          <button
                            type="button"
                            className="toggle-btn"
                            onClick={() => toggleGroup("main")}
                            aria-expanded={expandedGroups.main}
                            aria-label={`${expandedGroups.main ? "Collapse" : "Expand"
                              } ${bomData.finishedProduct?.name} items`}
                          >
                            {expandedGroups.main ? "-" : "+"}
                          </button>
                          <span>{bomData.finishedProduct?.name}</span>
                        </div>
                      </td>
                      <td className="dwg-status-col">
                        {bomData.finishedProduct?.dwgStatus}
                      </td>
                      <td className="qty-col">{bomData.finishedProduct?.qty}</td>
                      <td className="stock-col">
                        {bomData.finishedProduct?.stock}
                      </td>
                      <td className="reserved-col">
                        {bomData.finishedProduct?.reserved}
                      </td>
                      <td className="unit-col">
                        {bomData.finishedProduct?.unit}
                      </td>
                      <td className="pending-col">
                        {bomData.finishedProduct?.remark ??
                          bomData.finishedProduct?.remarks ??
                          ""}
                      </td>
                      {showPendingInfo ? (
                        <PendingCells pending={bomData.finishedProduct?.pending} />
                      ) : (
                        <>
                          <td className="pending-col"></td>
                          <td className="pending-col"></td>
                          <td className="pending-col"></td>
                          <td className="pending-col"></td>
                        </>
                      )}
                    </tr>

                    {expandedGroups.main &&
                      optionHeaders.map((option) => {
                        const optionKey = `option-${option.key}`;
                        const optionExpanded = expandedGroups[optionKey];
                        return (
                          <React.Fragment key={option.key}>
                            <tr className="option-header">
                              <td colSpan={11}>
                                <div className="subpart-toggle">
                                  <button
                                    type="button"
                                    className="toggle-btn"
                                    onClick={() => toggleGroup(optionKey)}
                                    aria-expanded={optionExpanded}
                                    aria-label={`${optionExpanded ? "Collapse" : "Expand"
                                      } ${option.label} items`}
                                  >
                                    {optionExpanded ? "-" : "+"}
                                  </button>
                                  <span style={{ color: "#fd538cff" }} >
                                    {option.label} &nbsp;&nbsp;&nbsp; Total Items
                                    : {option.totalItems}
                                  </span>
                                  {option.type === "locked" && (
                                    <span
                                      className="option-status-tag"
                                      style={{ color: "red", fontSize: "12px", fontWeight: "bold" }}
                                    >
                                      Locked
                                      {option.statusRemarks ? ` : ${option.statusRemarks}` : ""}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {optionExpanded &&
                              option.sections?.map((section) => {
                                const sectionKey = `section-${option.key}-${section.key}`;
                                const sectionExpanded =
                                  expandedGroups[sectionKey];
                                return (
                                  <React.Fragment key={section.key}>
                                    <tr className="sub-header">
                                      <td colSpan={11}>
                                        <div className="subpart-toggle">
                                          <button
                                            type="button"
                                            className="toggle-btn"
                                            onClick={() =>
                                              toggleGroup(sectionKey)
                                            }
                                            aria-expanded={sectionExpanded}
                                            aria-label={`${sectionExpanded
                                              ? "Collapse"
                                              : "Expand"
                                              } ${section.label} rows`}
                                          >
                                            {sectionExpanded ? "-" : "+"}
                                          </button>
                                          <span style={{ color: "#0025ff" }} >
                                            {section.label} &nbsp;&nbsp;&nbsp;
                                            Total Items : {section.totalItems}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                    {sectionExpanded &&
                                      section.rows?.map((row) => (
                                        <tr
                                          key={`${option.key}-${section.key}-${row.code}`}
                                          className="part-row"
                                        >
                                          <td className="subpart-col">
                                            <IconChip
                                              label="?"
                                              title="view vendor details"
                                              variant="question"
                                              style={{ border: '1px solid #9ca3af' }}
                                              onClick={() => {
                                                setSupplierPartCode(row.code);
                                                setSupplierDescription(row.description || "");
                                                setSupplierModalOpen(true);
                                              }}
                                            />
                                            {row.code}
                                            <br />
                                            <div className="subpart-indent">
                                              <CopyButton
                                                text={[row.code]}
                                                tooltip="Copy product"
                                                size="sm"

                                                style={{ backgroundColor: "#00738057", margin: '2px' }}
                                              />
                                              {row.description}
                                            </div>
                                          </td>
                                          <td className="dwg-status-col">
                                            {row.dwgStatus}
                                          </td>
                                          <td className="qty-col">
                                            <IconChip
                                              label="D"
                                              variant="d"
                                              title="View Drawing"
                                              onClick={() => handleViewDrawing(row)}
                                              disabled={checkingDrawing}
                                            />
                                            {row.qty}
                                          </td>
                                          <td className="stock-col">
                                            {row.stock}
                                          </td>
                                          <td className="reserved-col">
                                            {row.reserved}
                                          </td>
                                          <td className="unit-col">{row.unit}</td>
                                          <td className="pending-col">
                                            {row.remark ?? row.remarks ?? ""}
                                          </td>
                                          {showPendingInfo ? (
                                            <PendingCells pending={row.pending} />
                                          ) : (
                                            <>
                                              <td className="pending-col"></td>
                                              <td className="pending-col"></td>
                                              <td className="pending-col"></td>
                                              <td className="pending-col"></td>
                                            </>
                                          )}
                                        </tr>
                                      ))}
                                  </React.Fragment>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DraggableModal>

    </>
  );
};

export default BomPrintPreview;
