// import React, { useState, useRef, useEffect } from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   Box,
//   Typography,
//   CircularProgress,
//   Alert,
//   IconButton,
//   Tooltip
// } from '@mui/material';
// import {
//   Close as CloseIcon,
//   Download as DownloadIcon,
//   Print as PrintIcon,
//   Fullscreen as FullscreenIcon
// } from '@mui/icons-material';

// const PDFPreview = ({ 
//   open, 
//   onClose, 
//   pdfData, 
//   title = "PDF Preview",
//   loading = false,
//   error = null 
// }) => {
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const iframeRef = useRef(null);

//   // Handle fullscreen toggle
//   const toggleFullscreen = () => {
//     setIsFullscreen(!isFullscreen);
//   };

//   // Handle download
//   const handleDownload = () => {
//     if (pdfData) {
//       const blob = new Blob([pdfData], { type: 'application/pdf' });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `${title.replace(/\s+/g, '_')}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);
//     }
//   };

//   // Handle print
//   const handlePrint = () => {
//     if (iframeRef.current) {
//       iframeRef.current.contentWindow.print();
//     }
//   };

//   // Create PDF blob URL for iframe
//   const pdfUrl = pdfData ? URL.createObjectURL(new Blob([pdfData], { type: 'application/pdf' })) : null;

//   // Cleanup URL on unmount or when pdfData changes
//   useEffect(() => {
//     return () => {
//       if (pdfUrl) {
//         URL.revokeObjectURL(pdfUrl);
//       }
//     };
//   }, [pdfUrl]);

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       maxWidth={isFullscreen ? false : 'lg'}
//       fullWidth
//       fullScreen={isFullscreen}
//       PaperProps={{
//         sx: {
//           height: isFullscreen ? '100vh' : '80vh',
//           maxHeight: isFullscreen ? '100vh' : '80vh',
//         }
//       }}
//     >
//       <DialogTitle sx={{ 
//         display: 'flex', 
//         justifyContent: 'space-between', 
//         alignItems: 'center',
//         pb: 1
//       }}>
//         <Typography variant="h6" component="div">
//           {title}
//         </Typography>
//         <Box sx={{ display: 'flex', gap: 1 }}>
//           <Tooltip title="Toggle Fullscreen">
//             <IconButton onClick={toggleFullscreen} size="small">
//               <FullscreenIcon />
//             </IconButton>
//           </Tooltip>
//           <Tooltip title="Close">
//             <IconButton onClick={onClose} size="small">
//               <CloseIcon />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       </DialogTitle>

//       <DialogContent sx={{ p: 0, position: 'relative' }}>
//         {loading && (
//           <Box
//             sx={{
//               position: 'absolute',
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//               backgroundColor: 'rgba(255, 255, 255, 0.8)',
//               zIndex: 1,
//             }}
//           >
//             <CircularProgress size={40} />
//             <Typography variant="body2" sx={{ mt: 2 }}>
//               Loading PDF...
//             </Typography>
//           </Box>
//         )}

//         {error && (
//           <Box sx={{ p: 2 }}>
//             <Alert severity="error">
//               {error}
//             </Alert>
//           </Box>
//         )}

//         {pdfUrl && !loading && !error && (
//           <iframe
//             ref={iframeRef}
//             src={pdfUrl}
//             width="100%"
//             height="100%"
//             style={{
//               border: 'none',
//               minHeight: '500px',
//             }}
//             title={title}
//           />
//         )}

//         {!pdfUrl && !loading && !error && (
//           <Box
//             sx={{
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//               height: '400px',
//               color: 'text.secondary',
//             }}
//           >
//             <Typography variant="h6" gutterBottom>
//               No PDF to display
//             </Typography>
//             <Typography variant="body2">
//               Select a print option to generate a PDF preview
//             </Typography>
//           </Box>
//         )}
//       </DialogContent>

//       <DialogActions sx={{ p: 2, gap: 1 }}>
//         <Button
//           onClick={handleDownload}
//           disabled={!pdfUrl || loading}
//           startIcon={<DownloadIcon />}
//           variant="outlined"
//         >
//           Download
//         </Button>
//         <Button
//           onClick={handlePrint}
//           disabled={!pdfUrl || loading}
//           startIcon={<PrintIcon />}
//           variant="outlined"
//         >
//           Print
//         </Button>
//         <Button onClick={onClose} variant="contained">
//           Close
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default PDFPreview;
