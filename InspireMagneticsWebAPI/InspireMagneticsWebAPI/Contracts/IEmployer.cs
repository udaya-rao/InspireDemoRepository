using CommonLib;
using InspireMagneticsWebAPI.Models;
using System.Data;

namespace InspireMagneticsWebAPI.Contracts
{
	public interface IEmployer
	{
		#region [Employer Master]

		/// <summary>
		/// This Method Is Used To Save and Update Employer Details.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objEmployer"></param>
		/// <returns></returns>
		Task<DataSet> SaveAndUpdateEmployer(ODBCHelper _objODBCHelper, Employer _objEmployer);

		/// <summary>
		/// This Method is Used to Get Employer List.
		/// </summary>
		/// <param name="_objODBCHelper"></param>
		/// <param name="_objEmployerListRequestParam"></param>
		/// <returns></returns>
		Task<DataSet> GetEmployerList(ODBCHelper _objODBCHelper, EmployerListRequestParam _objEmployerListRequestParam);

		#endregion [Employer Master]
	}
}
