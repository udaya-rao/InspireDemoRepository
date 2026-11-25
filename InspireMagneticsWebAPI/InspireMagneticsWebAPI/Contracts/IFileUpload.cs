using System.Data;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Contracts
{
    public interface IFileUpload
    {

        #region [File Upload]

        /// <summary>
        /// This Method is Used to Upload The Files.
        /// </summary>
        /// <param name="_objCommonFileUploadRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> UploadFiles(CommonFileUploadRequestParam _objCommonFileUploadRequestParam);

        /// <summary>
        /// This Method is Used to View Uploaded Files.
        /// </summary>
        /// <param name="_objCommonViewFileUploadRequestParam"></param>
        /// <param name="httpContextAccessor"></param>
        /// <returns></returns>
        Task<DataSet> ViewUploadedFiles(CommonViewFileUploadRequestParam _objCommonViewFileUploadRequestParam, IHttpContextAccessor httpContextAccessor);

        /// <summary>
        /// This Method is Used to Delete Uploaded Files.
        /// </summary>
        /// <param name="_objCommonViewFileUploadRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> DeleteUploadedFiles(CommonViewFileUploadRequestParam _objCommonViewFileUploadRequestParam);

        /// <summary>
        /// This Method is Used to Delete All Uploaded Files From Specific Path.
        /// </summary>
        /// <param name="_objCommonViewFileUploadRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> DeleteAllUploadedFilesFromSpecificPath(CommonViewFileUploadRequestParam _objCommonViewFileUploadRequestParam);

        #endregion [File Upload]
    }
}
