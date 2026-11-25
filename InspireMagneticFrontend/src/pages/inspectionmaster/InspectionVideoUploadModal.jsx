import React, { useState, useRef, useCallback, useEffect } from "react";
import DraggableModal from "../../components/DraggableModal";
import { uploadInspectionVideoFiles, viewOrDeleteInspectionVideoFiles } from "../../services/inspectionMasterService";
import { useToast } from "../../components/useToast";
import { SUCCESS_STATUS, MESSAGE_OK, ERROR_STATUS } from "../../utils/ConstVariables";
import { formatFileSize } from "../../utils/fileUtils";
import Loader from "../../components/Loader";
import { DeleteConfirmDialog } from "../../components/Notification";
import { baseUrl } from "../../utils/url";

const ACCEPTED_VIDEO_TYPES = "video/mp4,video/webm,.mp4,.webm";
const MAX_VIDEO_SIZE_MB = 10; // 10 MB max for video files
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const InspectionVideoUploadModal = ({ open, onClose, inspectionRow, itemCode, onUploadSuccess, onDeleteSuccess, readOnly }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const draggableModalRef = useRef(null);

  const [existingVideo, setExistingVideo] = useState(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showToast } = useToast();

  // ── Helpers ──────────────────────────────────────────────────────────────

  const loadExistingVideo = useCallback(async (isMounted = true) => {
    if (!open || !inspectionRow) return;
    setIsLoadingExisting(true);
    setUploadError("");
    try {
      const response = await viewOrDeleteInspectionVideoFiles({
        inspectionID: Number(inspectionRow?.inspectionID || inspectionRow?.inspection_id || 0),
        itemCode: itemCode || "",
        fileName: "",
        paramType: "View",
      });

      if (isMounted) {
        if (response?.Status === SUCCESS_STATUS) {
          const filesList = response?.data?.VIEW_INSPECTION_VIDEO_FILE_RESPONSE || [];
          const validFile = filesList.find((file) => file && file.FileURL && !file.Message);

          if (validFile) {
            setExistingVideo(validFile);
            setPreviewUrl(validFile.FileURL);
          } else {
            setExistingVideo(null);
            setPreviewUrl(null);
          }
        } else {
          setExistingVideo(null);
          setPreviewUrl(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch existing video:", err);
    } finally {
      if (isMounted) {
        setIsLoadingExisting(false);
      }
    }
  }, [open, inspectionRow, itemCode]);

  useEffect(() => {
    let isMounted = true;
    if (open && inspectionRow) {
      loadExistingVideo(isMounted);
    } else {
      setExistingVideo(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadError("");
      setUploadProgress(0);
    }
    return () => {
      isMounted = false;
    };
  }, [open, inspectionRow, itemCode, loadExistingVideo]);

  const handleDeleteExisting = async () => {
    if (!existingVideo) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const response = await viewOrDeleteInspectionVideoFiles({
        inspectionID: Number(inspectionRow?.inspectionID || inspectionRow?.inspection_id || 0),
        itemCode: itemCode || "",
        fileName: existingVideo.FileName,
        paramType: "Delete",
      });

      if (response?.Status === SUCCESS_STATUS || response?.message === MESSAGE_OK) {
        setExistingVideo(null);
        setPreviewUrl(null);
        if (showToast) {
          showToast("Video Deleted Successfully!", SUCCESS_STATUS.toLowerCase());
        }
        if (typeof onDeleteSuccess === "function") {
          onDeleteSuccess(response, inspectionRow);
        }
      } else {
        const errorMsg = response?.message || "Failed to delete video.";
        setUploadError(errorMsg);
      }
    } catch (err) {
      console.error("Failed to delete video:", err);
      const errorMsg = err?.message || "Failed to delete video.";
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const isValidVideoFile = (file) => {
    if (!file) return false;
    const validTypes = ["video/mp4", "video/webm"];
    const validExtensions = [".mp4", ".webm"];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    return hasValidType || hasValidExtension;
  };

  const processFile = useCallback((file) => {
    if (!file) return;

    setUploadError("");

    if (!isValidVideoFile(file)) {
      setUploadError("Only MP4 and WebM video formats are supported.");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setUploadError(`File size exceeds the ${MAX_VIDEO_SIZE_MB} MB limit. Please choose a smaller video.`);
      return;
    }

    // Revoke any previous preview to avoid memory leaks
    if (previewUrl && !existingVideo) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(newPreviewUrl);
    setUploadProgress(0);
  }, [previewUrl, existingVideo]);

  // ── File Input Handler ────────────────────────────────────────────────────

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  };

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // ── Clear Selection ──────────────────────────────────────────────────────

  const handleClearSelection = () => {
    if (previewUrl && !existingVideo) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(existingVideo ? existingVideo.FileURL : null);
    setUploadError("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAction = () => {
    if (selectedFile) {
      handleClearSelection();
    } else if (existingVideo) {
      setShowDeleteConfirm(true);
    }
  };

  // ── Upload Handler (stub — API endpoint will be wired later) ─────────────

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a video file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const response = await uploadInspectionVideoFiles(
        {
          inspectionID: Number(inspectionRow?.inspectionID || inspectionRow?.inspection_id || 0),
          itemCode: itemCode || "",
          file: selectedFile,
        },
        (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      );

      if (response?.Status === SUCCESS_STATUS || response?.message === MESSAGE_OK) {
        if (typeof onUploadSuccess === "function") {
          onUploadSuccess(response, selectedFile, inspectionRow);
        }
        if (showToast) {
          showToast("Video Uploaded Successfully!", SUCCESS_STATUS.toLowerCase());
        }

        const uploadDetails = response?.data?.UPLOADED_RESPONSE?.[0];
        const fileName = uploadDetails?.FileName || selectedFile.name;

        // Construct the file URL directly using the base URL
        const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        const fileUrl = `${cleanBaseUrl}/InspectionVideos/${encodeURIComponent(itemCode)}/${Number(inspectionRow?.inspectionID || inspectionRow?.inspection_id || 0)}/${fileName}`;

        // Format current timestamp to match DD/MM/YYYY HH:MM:SS format
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const newVideo = {
          FileName: fileName,
          ReceivedDate: formattedDate,
          ContentType: selectedFile.type || "video/mp4",
          FileURL: fileUrl,
        };

        handleClearSelection();
        setUploadProgress(0);

        setExistingVideo(newVideo);
        setPreviewUrl(fileUrl);
      } else {
        const errorMsg =
          response?.data?.UPLOADED_RESPONSE?.[0]?.Message ||
          response?.message ||
          "Failed to upload video. Please try again.";
        setUploadError(errorMsg);
      }
    } catch (err) {
      console.error("Video upload error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload video. Please try again.";
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Close Handler ────────────────────────────────────────────────────────

  const handleClose = () => {
    // Clean up preview URL on close
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError("");
    setUploadProgress(0);
    setIsUploading(false);
    onClose && onClose();
  };

  // ── Derive display info from row ─────────────────────────────────────────

  const rowLabel = [
    itemCode || "",
    inspectionRow?.category || "",
    inspectionRow?.characteristicName || ""
  ].filter(Boolean).join(" - ");

  // ── Render ───────────────────────────────────────────────────────────────

  const getModalHeight = () => {
    if (readOnly) {
      // Let modal adjust naturally to the actual content height in read-only mode
      return undefined;
    }
    if (selectedFile || existingVideo) {
      return (isUploading && selectedFile) ? 530 : 480;
    }
    return undefined;
  };

  const getModalMinHeight = () => {
    if (readOnly) {
      return 150;
    }
    if (selectedFile || existingVideo) {
      return (isUploading && selectedFile) ? 390 : 320;
    }
    return 200;
  };

  return (
    <>
      <DraggableModal
        ref={draggableModalRef}
        open={open}
        onClose={handleClose}
        title={readOnly ? "View Inspection Video" : "Upload Inspection Video"}
        width={580}
        height={getModalHeight()}
        maskClosable={false}
        resizable={true}
        minWidth={400}
        minHeight={getModalMinHeight()}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 0" }}>

          {/* Parameter Info Banner */}
          {rowLabel && (
            <div
              style={{
                background: "linear-gradient(135deg, #f0eaf8 0%, #faf5ff 100%)",
                border: "1px solid #d8b4fe",
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7A4B78"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div style={{ fontSize: "13px", color: "#3b0764", fontWeight: 500 }}>
                {rowLabel}
              </div>
            </div>
          )}

          {isLoadingExisting ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "150px",
                gap: "12px",
                background: "#faf8fc",
                border: "1px dashed #c4b5d4",
                borderRadius: "10px",
                padding: "20px",
              }}
            >
              <Loader />
              <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                Checking for existing inspection video...
              </span>
            </div>
          ) : (
            <>
              {/* Drop Zone / File Picker */}
              {!(selectedFile || existingVideo) ? (
                readOnly ? (
                  <div
                    style={{
                      border: "1px dashed #d1d5db",
                      borderRadius: "10px",
                      padding: "40px 24px",
                      textAlign: "center",
                      background: "#f9fafb",
                      color: "#6b7280",
                    }}
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ display: "inline-block" }}
                      >
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 500 }}>
                      No video uploaded for this parameter.
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      border: isDraggingOver
                        ? "2px dashed #7A4B78"
                        : "2px dashed #c4b5d4",
                      borderRadius: "10px",
                      padding: "36px 24px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: isDraggingOver
                        ? "rgba(122, 75, 120, 0.05)"
                        : "#faf8fc",
                      transition: "all 0.2s ease",
                      userSelect: "none",
                    }}
                  >
                    {/* Camera / Video Icon */}
                    <div style={{ marginBottom: "12px" }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isDraggingOver ? "#7A4B78" : "#9c7fae"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>

                    <p style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 600, color: "#3b0764" }}>
                      {isDraggingOver ? "Drop your video here" : "Click to select or drag & drop a video"}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#78716c" }}>
                      Supported formats: <strong>MP4</strong>, <strong>WebM</strong>
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#78716c" }}>
                      Maximum file size: <strong>{MAX_VIDEO_SIZE_MB} MB</strong>
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_VIDEO_TYPES}
                      style={{ display: "none" }}
                      onChange={handleFileInputChange}
                    />
                  </div>
                )
              ) : (
                /* Selected / Existing File Preview Card */
                <div
                  style={{
                    border: "1px solid #d8b4fe",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {/* Video Preview */}
                  <div style={{ background: "#1a1a2e", lineHeight: 0 }}>
                    <video
                      key={previewUrl}
                      src={previewUrl}
                      controls
                      style={{
                        width: "100%",
                        maxHeight: "220px",
                        display: "block",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  {/* File Info Row */}
                  <div
                    style={{
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      background: "#faf8fc",
                      borderTop: "1px solid #f0e8f8",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      {/* File type badge */}
                      <div
                        style={{
                          background: "#7A4B78",
                          color: "#fff",
                          borderRadius: "4px",
                          padding: "2px 7px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          flexShrink: 0,
                          letterSpacing: "0.5px",
                        }}
                      >
                        {(selectedFile ? selectedFile.name : existingVideo?.FileName || "").toLowerCase().endsWith(".webm") ? "WebM" : "MP4"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          title={selectedFile ? selectedFile.name : existingVideo?.FileName || ""}
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#1e1b4b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "260px",
                          }}
                        >
                          {selectedFile ? selectedFile.name : existingVideo?.FileName || ""}
                        </div>
                        <div style={{ fontSize: "11px", color: "#78716c", marginTop: "2px" }}>
                          {selectedFile
                            ? formatFileSize(selectedFile.size)
                            : existingVideo?.ReceivedDate
                              ? `Uploaded: ${existingVideo.ReceivedDate}`
                              : "Uploaded Video"}
                        </div>
                      </div>
                    </div>

                    {/* Remove file button */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={handleRemoveAction}
                        disabled={isUploading}
                        title={selectedFile ? "Remove selected video" : "Delete video from server"}
                        style={{
                          background: "transparent",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          color: "#dc2626",
                          cursor: isUploading ? "not-allowed" : "pointer",
                          padding: "5px 7px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: isUploading ? 0.5 : 1,
                          flexShrink: 0,
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Upload Progress Bar */}
                  {isUploading && selectedFile && (
                    <div style={{ padding: "8px 14px 12px", borderTop: "1px solid #f0e8f8" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", color: "#6b21a8" }}>Uploading…</span>
                        <span style={{ fontSize: "11px", color: "#6b21a8", fontWeight: 600 }}>{uploadProgress}%</span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          background: "#e9d5f8",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${uploadProgress}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #7A4B78, #a855f7)",
                            borderRadius: "999px",
                            transition: "width 0.2s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Error Message */}
          {uploadError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                color: "#b91c1c",
                fontSize: "13px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: "1px" }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{uploadError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
            {/*<button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              style={{
                padding: "8px 20px",
                borderRadius: "7px",
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                color: "#374151",
                fontSize: "13px",
                fontWeight: 500,
                cursor: isUploading ? "not-allowed" : "pointer",
                opacity: isUploading ? 0.6 : 1,
                transition: "background 0.15s",
              }}
            >
              {readOnly ? "Close" : "Cancel"}
            </button>*/}

            {!readOnly && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                style={{
                  padding: "8px 22px",
                  borderRadius: "7px",
                  border: "none",
                  background:
                    !selectedFile || isUploading
                      ? "#c4b5d4"
                      : "linear-gradient(135deg, #7A4B78 0%, #9c3f9a 100%)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: !selectedFile || isUploading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  transition: "background 0.15s",
                }}
              >
                {isUploading && selectedFile ? (
                  <>
                    {/* Spinner */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ animation: "imvm-spin 0.8s linear infinite" }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Uploading…
                  </>
                ) : isUploading && !selectedFile ? (
                  <>
                    {/* Spinner */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ animation: "imvm-spin 0.8s linear infinite" }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Deleting…
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                    Upload Video
                  </>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Inline keyframe for spinner — scoped to this modal only */}
        <style>{`
        @keyframes imvm-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      </DraggableModal>

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        message={"this video"}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          // Re-focus DraggableModal so it stays on top after dialog closes
          setTimeout(() => draggableModalRef.current?.bringToFront(), 0);
          handleDeleteExisting();
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          // Re-focus DraggableModal so it stays on top after dialog closes
          setTimeout(() => draggableModalRef.current?.bringToFront(), 0);
        }}
      />
    </>
  );
};

export default InspectionVideoUploadModal;
