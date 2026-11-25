using AutoMapper;
using InspireMagneticsWebAPI.DACHelper;
using InspireMagneticsWebAPI.Models;
using SimpleCrypto;

namespace InspireMagneticsWebAPI.Resolvers
{
    public class PasswordHashMappingAction<TSource, TDestination> : IMappingAction<TSource, TDestination>where TSource : IHasLoginPassword
    where TDestination : IHasPasswordHash
    {
        private readonly ICryptoService _cryptoService;
        private readonly int _saltSize;
        private readonly int _hashIterations;

        public PasswordHashMappingAction(ICryptoService cryptoService)
        {
            _cryptoService = cryptoService;
            _saltSize = 16;        // or read from config/constants
            _hashIterations = 100; // or read from config/constants
        }

        public void Process(TSource source, TDestination destination, ResolutionContext context)
        {
            // If no password entered, retain existing hash/salt (e.g., in updates)
            if (string.IsNullOrWhiteSpace(source.LoginPassword))
            {
                return;
            }

            // Generate hash + salt
            var (hash, salt) = CommonHelper.GeneratePasswordHash(
                source.LoginPassword,
                _cryptoService,
                _saltSize,
                _hashIterations
            );

            destination.EncryptedPassword = hash;
            destination.PasswordSalt = salt;
        }
    }


}
