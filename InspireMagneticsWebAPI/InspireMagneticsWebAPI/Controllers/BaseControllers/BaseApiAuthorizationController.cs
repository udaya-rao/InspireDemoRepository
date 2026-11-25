using InspireMagneticsWebAPI.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InspireMagneticsWebAPI.Controllers.BaseControllers;

[Route("api/[controller]/[action]")]
[ApiController]
[Authorize]
[ServiceFilter(typeof(JwtAuthorizationFilter))]
public abstract class BaseApiAuthorizationController : ControllerBase
{
    protected CancellationToken RequestCancellationToken => HttpContext.RequestAborted;

    protected const string ControllerLogNamespace = "InspireMagneticsWebAPI.Controllers";
}