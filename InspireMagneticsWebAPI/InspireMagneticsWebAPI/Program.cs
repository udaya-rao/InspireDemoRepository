using System.IO.Compression;
using System.Reflection;
using System.Text;
using CommonLib;
using CommonLib.Constants;
using InspireMagneticsWebAPI.Contracts;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Filters;
using InspireMagneticsWebAPI.Middlewares;
using InspireMagneticsWebAPI.Models;
using InspireMagneticsWebAPI.Repositories;
using InspireMagneticsWebAPI.Resolvers;
using InspireMagneticsWebAPI.Service;
using log4net;
using log4net.Config;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SimpleCrypto;

var builder = WebApplication.CreateBuilder(args);
var logRepository = LogManager.GetRepository(Assembly.GetEntryAssembly());
XmlConfigurator.Configure(logRepository, new FileInfo("log4net.config"));

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins(Helper.AllowCorsURL);
            policy.AllowAnyHeader();
            policy.AllowAnyMethod();
            policy.AllowCredentials();
        });

});

// Add services to the container.
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddMvc(options =>
{
    options.RespectBrowserAcceptHeader = true;
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.IncludeFields = true;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 500 * 1024 * 1024;
});

builder.Services.AddResponseCompression(options =>
{
    // Compress both HTTP (default) and HTTPS responses.
    options.EnableForHttps = true;

    // Prefer Brotli.
    options.Providers.Add<BrotliCompressionProvider>();

    // Fallback to GZIP.
    options.Providers.Add<GzipCompressionProvider>();

    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        new[]
        {
            ContentTypeConstants.JSON_CONTENTTYPE,
            ContentTypeConstants.PROBLEM_JSON_CONTENTTYPE,
            ContentTypeConstants.TEXT_JSON_CONTENTTYPE,
            ContentTypeConstants.BINARY_CONTENTTYPE
        });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});

/*Auto Mapper*/

builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<EmployeeMasterProfile>();
	cfg.AddProfile<FGInventoryProfile>();
	cfg.AddProfile<InventoryProfile>();
	cfg.AddProfile<SupplierMasterProfile>();
	cfg.AddProfile<CustomerMasterProfile>();
	cfg.AddProfile<InspectionMasterProfile>();
    cfg.AddProfile<WorkOrderProfile>();
    cfg.AddProfile<JobCardProfile>();
    cfg.AddProfile<JobCardDailyProfile>();
    cfg.AddProfile<SendEmailRequestProfile>();
    cfg.AddProfile<PurchaseOrderProfile>();
    cfg.AddProfile<GRNProfile>();
    cfg.AddProfile<PurchaseOrderGRNProfile>();
    cfg.AddProfile<QuotationProfile>();
    cfg.AddProfile<InspectionProfile>();
    cfg.AddProfile<OrderProfile>();
    cfg.AddProfile<StoreRequestHeaderProfile>();
    cfg.AddProfile<StockAdjustmentRequestProfile>();
    cfg.AddProfile<DeliveryNoteProfile>();
    cfg.AddProfile<InventoryTransactionLogProfile>();
    cfg.AddProfile<SupplierItemsProfile>();
    cfg.AddProfile<BatchMasterProfile>();
}, typeof(EmployeeMasterProfile).Assembly, typeof(FGInventoryProfile).Assembly, typeof(InventoryProfile).Assembly, 
   typeof(SupplierMasterProfile).Assembly, typeof(CustomerMasterProfile).Assembly, typeof(InspectionMasterProfile).Assembly,
   typeof(WorkOrderProfile).Assembly, typeof(JobCardProfile).Assembly, typeof(JobCardDailyProfile).Assembly,
   typeof(SendEmailRequestProfile).Assembly, typeof(PurchaseOrderProfile).Assembly, typeof(GRNProfile).Assembly, 
   typeof(PurchaseOrderGRNProfile).Assembly, typeof(QuotationProfile).Assembly, typeof(InspectionProfile).Assembly, 
   typeof(OrderProfile).Assembly, typeof(StoreRequestHeaderProfile).Assembly, typeof(StockAdjustmentRequestProfile).Assembly,
   typeof(DeliveryNoteProfile).Assembly, typeof(InventoryTransactionLogProfile).Assembly, typeof(SupplierItemsProfile).Assembly,
   typeof(BatchMasterProfile).Assembly);


builder.Services.AddTransient(typeof(PasswordHashMappingAction<,>));

builder.Services.AddScoped<ICryptoService, PBKDF2>();

builder.Configuration.GetSection("MyApplicationKeys").Bind(CommonHelper.KeyOption);
Log4NetFileAppender.LogDirectory = CommonHelper.KeyOption.APIRequestBodyLog;
var DBConnectionString = DbConnectionHelper.GetDBConnectionString("DevOrProd", builder.Environment);
var bindJwtSettings = new JwtSettings();
builder.Configuration.Bind("JWTKeys", bindJwtSettings);
builder.Services.AddSingleton(bindJwtSettings);
builder.Services.AddScoped<TokenService>();
builder.Services.AddSingleton<ITokenStoreService, TokenStoreService>();
builder.Services.AddHttpContextAccessor();

// Register the JwtAuthorizationFilter in DI
builder.Services.AddScoped<JwtAuthorizationFilter>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var TokenStoreService = provider.GetRequiredService<ITokenStoreService>();
    return new JwtAuthorizationFilter(configuration, provider.GetRequiredService<ILogger<JwtAuthorizationFilter>>(), TokenStoreService);
});

builder.Services.AddScoped<ODBCHelper>(provider =>
{
    var httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
    var httpContext = httpContextAccessor.HttpContext;
    string UserName = httpContext?.Items["UserID"]?.ToString() ?? "UnknownUser";
    return new ODBCHelper(DBConnectionString, UserName, Convert.ToBoolean(CommonHelper.KeyOption.RequestDBScriptLoggingEnabled), CommonHelper.KeyOption.APIRequestDBScriptLog, Convert.ToInt32(CommonHelper.KeyOption.DBConnectionCommandTimeoutSeconds));
});

builder.Services.AddScoped<IUserLogin, IUserLoginResp>();
builder.Services.AddScoped<IFileUpload, IFileUploadResp>();
builder.Services.AddScoped<IOTP, IOTPResp>();
builder.Services.AddScoped<IEmployee, IEmployeeResp>();
builder.Services.AddScoped<IEmployer, IEmployerResp>();
builder.Services.AddScoped<IMaster, IMasterResp>();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Inspire Magnetics API Services",
        Version = "v1",
        Description = "An API to perform operations",
        TermsOfService = new Uri("https://example.com/terms"),
        Contact = new OpenApiContact
        {
            Name = "Amit Pukale",
            Email = "amit.p@saanvitechin.com"
        },
        //License = new OpenApiLicense
        //{
        //    Name = "Inspire Magnetics API LICX",
        //    Url = new Uri("https://example.com/license"),
        //}
    });

    // Add XML documentation
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization Header Using the Bearer Scheme. Enter The Bearer [space] add your token in the text input. Example Bearer hfdjhfjdh87888",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Scheme = "Bearer"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header
            },
            new List<string>()
        }
    });
});

// Configure JWT Authentication
var key = Encoding.UTF8.GetBytes(bindJwtSettings.IssuerSigningKey);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = bindJwtSettings.ValidateIssuer,
        ValidateAudience = bindJwtSettings.ValidateAudience,
        ValidateLifetime = bindJwtSettings.ValidateLifetime,
        ValidateIssuerSigningKey = bindJwtSettings.ValidateIssuerSigningKey,
        ValidIssuer = bindJwtSettings.ValidIssuer,
        ValidAudience = bindJwtSettings.ValidAudience,
        ClockSkew = TimeSpan.FromMinutes(5),
        RequireExpirationTime = bindJwtSettings.RequireExpirationTime,
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };

    // Optionally, you can add an event to handle failures like invalid tokens
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine("Authentication failed: " + context.Exception.Message);
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Console.WriteLine("Authorization failed. Sending 401 response.");
            return Task.CompletedTask;
        }
    };
});

var app = builder.Build();

await DatabaseWarmUp.WarmUpODBCDatabaseConnectionAsync(DBConnectionString, Convert.ToBoolean(CommonHelper.KeyOption.IsDataBaseWarmUpLogEnabled), CommonHelper.KeyOption.DataBaseWarmUpLog);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseStaticFiles();

// Compress responses before they are sent to the client.
app.UseResponseCompression();
app.UseHttpsRedirection();                         // Redirect HTTP to HTTPS
var webHostEnvironment = app.Services.GetRequiredService<IWebHostEnvironment>();
string inspectionVideosPath = CommonHelper.GetFolderUploadPathDetails(webHostEnvironment, "InspectionVideos");
if (!Directory.Exists(inspectionVideosPath))
{
    Directory.CreateDirectory(inspectionVideosPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(inspectionVideosPath),
    RequestPath = "/InspectionVideos"
});

app.UseRouting();                                  // Add this BEFORE CORS
app.UseCors(MyAllowSpecificOrigins);               // Enable CORS
app.UseMiddleware<GlobalErrorHandlingMiddleware>(); // Custom Middleware for Global Error Handling
app.UseAuthentication();                           // Authentication middleware
app.UseAuthorization();                            // Authorization middleware
app.UseMiddleware<RequestLoggingMiddleware>();     // Custom middleware for session validation and logging request body logs
app.MapControllers();                              // Map controllers to the request pipeline
app.Run();
