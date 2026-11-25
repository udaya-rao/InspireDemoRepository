using CommonLib;
using System.Data;
using InspireMagneticsWebAPI.Models;

namespace InspireMagneticsWebAPI.Contracts
{
    public interface IEmployee
    {
        #region [Employee Master]

        /// <summary>
        /// This Method Is Used To Save and Update Employee Master Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeMaster"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateEmployee(ODBCHelper _objODBCHelper, EmployeeMaster _objEmployeeMaster);

        /// <summary>
        /// This Method is Used to Get Employee Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeMasterDetailRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetEmployeeDetails(ODBCHelper _objODBCHelper, EmployeeMasterDetailRequestParam _objEmployeeMasterDetailRequestParam);

        /// <summary>
        /// This Method is Used to Get Employee Master List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeMasterListRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> GetEmployeeMasterList(ODBCHelper _objODBCHelper, EmployeeMasterListRequestParam _objEmployeeMasterListRequestParam);

		/// <summary>
		/// This Method is Used to Delete Employee Master List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objDeleteEmployeeMasterDetail"></param>
		/// <returns></returns>
		Task<DataSet> DeleteEmployeeMaster(ODBCHelper _objODBCHelper, DeleteEmployeeMasterDetail _objDeleteEmployeeMasterDetail);

        /// <summary>
        /// This Method is Used to Get Responsible Person List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <returns></returns>
        Task<DataSet> GetResponsiblePersonList(ODBCHelper _objODBCHelper);

        #endregion [Employee Master]

        #region [Employee Security Access]

        /// <summary>
        /// This Method Is Used To Save and Update Employee Security Access Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeSecurityAccessRequestParam"></param>
        /// <returns></returns>
        Task<DataSet> SaveAndUpdateEmployeeSecurityAccess(ODBCHelper _objODBCHelper, EmployeeSecurityAccessRequestParam _objEmployeeSecurityAccessRequestParam);

        /// <summary>
        /// This Method Is Used To Delete Employee Security Access Details.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeSecurityAccessDelete"></param>
        /// <returns></returns>
        Task<DataSet> DeleteEmployeeSecurityAccess(ODBCHelper _objODBCHelper, EmployeeSecurityAccessDelete _objEmployeeSecurityAccessDelete);

        /// <summary>
        /// This Method Is Used To Get Employee Security Access List.
        /// </summary>
        /// <param name="_objODBCHelper"></param>
        /// <param name="_objEmployeeSecurityAccessList"></param>
        /// <returns></returns>
        Task<DataSet> GetEmployeeSecurityAccessList(ODBCHelper _objODBCHelper, EmployeeSecurityAccessList _objEmployeeSecurityAccessList);

        #endregion [Employee Security Access]
    }
}
