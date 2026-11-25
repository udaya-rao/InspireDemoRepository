using System.Data;
using System.Globalization;
using System.Text.RegularExpressions;
using CommonLib;
using CommonLib.Constants;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Repositories
{
    public class IFileUploadResp : IFileUpload
    {
        private readonly string IFileUploadRespLogClassName = "IFileUploadResp";

        #region [File Upload]

        /// <summary>
        /// This Method is Used to Upload The Files.
        /// </summary>
        /// <param name="_objCommonFileUploadRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> UploadFiles(CommonFileUploadRequestParam _objCommonFileUploadRequestParam)
        {
            DataSet finalDataSet = new DataSet();

            // Local helper to return your standard message dataset
            DataSet BuildError(string message)
            {
                List<string> cols = new List<string> { "Status", "Message" };
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), message }
                };
                return Helper.GenerateCommonMessage(cols, rows, _objCommonFileUploadRequestParam.TableName);
            }
            try
            {
                // Validate file data
                if (_objCommonFileUploadRequestParam.FileData == null || !_objCommonFileUploadRequestParam.FileData.Any())
                {
                    return BuildError("No Files Found In The Request. !!!");
                }

                // Validate base path
                if (string.IsNullOrWhiteSpace(_objCommonFileUploadRequestParam.BasePath))
                {
                    return BuildError(_objCommonFileUploadRequestParam.BasePathErrorMessage);
                }

                // Normalize paths (important for UNC)
                _objCommonFileUploadRequestParam.BasePath =
                    _objCommonFileUploadRequestParam.BasePath.Trim().Replace("/", "\\");

                _objCommonFileUploadRequestParam.FolderFullPath =
                    (_objCommonFileUploadRequestParam.FolderFullPath ?? string.Empty).Trim().Replace("/", "\\");

                // Allow BOTH: UNC path and Local rooted path
                bool isUNCPath = _objCommonFileUploadRequestParam.BasePath.StartsWith(@"\\");
                bool isLocalRooted = Path.IsPathFullyQualified(_objCommonFileUploadRequestParam.BasePath);

                if (!isUNCPath && !isLocalRooted)
                {
                    return BuildError(@"Invalid FileUploadPath. It must be a local path (C:\Folder) or a shared UNC path (\\Server\Share).");
                }

                // Ensure FolderFullPath is within BasePath (prevents path traversal / wrong combine)
                try
                {
                    var baseFull = Path.GetFullPath(_objCommonFileUploadRequestParam.BasePath)
                                       .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                       + Path.DirectorySeparatorChar;

                    var folderFull = Path.GetFullPath(_objCommonFileUploadRequestParam.FolderFullPath)
                                         .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                         + Path.DirectorySeparatorChar;

                    if (!folderFull.StartsWith(baseFull, StringComparison.OrdinalIgnoreCase))
                    {
                        return BuildError("Invalid folder path. FolderFullPath must be inside BasePath. !!!");
                    }
                }
                catch
                {
                    return BuildError("Invalid folder path format. !!!");
                }

                // Create directory with good error handling (UNC failures are common)
                try
                {
                    Directory.CreateDirectory(_objCommonFileUploadRequestParam.FolderFullPath);
                }
                catch (UnauthorizedAccessException)
                {
                    return BuildError("Access denied to the folder. Please grant Read/Write permission to the API service/IIS AppPool identity. !!!");
                }
                catch (DirectoryNotFoundException)
                {
                    return BuildError("Folder path not found. Please verify the path and connectivity. !!!");
                }
                catch (IOException ioEx)
                {
                    return BuildError($"Unable to create/access folder. {ioEx.Message}");
                }

                var saved = new List<object>();

                foreach (var file in _objCommonFileUploadRequestParam.FileData)
                {
                    if (file == null || file.Length <= 0)
                    {
                        saved.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Error),
                            FileName = "",
                            Message = "Empty file found in request. !!!"
                        });
                        continue;
                    }

                    var ext = Path.GetExtension(file.FileName);
                    var safeBase = CommonHelper.SanitizeFileName(Path.GetFileNameWithoutExtension(file.FileName));
                    if (string.IsNullOrWhiteSpace(safeBase)) safeBase = "File";

                    string uniqueName;
                    if (!string.IsNullOrEmpty(_objCommonFileUploadRequestParam.CustomFileName))
                    {
                        var safeCustom = CommonHelper.SanitizeFileName(_objCommonFileUploadRequestParam.CustomFileName);
                        if (string.IsNullOrWhiteSpace(safeCustom)) safeCustom = "File";
                        uniqueName = $"{safeCustom}{ext}";
                    }
                    else
                    {
                        uniqueName = $"{safeBase}_{DateTime.UtcNow.ToString(DateTimeFormatConstants.YYYYMMDDHHMMSSFFF_COMPACT_DATETIMEFORMAT)}{ext}";
                    }

                    var fullPath = Path.Combine(_objCommonFileUploadRequestParam.FolderFullPath, uniqueName);

                    try
                    {
                        using (var fs = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None, 64 * 1024, useAsync: true))
                        {
                            await file.CopyToAsync(fs);
                        }

                        saved.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Success),
                            FileName = uniqueName,
                            Message = "File Uploaded Successfully !!!"
                        });
                    }
                    catch (UnauthorizedAccessException)
                    {
                        saved.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Error),
                            FileName = uniqueName,
                            Message = "Access denied while saving file. Please check folder permissions. !!!"
                        });
                    }
                    catch (IOException ioEx)
                    {
                        saved.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Error),
                            FileName = uniqueName,
                            Message = $"File save failed. {ioEx.Message}"
                        });
                    }
                }

                // Folder details dataset
                var firstRecord = saved.FirstOrDefault();
                string SavedStatus = string.Empty;
                if (firstRecord != null)
                {
                    SavedStatus = (string)firstRecord.GetType().GetProperty("Status")?.GetValue(firstRecord);
                }

                List<string> HeaderColumns = new List<string> { "Status" };
                HeaderColumns.AddRange(_objCommonFileUploadRequestParam.DynamicHeaders ?? new List<string>());
                HeaderColumns.Add("Folder");

                List<string> headerRow = new List<string> { SavedStatus };
                headerRow.AddRange((_objCommonFileUploadRequestParam.DynamicRows ?? new List<string>()).Select(x => x?.ToString() ?? ""));
                headerRow.Add(_objCommonFileUploadRequestParam.FolderFullPath);

                List<List<string>> HeaderRows = new List<List<string>> { headerRow };
                var FolderDetailsDataSet = Helper.GenerateCommonMessage(HeaderColumns, HeaderRows, "FOLDER_DETAILS");

                // Uploaded response dataset
                List<string> UploadedColumns = new List<string> { "Status", "FileName", "Message" };
                List<List<string>> UploadedRows = new();

                foreach (var fileObj in saved)
                {
                    var type = fileObj.GetType();
                    string Status = type.GetProperty("Status")?.GetValue(fileObj)?.ToString() ?? "";
                    string FileName = type.GetProperty("FileName")?.GetValue(fileObj)?.ToString() ?? "";
                    string Message = type.GetProperty("Message")?.GetValue(fileObj)?.ToString() ?? "";

                    UploadedRows.Add(new List<string> { Status, FileName, Message });
                }

                var FileUploadedResponse = Helper.GenerateCommonMessage(UploadedColumns, UploadedRows, "UPLOADED_RESPONSE");
                if (Helper.CheckDataSetIsNullOrEmpty(FolderDetailsDataSet))
                {
                    finalDataSet.Merge(FolderDetailsDataSet);
                }
                if (Helper.CheckDataSetIsNullOrEmpty(FileUploadedResponse))
                {
                    finalDataSet.Merge(FileUploadedResponse);
                }
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IFileUploadRespLogClassName}.UploadFiles()", ex.ToString(), false);
                throw;
            }

            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to View Uploaded Files.
        /// </summary>
        /// <param name="_objCommonViewFileUploadRequestParam"></param>
        /// <param name="httpContextAccessor"></param>
        /// <returns></returns>
        public async Task<DataSet> ViewUploadedFiles(CommonViewFileUploadRequestParam _objCommonViewFileUploadRequestParam, IHttpContextAccessor httpContextAccessor)
        {
            DataSet finalDataSet = new DataSet();
            bool IsReturnFileContentAsBase64 = _objCommonViewFileUploadRequestParam.IsReturnFileContentAsBase64;
            DataSet BuildError(string message)
            {
                List<string> columns = new List<string> { "Status", "Message" };
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), message }
                };
                return Helper.GenerateCommonMessage(columns, rows, _objCommonViewFileUploadRequestParam.TableName);
            }
            try
            {
                if (string.IsNullOrWhiteSpace(_objCommonViewFileUploadRequestParam.BasePath))
                {
                    return BuildError(_objCommonViewFileUploadRequestParam.BasePathErrorMessage);
                }
                _objCommonViewFileUploadRequestParam.BasePath = _objCommonViewFileUploadRequestParam.BasePath.Trim().Replace("/", "\\");
                _objCommonViewFileUploadRequestParam.FolderFullPath = (_objCommonViewFileUploadRequestParam.FolderFullPath ?? string.Empty).Trim().Replace("/", "\\");

                // Allow BOTH: local rooted path + UNC path
                bool isUNCPath = _objCommonViewFileUploadRequestParam.BasePath.StartsWith(@"\\");
                bool isLocalRooted = Path.IsPathFullyQualified(_objCommonViewFileUploadRequestParam.BasePath);

                if (!isUNCPath && !isLocalRooted)
                {
                    return BuildError(@"Invalid FileUploadPath. It must be a local path (C:\Folder) or a shared UNC path (\\Server\Share).");
                }

                // Ensure FolderFullPath is within BasePath
                try
                {
                    var baseFull = Path.GetFullPath(_objCommonViewFileUploadRequestParam.BasePath)
                                       .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                       + Path.DirectorySeparatorChar;

                    var folderFull = Path.GetFullPath(_objCommonViewFileUploadRequestParam.FolderFullPath)
                                         .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                         + Path.DirectorySeparatorChar;

                    if (!folderFull.StartsWith(baseFull, StringComparison.OrdinalIgnoreCase))
                    {
                        return BuildError("Invalid folder path. FolderFullPath must be inside BasePath. !!!");
                    }
                }
                catch
                {
                    return BuildError("Invalid folder path format. !!!");
                }

                // Don't rely on Directory.Exists for UNC. It can return false on permission issues.
                try
                {
                    _ = Directory.EnumerateFileSystemEntries(_objCommonViewFileUploadRequestParam.FolderFullPath)
                                 .Take(1)
                                 .ToList();
                }
                catch (UnauthorizedAccessException)
                {
                    return BuildError("Access denied to the folder. Please grant permission to the API service/IIS AppPool identity. !!!");
                }
                catch (DirectoryNotFoundException)
                {
                    return BuildError("Files Not Found !!!");
                }
                catch (IOException ioEx)
                {
                    return BuildError($"Unable to access folder. {ioEx.Message}");
                }

                List<string> files = null;

                try
                {
                    if (string.IsNullOrWhiteSpace(_objCommonViewFileUploadRequestParam.FileName))
                    {
                        if (!string.IsNullOrEmpty(_objCommonViewFileUploadRequestParam.CustomFileName))
                        {
                            string searchToken = $"_{_objCommonViewFileUploadRequestParam.CustomFileName}.";
                            files = Directory.EnumerateFiles(_objCommonViewFileUploadRequestParam.FolderFullPath, "*", SearchOption.TopDirectoryOnly)
                                    .Where(x => Path.GetFileName(x).Contains(searchToken, StringComparison.OrdinalIgnoreCase))
                                    .OrderBy(x => x)
                                    .ToList();
                        }
                        else
                        {
                            if (!_objCommonViewFileUploadRequestParam.IsIncludeCustomFileName)
                            {
                                var excludeRegex = new Regex("_FileName[1-6]", RegexOptions.IgnoreCase);
                                files = Directory.EnumerateFiles(_objCommonViewFileUploadRequestParam.FolderFullPath, "*", SearchOption.TopDirectoryOnly)
                                    .Where(f =>
                                    {
                                        var fileName = Path.GetFileName(f);
                                        return !f.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
                                               && !excludeRegex.IsMatch(fileName);
                                    })
                                    .OrderByDescending(f => File.GetLastWriteTimeUtc(f))
                                    .ToList();
                            }
                            else
                            {
                                files = Directory.EnumerateFiles(_objCommonViewFileUploadRequestParam.FolderFullPath, "*", SearchOption.TopDirectoryOnly)
                                    .Where(f => !f.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                                    .OrderByDescending(f => File.GetLastWriteTimeUtc(f))
                                    .ToList();
                            }
                        }
                    }
                    else
                    {
                        string filePath = !string.IsNullOrEmpty(_objCommonViewFileUploadRequestParam.CustomFileName)
                            ? Path.Combine(_objCommonViewFileUploadRequestParam.FolderFullPath, _objCommonViewFileUploadRequestParam.CustomFileName)
                            : Path.Combine(_objCommonViewFileUploadRequestParam.FolderFullPath, _objCommonViewFileUploadRequestParam.FileName);

                        if (File.Exists(filePath))
                        {
                            files = new List<string> { filePath };
                        }
                        else
                        {
                            return BuildError("File Not Found !!!");
                        }
                    }
                }
                catch (UnauthorizedAccessException)
                {
                    return BuildError("Access denied to the folder. Please grant read permission to the API service/IIS AppPool identity. !!!");
                }
                catch (IOException ioEx)
                {
                    return BuildError($"Unable to read files from folder. {ioEx.Message}");
                }

                if (files == null || files.Count == 0)
                {
                    return BuildError("No Files Found !!!");
                }

                var results = new List<object>();

                foreach (var path in files)
                {
                    var fi = new FileInfo(path);
                    var contentType = CommonHelper.GetFileContentType(fi.Name);
                    var modifiedDate = File.GetLastWriteTime(path);
                    string formattedModifiedDate = modifiedDate.ToString(CommonHelper.KeyOption.IMFileUploadedModifiedDateFormat, CultureInfo.InvariantCulture);

                    var extension = fi.Extension.ToLowerInvariant();
                    string base64 = string.Empty;
                    string fileURL = string.Empty;
                    try
                    {
                        if(IsReturnFileContentAsBase64)
                        {
                            var bytes = File.ReadAllBytes(path);
                            base64 = Convert.ToBase64String(bytes);
                        }
                        else
                        {
                            string dynamicPath = string.Join("/", _objCommonViewFileUploadRequestParam.DynamicRows.Where(x => !string.IsNullOrWhiteSpace(x)).Select(Uri.EscapeDataString));
                            fileURL = $"{httpContextAccessor.HttpContext.Request.Scheme}://" + $"{httpContextAccessor.HttpContext.Request.Host}" + $"/InspectionVideos/{dynamicPath}/{Uri.EscapeDataString(fi.Name)}";
                        }
                    }
                    catch (UnauthorizedAccessException)
                    {
                        base64 = string.Empty;
                        fileURL = string.Empty;
                    }

                    if (IsReturnFileContentAsBase64)
                    {
                        results.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Success),
                            FileName = fi.Name,
                            ReceivedDate = formattedModifiedDate,
                            ContentType = contentType,
                            Base64 = base64
                        });
                    }
                    else
                    {
                        results.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Success),
                            FileName = fi.Name,
                            ReceivedDate = formattedModifiedDate,
                            ContentType = contentType,
                            FileURL = fileURL
                        });
                    }
                }

                List<string> ViewUploadedColumns = new List<string> { "Status", "FileName", "ReceivedDate", "ContentType", IsReturnFileContentAsBase64 ? "Base64" : "FileURL" };
                List<List<string>> ViewUploadedRows = new();

                foreach (var fileObj in results)
                {
                    var type = fileObj.GetType();
                    string Base64 = string.Empty;
                    string FileURL = string.Empty;
                    string Status = type.GetProperty("Status")?.GetValue(fileObj)?.ToString() ?? "";
                    string FileName = type.GetProperty("FileName")?.GetValue(fileObj)?.ToString() ?? "";
                    string ReceivedDate = type.GetProperty("ReceivedDate")?.GetValue(fileObj)?.ToString() ?? "";
                    string ContentType = type.GetProperty("ContentType")?.GetValue(fileObj)?.ToString() ?? "";
                    if(IsReturnFileContentAsBase64)
                    {
                        Base64 = type.GetProperty("Base64")?.GetValue(fileObj)?.ToString() ?? "";
                    }
                    else
                    {
                        FileURL = type.GetProperty("FileURL")?.GetValue(fileObj)?.ToString() ?? "";
                    }
                    ViewUploadedRows.Add(new List<string> { Status, FileName, ReceivedDate, ContentType, IsReturnFileContentAsBase64 ? Base64 : FileURL });
                }
                finalDataSet = Helper.GenerateCommonMessage(ViewUploadedColumns, ViewUploadedRows, _objCommonViewFileUploadRequestParam.TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IFileUploadRespLogClassName}.ViewUploadedFiles()", ex.ToString(), false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Delete Uploaded Files.
        /// </summary>
        /// <param name="_objCommonViewFileUploadRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> DeleteUploadedFiles(CommonViewFileUploadRequestParam _objCommonViewFileUploadRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            DataSet BuildError(string message)
            {
                List<string> cols = new List<string> { "Status", "Message" };
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), message }
                };
                return Helper.GenerateCommonMessage(cols, rows, _objCommonViewFileUploadRequestParam.TableName);
            }
            try
            {
                if (string.IsNullOrWhiteSpace(_objCommonViewFileUploadRequestParam.BasePath))
                {
                    return BuildError(_objCommonViewFileUploadRequestParam.BasePathErrorMessage);
                }
                _objCommonViewFileUploadRequestParam.BasePath =
                    _objCommonViewFileUploadRequestParam.BasePath.Trim().Replace("/", "\\");

                _objCommonViewFileUploadRequestParam.FolderFullPath =
                    (_objCommonViewFileUploadRequestParam.FolderFullPath ?? string.Empty).Trim().Replace("/", "\\");

                _objCommonViewFileUploadRequestParam.FileName =
                    (_objCommonViewFileUploadRequestParam.FileName ?? string.Empty).Trim();

                bool isUNCPath = _objCommonViewFileUploadRequestParam.BasePath.StartsWith(@"\\");
                bool isLocalRooted = Path.IsPathFullyQualified(_objCommonViewFileUploadRequestParam.BasePath);

                if (!isUNCPath && !isLocalRooted)
                {
                    return BuildError("Invalid FileUploadPath. It must be a local path (C:\\Folder) or a shared UNC path (\\\\Server\\Share).");
                }

                if (string.IsNullOrWhiteSpace(_objCommonViewFileUploadRequestParam.FolderFullPath))
                {
                    return BuildError("FolderFullPath is empty. !!!");
                }

                if (string.IsNullOrWhiteSpace(_objCommonViewFileUploadRequestParam.FileName))
                {
                    return BuildError("FileName is required to delete a file. !!!");
                }
                try
                {
                    var baseFull = Path.GetFullPath(_objCommonViewFileUploadRequestParam.BasePath)
                                       .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                       + Path.DirectorySeparatorChar;

                    var folderFull = Path.GetFullPath(_objCommonViewFileUploadRequestParam.FolderFullPath)
                                         .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                         + Path.DirectorySeparatorChar;

                    if (!folderFull.StartsWith(baseFull, StringComparison.OrdinalIgnoreCase))
                    {
                        return BuildError("Invalid folder path. FolderFullPath must be inside BasePath. !!!");
                    }
                }
                catch
                {
                    return BuildError("Invalid folder path format. !!!");
                }
                try
                {
                    _ = Directory.EnumerateFileSystemEntries(_objCommonViewFileUploadRequestParam.FolderFullPath).Take(1).ToList();
                }
                catch (UnauthorizedAccessException)
                {
                    return BuildError("Access denied to the folder. Please grant permission to the API service/IIS AppPool identity. !!!");
                }
                catch (DirectoryNotFoundException)
                {
                    return BuildError("Files Not Found !!!");
                }
                catch (IOException ioEx)
                {
                    return BuildError($"Unable to access folder. {ioEx.Message}");
                }

                // Build full file path safely
                // NOTE: Use Path.Combine instead of string + "\\" to avoid malformed paths
                string fullPath = Path.Combine(_objCommonViewFileUploadRequestParam.FolderFullPath, _objCommonViewFileUploadRequestParam.FileName);
                try
                {
                    var folderFull = Path.GetFullPath(_objCommonViewFileUploadRequestParam.FolderFullPath)
                                         .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                         + Path.DirectorySeparatorChar;

                    var fileFull = Path.GetFullPath(fullPath);
                    if (!fileFull.StartsWith(folderFull, StringComparison.OrdinalIgnoreCase))
                    {
                        return BuildError("Invalid FileName. File must be inside the folder. !!!");
                    }

                    fullPath = fileFull; // normalized final path
                }
                catch
                {
                    return BuildError("Invalid file path format. !!!");
                }

                var results = new List<object>();
                List<string> DeleteUploadedColumns = new List<string> { "Status", "FileName", "FilePath", "Message" };
                List<List<string>> DeleteUploadedRows = new();

                var fi = new FileInfo(fullPath);

                if (File.Exists(fullPath))
                {
                    try
                    {
                        // Prefer direct delete (instead of helper) so we can catch exact exceptions
                        // If you want to keep Helper.DeleteFile, you can, but then you lose exception detail.
                        File.Delete(fullPath);

                        // Verify deletion
                        if (!File.Exists(fullPath))
                        {
                            results.Add(new
                            {
                                Status = Helper.ToProperCase(MessageTypeConstants.Success),
                                FileName = fi.Name,
                                FilePath = fullPath,
                                Message = "File Deleted Successfully !!!"
                            });
                        }
                        else
                        {
                            results.Add(new
                            {
                                Status = Helper.ToProperCase(MessageTypeConstants.Error),
                                FileName = fi.Name,
                                FilePath = fullPath,
                                Message = "Failed To Delete File !!!"
                            });
                        }
                    }
                    catch (UnauthorizedAccessException)
                    {
                        results.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Error),
                            FileName = fi.Name,
                            FilePath = fullPath,
                            Message = "Access denied while deleting file. Please check permissions. !!!"
                        });
                    }
                    catch (IOException ioEx)
                    {
                        results.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Error),
                            FileName = fi.Name,
                            FilePath = fullPath,
                            Message = $"File delete failed. {ioEx.Message}"
                        });
                    }
                }
                else
                {
                    results.Add(new
                    {
                        Status = Helper.ToProperCase(MessageTypeConstants.Error),
                        FileName = fi.Name,
                        FilePath = fullPath,
                        Message = "File Not Found !!!"
                    });
                }

                foreach (var file in results)
                {
                    var type = file.GetType();
                    string Status = type.GetProperty("Status")?.GetValue(file)?.ToString() ?? "";
                    string FileName = type.GetProperty("FileName")?.GetValue(file)?.ToString() ?? "";
                    string FilePath = type.GetProperty("FilePath")?.GetValue(file)?.ToString() ?? "";
                    string Message = type.GetProperty("Message")?.GetValue(file)?.ToString() ?? "";
                    DeleteUploadedRows.Add(new List<string> { Status, FileName, FilePath, Message });
                }

                finalDataSet = Helper.GenerateCommonMessage(DeleteUploadedColumns, DeleteUploadedRows, _objCommonViewFileUploadRequestParam.TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IFileUploadRespLogClassName}.DeleteUploadedFiles()", ex.ToString(), false);
                throw;
            }
            return finalDataSet;
        }

        /// <summary>
        /// This Method is Used to Delete All Uploaded Files From Specific Path.
        /// </summary>
        /// <param name="_objCommonViewFileUploadRequestParam"></param>
        /// <returns></returns>
        public async Task<DataSet> DeleteAllUploadedFilesFromSpecificPath(CommonViewFileUploadRequestParam _objCommonViewFileUploadRequestParam)
        {
            DataSet finalDataSet = new DataSet();
            DataSet BuildError(string message)
            {
                List<string> cols = new List<string> { "Status", "Message" };
                List<List<string>> rows = new List<List<string>>
                {
                    new List<string> { Helper.ToProperCase(MessageTypeConstants.Error), message }
                };
                return Helper.GenerateCommonMessage(cols, rows, _objCommonViewFileUploadRequestParam.TableName);
            }
            try
            {
                if (string.IsNullOrWhiteSpace(_objCommonViewFileUploadRequestParam.BasePath))
                {
                    return BuildError(_objCommonViewFileUploadRequestParam.BasePathErrorMessage);
                }
                _objCommonViewFileUploadRequestParam.BasePath =
                    _objCommonViewFileUploadRequestParam.BasePath.Trim().Replace("/", "\\");

                _objCommonViewFileUploadRequestParam.FolderFullPath =
                    (_objCommonViewFileUploadRequestParam.FolderFullPath ?? string.Empty).Trim().Replace("/", "\\");

                _objCommonViewFileUploadRequestParam.FileName =
                    (_objCommonViewFileUploadRequestParam.FileName ?? string.Empty).Trim();

                bool isUNCPath = _objCommonViewFileUploadRequestParam.BasePath.StartsWith(@"\\");
                bool isLocalRooted = Path.IsPathFullyQualified(_objCommonViewFileUploadRequestParam.BasePath);

                if (!isUNCPath && !isLocalRooted)
                {
                    return BuildError("Invalid FileUploadPath. It must be a local path (C:\\Folder) or a shared UNC path (\\\\Server\\Share).");
                }

                if (string.IsNullOrWhiteSpace(_objCommonViewFileUploadRequestParam.FolderFullPath))
                {
                    return BuildError("FolderFullPath is empty. !!!");
                }
                try
                {
                    var baseFull = Path.GetFullPath(_objCommonViewFileUploadRequestParam.BasePath)
                                       .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                       + Path.DirectorySeparatorChar;

                    var folderFull = Path.GetFullPath(_objCommonViewFileUploadRequestParam.FolderFullPath)
                                         .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
                                         + Path.DirectorySeparatorChar;

                    if (!folderFull.StartsWith(baseFull, StringComparison.OrdinalIgnoreCase))
                    {
                        return BuildError("Invalid folder path. FolderFullPath must be inside BasePath. !!!");
                    }
                }
                catch
                {
                    return BuildError("Invalid folder path format. !!!");
                }
                try
                {
                    _ = Directory.EnumerateFileSystemEntries(_objCommonViewFileUploadRequestParam.FolderFullPath).Take(1).ToList();
                }
                catch (UnauthorizedAccessException)
                {
                    return BuildError("Access denied to the folder. Please grant permission to the API service/IIS AppPool identity. !!!");
                }
                catch (DirectoryNotFoundException)
                {
                    return BuildError("Files Not Found !!!");
                }
                catch (IOException ioEx)
                {
                    return BuildError($"Unable to access folder. {ioEx.Message}");
                }

                // Build full file path safely
                // NOTE: Use Path.Combine instead of string + "\\" to avoid malformed paths
                string fullPath = Path.Combine(_objCommonViewFileUploadRequestParam.FolderFullPath);
                try
                {
                    var fileFull = Path.GetFullPath(fullPath);
                    fullPath = fileFull; // normalized final path
                }
                catch
                {
                    return BuildError("Invalid file path format. !!!");
                }

                var results = new List<object>();
                List<string> DeleteUploadedColumns = new List<string> { "Status", "FileName", "FilePath", "Message" };
                List<List<string>> DeleteUploadedRows = new();

                var fi = new FileInfo(fullPath);

                if (Directory.Exists(fullPath))
                {
                    try
                    {
                        // Prefer direct delete (instead of helper) so we can catch exact exceptions
                        // If you want to keep Helper.DeleteFile, you can, but then you lose exception detail.
                        Directory.Delete(fullPath, true);

                        // Verify deletion
                        if (!Directory.Exists(fullPath))
                        {
                            results.Add(new
                            {
                                Status = Helper.ToProperCase(MessageTypeConstants.Success),
                                FileName = string.Empty,
                                FilePath = fullPath,
                                Message = "File Deleted Successfully !!!"
                            });
                        }
                        else
                        {
                            results.Add(new
                            {
                                Status = Helper.ToProperCase(MessageTypeConstants.Error),
                                FileName = string.Empty,
                                FilePath = fullPath,
                                Message = "Failed To Delete File !!!"
                            });
                        }
                    }
                    catch (UnauthorizedAccessException)
                    {
                        results.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Error),
                            FileName = string.Empty,
                            FilePath = fullPath,
                            Message = "Access denied while deleting file. Please check permissions. !!!"
                        });
                    }
                    catch (IOException ioEx)
                    {
                        results.Add(new
                        {
                            Status = Helper.ToProperCase(MessageTypeConstants.Error),
                            FileName = string.Empty,
                            FilePath = fullPath,
                            Message = $"File delete failed. {ioEx.Message}"
                        });
                    }
                }
                else
                {
                    results.Add(new
                    {
                        Status = Helper.ToProperCase(MessageTypeConstants.Error),
                        FileName = string.Empty,
                        FilePath = fullPath,
                        Message = "File Not Found !!!"
                    });
                }

                foreach (var file in results)
                {
                    var type = file.GetType();
                    string Status = type.GetProperty("Status")?.GetValue(file)?.ToString() ?? "";
                    string FileName = type.GetProperty("FileName")?.GetValue(file)?.ToString() ?? "";
                    string FilePath = type.GetProperty("FilePath")?.GetValue(file)?.ToString() ?? "";
                    string Message = type.GetProperty("Message")?.GetValue(file)?.ToString() ?? "";
                    DeleteUploadedRows.Add(new List<string> { Status, FileName, FilePath, Message });
                }

                finalDataSet = Helper.GenerateCommonMessage(DeleteUploadedColumns, DeleteUploadedRows, _objCommonViewFileUploadRequestParam.TableName);
            }
            catch (Exception ex)
            {
                Helper.LogMessage(CommonHelper.KeyOption.APIErrorLog, LogNameSpaceConstants.RepositoriesLogNamespace, $"{IFileUploadRespLogClassName}.DeleteAllUploadedFilesFromSpecificFolder()", ex.ToString(), false);
                throw;
            }
            return finalDataSet;
        }

        #endregion [File Upload]
    }
}
